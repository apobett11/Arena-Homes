import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type RequestBody = {
  email_outbox_id?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") ?? "Arena Homes <onboarding@resend.dev>";

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { success: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        500,
      );
    }

    if (!resendApiKey) {
      return jsonResponse(
        { success: false, error: "Missing RESEND_API_KEY" },
        500,
      );
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const emailOutboxId = body.email_outbox_id;

    if (!emailOutboxId) {
      return jsonResponse(
        { success: false, error: "email_outbox_id is required" },
        400,
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: emailRow, error: fetchError } = await supabase
      .from("email_outbox")
      .select("*")
      .eq("id", emailOutboxId)
      .single();

    if (fetchError || !emailRow) {
      return jsonResponse(
        {
          success: false,
          error: "Email outbox row not found",
          detail: fetchError?.message ?? null,
        },
        404,
      );
    }

    if (emailRow.status === "SENT") {
      return jsonResponse({
        success: true,
        already_sent: true,
        email_outbox_id: emailOutboxId,
        provider_message_id: emailRow.provider_message_id,
      });
    }

    await supabase
      .from("email_outbox")
      .update({
        status: "SENDING",
        attempted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", emailOutboxId);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [emailRow.recipient_email],
        subject: emailRow.subject,
        html: emailRow.html_body,
        text: emailRow.text_body ?? undefined,
      }),
    });

    const resendPayload = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      const errorMessage = JSON.stringify(resendPayload);

      await supabase
        .from("email_outbox")
        .update({
          status: "FAILED",
          error: errorMessage,
          attempted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          provider: "resend",
        })
        .eq("id", emailOutboxId);

      return jsonResponse(
        {
          success: false,
          error: "Resend failed to send email",
          detail: resendPayload,
          email_outbox_id: emailOutboxId,
        },
        502,
      );
    }

    const providerMessageId = resendPayload?.id ?? null;

    await supabase
      .from("email_outbox")
      .update({
        status: "SENT",
        provider: "resend",
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString(),
        attempted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", emailOutboxId);

    return jsonResponse({
      success: true,
      email_outbox_id: emailOutboxId,
      provider: "resend",
      provider_message_id: providerMessageId,
      recipient_email: emailRow.recipient_email,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}