import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshFortnoxToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch("https://apps.fortnox.se/oauth-v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${errText}`);
  }

  return await res.json();
}

async function fortnoxGet(
  path: string,
  accessToken: string
): Promise<Response> {
  return await fetch(`https://api.fortnox.se/3${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("FORTNOX_CLIENT_ID")!;
    const clientSecret = Deno.env.get("FORTNOX_CLIENT_SECRET")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ error: "No company found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const companyId = profile.company_id;

    // Check subscription status - block sync if trial expired and no active subscription
    const { data: company } = await supabase
      .from("companies")
      .select("subscription_status, trial_ends_at")
      .eq("id", companyId)
      .single();

    if (company) {
      const isTrialing =
        company.subscription_status === "trialing" &&
        company.trial_ends_at &&
        new Date(company.trial_ends_at) > new Date();
      const isActive = company.subscription_status === "active";

      if (!isTrialing && !isActive) {
        console.log("Sync blocked: no active subscription or trial expired");
        return new Response(
          JSON.stringify({
            error: "Subscription required",
            message: "Din provperiod har löpt ut. Uppgradera för att fortsätta synka.",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get Fortnox integration
    const { data: integration, error: intError } = await supabase
      .from("integrations")
      .select("*")
      .eq("company_id", companyId)
      .eq("provider", "fortnox")
      .eq("status", "active")
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: "No active Fortnox integration" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let accessToken = integration.access_token;
    let currentRefreshToken = integration.refresh_token;

    // Try a test call; if 401 then refresh token
    let testRes = await fortnoxGet("/companyinformation", accessToken);
    if (testRes.status === 401) {
      console.log("Access token expired, refreshing...");
      try {
        const newTokens = await refreshFortnoxToken(
          currentRefreshToken,
          clientId,
          clientSecret
        );
        accessToken = newTokens.access_token;
        currentRefreshToken = newTokens.refresh_token;

        // Save new tokens
        await supabase
          .from("integrations")
          .update({
            access_token: accessToken,
            refresh_token: currentRefreshToken,
          })
          .eq("id", integration.id);

        // Consume the old test response body
        await testRes.text();
      } catch (refreshErr) {
        await testRes.text();
        console.error("Token refresh failed:", refreshErr);
        await supabase
          .from("integrations")
          .update({ status: "error" })
          .eq("id", integration.id);

        return new Response(
          JSON.stringify({
            error: "Token refresh failed. Please reconnect Fortnox.",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      await testRes.text();
    }

    // Fetch supplier invoices with pagination
    let allInvoices: any[] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const res = await fortnoxGet(
        `/supplierinvoices?limit=${limit}&page=${page}`,
        accessToken
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Failed to fetch invoices page ${page}:`, res.status, errText);
        break;
      }

      const data = await res.json();
      const invoices = data?.SupplierInvoices || [];

      if (invoices.length === 0) break;
      allInvoices = allInvoices.concat(invoices);

      if (invoices.length < limit) break;
      page++;
    }

    console.log(`Fetched ${allInvoices.length} supplier invoices from Fortnox`);

    // Process invoices: create vendors and expenses
    let vendorsCreated = 0;
    let expensesCreated = 0;
    let expensesUpdated = 0;

    // Build unique supplier names
    const supplierNames = [
      ...new Set(
        allInvoices
          .map((inv: any) => inv.SupplierName)
          .filter(Boolean)
      ),
    ];

    // Upsert vendors
    const vendorMap: Record<string, string> = {};

    for (const name of supplierNames) {
      const normalizedName = (name as string).toLowerCase().trim();

      // Check if vendor already exists
      const { data: existingVendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("company_id", companyId)
        .eq("normalized_name", normalizedName)
        .single();

      if (existingVendor) {
        vendorMap[name as string] = existingVendor.id;
      } else {
        const { data: newVendor, error: vendorErr } = await supabase
          .from("vendors")
          .insert({
            company_id: companyId,
            name: name as string,
            normalized_name: normalizedName,
            default_category: "ovrigt",
          })
          .select("id")
          .single();

        if (vendorErr) {
          console.error(`Error creating vendor ${name}:`, vendorErr);
        } else if (newVendor) {
          vendorMap[name as string] = newVendor.id;
          vendorsCreated++;
        }
      }
    }

    // Upsert expenses from invoices
    for (const inv of allInvoices) {
      const externalId = `fortnox-si-${inv.GivenNumber || inv.InvoiceNumber}`;
      const vendorId = inv.SupplierName
        ? vendorMap[inv.SupplierName] || null
        : null;

      // Check if expense already exists
      const { data: existingExpense } = await supabase
        .from("expenses")
        .select("id")
        .eq("company_id", companyId)
        .eq("external_id", externalId)
        .single();

      const expenseData = {
        company_id: companyId,
        vendor_id: vendorId,
        amount: Math.abs(inv.Total || 0),
        vat_amount: inv.VAT || 0,
        transaction_date: inv.InvoiceDate || new Date().toISOString().split("T")[0],
        description: inv.InvoiceNumber
          ? `Fortnox faktura #${inv.InvoiceNumber}`
          : "Fortnox leverantörsfaktura",
        external_id: externalId,
        type: "invoice" as const,
        category: "ovrigt" as const,
        currency: inv.Currency || "SEK",
      };

      if (existingExpense) {
        const { error: updateErr } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", existingExpense.id);

        if (updateErr) {
          console.error(`Error updating expense ${externalId}:`, updateErr);
        } else {
          expensesUpdated++;
        }
      } else {
        const { error: insertErr } = await supabase
          .from("expenses")
          .insert(expenseData);

        if (insertErr) {
          console.error(`Error creating expense ${externalId}:`, insertErr);
        } else {
          expensesCreated++;
        }
      }
    }

    // Update last_synced_at
    await supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integration.id);

    const result = {
      success: true,
      invoices_fetched: allInvoices.length,
      vendors_created: vendorsCreated,
      expenses_created: expensesCreated,
      expenses_updated: expensesUpdated,
    };

    console.log("Fortnox sync completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in fortnox-sync:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
