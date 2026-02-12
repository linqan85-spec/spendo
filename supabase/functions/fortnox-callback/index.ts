import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // company_id
    const error = url.searchParams.get("error");

    // Determine the app's base URL for redirects
    const appBaseUrl =
      Deno.env.get("APP_BASE_URL") || "https://spendo1.lovable.app";

    if (error) {
      console.error("Fortnox OAuth error:", error);
      return Response.redirect(
        `${appBaseUrl}/integrations?fortnox_error=${encodeURIComponent(error)}`,
        302
      );
    }

    if (!code || !state) {
      return Response.redirect(
        `${appBaseUrl}/integrations?fortnox_error=missing_params`,
        302
      );
    }

    const clientId = Deno.env.get("FORTNOX_CLIENT_ID");
    const clientSecret = Deno.env.get("FORTNOX_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!clientId || !clientSecret) {
      console.error("Missing FORTNOX_CLIENT_ID or FORTNOX_CLIENT_SECRET");
      return Response.redirect(
        `${appBaseUrl}/integrations?fortnox_error=server_config`,
        302
      );
    }

    // Exchange authorization code for tokens
    const redirectUri = `${supabaseUrl}/functions/v1/fortnox-callback`;
    const tokenResponse = await fetch(
      "https://apps.fortnox.se/oauth-v1/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + btoa(`${clientId}:${clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Fortnox token exchange failed:", tokenResponse.status, errText);
      return Response.redirect(
        `${appBaseUrl}/integrations?fortnox_error=token_exchange`,
        302
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token } = tokens;

    if (!access_token || !refresh_token) {
      console.error("Missing tokens in response:", tokens);
      return Response.redirect(
        `${appBaseUrl}/integrations?fortnox_error=invalid_tokens`,
        302
      );
    }

    // Save tokens to integrations table using service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const companyId = state;

    // Check if integration already exists
    const { data: existing } = await supabase
      .from("integrations")
      .select("id")
      .eq("company_id", companyId)
      .eq("provider", "fortnox")
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("integrations")
        .update({
          access_token,
          refresh_token,
          status: "active",
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Error updating integration:", updateError);
        return Response.redirect(
          `${appBaseUrl}/integrations?fortnox_error=db_error`,
          302
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from("integrations")
        .insert({
          company_id: companyId,
          provider: "fortnox",
          access_token,
          refresh_token,
          status: "active",
        });

      if (insertError) {
        console.error("Error inserting integration:", insertError);
        return Response.redirect(
          `${appBaseUrl}/integrations?fortnox_error=db_error`,
          302
        );
      }
    }

    console.log("Fortnox OAuth completed successfully for company:", companyId);
    return Response.redirect(
      `${appBaseUrl}/integrations?fortnox_success=true`,
      302
    );
  } catch (err) {
    console.error("Unexpected error in fortnox-callback:", err);
    const appBaseUrl =
      Deno.env.get("APP_BASE_URL") || "https://spendo1.lovable.app";
    return Response.redirect(
      `${appBaseUrl}/integrations?fortnox_error=unexpected`,
      302
    );
  }
});
