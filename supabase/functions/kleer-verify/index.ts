import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[KLEER-VERIFY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, reason: "method_not_allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const body = await req.json();
    const accessToken = typeof body?.accessToken === "string" ? body.accessToken.trim() : "";
    const kleerCompanyId = typeof body?.kleerCompanyId === "string" ? body.kleerCompanyId.trim() : "";

    if (!accessToken || !kleerCompanyId) {
      return new Response(JSON.stringify({ ok: false, reason: "missing_fields" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const url = `https://api.kleer.se/v1/companies/${encodeURIComponent(kleerCompanyId)}`;
    logStep("Verifying credentials", { url });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.ok) {
      logStep("Verification succeeded");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (response.status === 401 || response.status === 403) {
      logStep("Invalid credentials", { status: response.status });
      return new Response(JSON.stringify({ ok: false, reason: "invalid_credentials" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (response.status === 404) {
      logStep("Invalid company id", { status: response.status });
      return new Response(JSON.stringify({ ok: false, reason: "invalid_company" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Upstream error", { status: response.status });
    return new Response(JSON.stringify({ ok: false, reason: "upstream_error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ ok: false, reason: "exception" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
