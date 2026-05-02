import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ApplicationRecord {
  id: string;
  email: string;
  full_name: string;
  status: string;
  property_id: string;
  assigned_unit_id?: string;
  converted_user_id?: string;
  rejection_reason?: string;
  approved_at?: string;
  rejected_at?: string;
}

interface WebhookPayload {
  type: 'UPDATE';
  table: string;
  record: ApplicationRecord;
  old_record: ApplicationRecord;
}

// SMTP email sending using a simpler approach with fetch to an SMTP relay API
async function sendSmtpEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const SMTP_HOST = Deno.env.get('SMTP_HOST');
  const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
  const SMTP_USER = Deno.env.get('SMTP_USER');
  const SMTP_PASS = Deno.env.get('SMTP_PASS');
  const SMTP_FROM = Deno.env.get('SMTP_FROM') || 'Arena Homes <no-reply@arenahomes.co.ke>';

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return { success: false, error: 'SMTP configuration missing' };
  }

  try {
    // For production, consider using a service like SendGrid, Mailgun, or AWS SES
    // This is a simplified SMTP implementation
    const conn = await Deno.connect({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
    });

    const writer = conn.writable.getWriter();
    const reader = conn.readable.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper to read response
    const readResponse = async () => {
      const { value } = await reader.read();
      return decoder.decode(value);
    };

    // Helper to send command
    const sendCmd = async (cmd: string) => {
      await writer.write(encoder.encode(cmd + '\r\n'));
    };

    // Read greeting
    await readResponse();

    // EHLO
    await sendCmd(`EHLO supabase`);
    await readResponse();

    // STARTTLS for port 587
    if (SMTP_PORT === 587) {
      await sendCmd('STARTTLS');
      await readResponse();
      // Note: TLS upgrade would go here in production
    }

    // AUTH LOGIN
    await sendCmd('AUTH LOGIN');
    await readResponse();
    await sendCmd(btoa(SMTP_USER));
    await readResponse();
    await sendCmd(btoa(SMTP_PASS));
    await readResponse();

    // Mail from
    const fromEmail = SMTP_FROM.match(/<(.+)>/)?.[1] || SMTP_FROM;
    await sendCmd(`MAIL FROM:<${fromEmail}>`);
    await readResponse();

    // RCPT TO
    await sendCmd(`RCPT TO:<${to}>`);
    await readResponse();

    // DATA
    await sendCmd('DATA');
    await readResponse();

    // Build email
    const boundary = `----=_Part_${Date.now()}`;
    const emailContent = [
      `From: ${SMTP_FROM}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      text,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
      ``,
      `--${boundary}--`,
      `.`,
      ``,
    ].join('\r\n');

    await sendCmd(emailContent);
    await readResponse();

    // QUIT
    await sendCmd('QUIT');
    await readResponse();

    writer.releaseLock();
    reader.releaseLock();
    conn.close();

    return { success: true, messageId: `smtp-${Date.now()}` };
  } catch (error) {
    console.error('SMTP send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'SMTP failed' };
  }
}

// Generate secure setup token for accepted applicants
async function generateSetupToken(
  supabaseUrl: string,
  serviceRoleKey: string,
  applicationId: string,
  email: string
): Promise<string | null> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48-hour expiry

  // Simple SHA256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const tokenHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/tenant_setup_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        token_hash: tokenHash,
        application_id: applicationId,
        email: email,
        expires_at: expiresAt.toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to create setup token:', await response.text());
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error generating setup token:', error);
    return null;
  }
}

// Log email to outbox
async function logEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  {
    triggerType,
    relatedTable,
    relatedId,
    recipientEmail,
    subject,
    body,
    status,
    errorMessage,
  }: {
    triggerType: string;
    relatedTable: string;
    relatedId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
    errorMessage?: string;
  }
): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/rest/v1/email_notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        recipient_email: recipientEmail,
        subject,
        body,
        status,
        template_name: triggerType,
        metadata: {
          related_table: relatedTable,
          related_id: relatedId,
          error_message: errorMessage,
        },
        sent_at: status === 'SENT' ? new Date().toISOString() : null,
        error_message: errorMessage || null,
      }),
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

// Fetch property and unit details
async function fetchPropertyDetails(
  supabaseUrl: string,
  serviceRoleKey: string,
  propertyId: string,
  unitId?: string
): Promise<{ propertyName: string; unitNumber?: string } | null> {
  try {
    const propResponse = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}&select=name`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );

    if (!propResponse.ok) return null;
    const properties = await propResponse.json();
    const propertyName = properties[0]?.name || 'Arena Homes';

    let unitNumber: string | undefined;
    if (unitId) {
      const unitResponse = await fetch(
        `${supabaseUrl}/rest/v1/units?id=eq.${unitId}&select=room_number`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      if (unitResponse.ok) {
        const units = await unitResponse.json();
        unitNumber = units[0]?.room_number;
      }
    }

    return { propertyName, unitNumber };
  } catch (error) {
    console.error('Error fetching property details:', error);
    return null;
  }
}

// Delete rejected application
async function deleteApplication(
  supabaseUrl: string,
  serviceRoleKey: string,
  applicationId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/tenant_applications?id=eq.${applicationId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Prefer': 'return=minimal',
        },
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Failed to delete application:', error);
    return false;
  }
}

// Send acceptance email with setup link
async function sendAcceptanceEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  siteUrl: string,
  application: ApplicationRecord
): Promise<{ success: boolean; error?: string }> {
  const setupToken = await generateSetupToken(supabaseUrl, serviceRoleKey, application.id, application.email);
  if (!setupToken) {
    return { success: false, error: 'Failed to generate setup token' };
  }

  const setupLink = `${siteUrl}/tenant/setup?token=${setupToken}`;
  const details = await fetchPropertyDetails(supabaseUrl, serviceRoleKey, application.property_id, application.assigned_unit_id);

  const propertyName = details?.propertyName || 'Arena Homes';
  const unitInfo = details?.unitNumber ? `Room ${details.unitNumber}` : '';

  const subject = 'Congratulations! Your Arena Homes Application Was Accepted';

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Accepted - Arena Homes</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #10B981; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Congratulations! 🎉</h1>
    <p>Your Application Was Accepted</p>
  </div>
  <div class="content">
    <p>Hello ${application.full_name},</p>
    <p>Great news! Your application for accommodation at <strong>${propertyName}</strong> has been <strong>accepted</strong>.</p>
    <div class="info-box">
      <strong>Your Assigned Unit:</strong><br>
      ${unitInfo || 'Details available in your dashboard'}
    </div>
    <p>To activate your tenant dashboard, please set your password by clicking the button below:</p>
    <center>
      <a href="${setupLink}" class="button">Set Your Password</a>
    </center>
    <p>Or copy this link:</p>
    <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${setupLink}</p>
    <p><strong>After setting your password:</strong></p>
    <ul>
      <li>Login using your email: <strong>${application.email}</strong></li>
      <li>Access your tenant dashboard to view property details</li>
    </ul>
    <p>This link expires in 48 hours.</p>
    <p>Welcome to Arena Homes!</p>
    <div class="footer">
      <p>Best regards,<br>The Arena Homes Team</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `Hello ${application.full_name},

Congratulations! Your application for accommodation at ${propertyName} has been ACCEPTED.

Your Assigned Unit: ${unitInfo || 'See dashboard'}

To activate your tenant dashboard, please set your password by visiting:
${setupLink}

This link expires in 48 hours.

After setting your password:
- Login using your email: ${application.email}
- Access your tenant dashboard

Welcome to Arena Homes!

Best regards,
The Arena Homes Team`;

  const result = await sendSmtpEmail({
    to: application.email,
    subject,
    html: htmlBody,
    text: textBody,
  });

  await logEmail(supabaseUrl, serviceRoleKey, {
    triggerType: 'APPLICATION_ACCEPTED',
    relatedTable: 'tenant_applications',
    relatedId: application.id,
    recipientEmail: application.email,
    subject,
    body: textBody,
    status: result.success ? 'SENT' : 'FAILED',
    errorMessage: result.error,
  });

  return result;
}

// Send rejection email
async function sendRejectionEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  application: ApplicationRecord
): Promise<{ success: boolean; error?: string }> {
  const details = await fetchPropertyDetails(supabaseUrl, serviceRoleKey, application.property_id);
  const propertyName = details?.propertyName || 'Arena Homes';

  const reason = application.rejection_reason || 'Unfortunately, all available units are currently occupied or your application did not meet our current requirements.';

  const subject = 'Arena Homes Application Update';

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update - Arena Homes</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
    .reason-box { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Application Update</h1>
  </div>
  <div class="content">
    <p>Hello ${application.full_name},</p>
    <p>Thank you for your interest in Arena Homes and for submitting your application for accommodation at <strong>${propertyName}</strong>.</p>
    <p>After careful consideration, we regret to inform you that we are unable to approve your application at this time.</p>
    <div class="reason-box">
      <strong>Reason:</strong><br>
      ${reason}
    </div>
    <p>You may apply for another available property on Arena Homes at any time.</p>
    <p>We appreciate your understanding.</p>
    <div class="footer">
      <p>Best regards,<br>The Arena Homes Team</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `Hello ${application.full_name},

Thank you for your interest in Arena Homes and for submitting your application for accommodation at ${propertyName}.

After careful consideration, we regret to inform you that we are unable to approve your application at this time.

Reason:
${reason}

You may apply for another available property on Arena Homes at any time.

We appreciate your understanding.

Best regards,
The Arena Homes Team`;

  const result = await sendSmtpEmail({
    to: application.email,
    subject,
    html: htmlBody,
    text: textBody,
  });

  await logEmail(supabaseUrl, serviceRoleKey, {
    triggerType: 'APPLICATION_REJECTED',
    relatedTable: 'tenant_applications',
    relatedId: application.id,
    recipientEmail: application.email,
    subject,
    body: textBody,
    status: result.success ? 'SENT' : 'FAILED',
    errorMessage: result.error,
  });

  // Delete the application after sending rejection email
  if (result.success) {
    await deleteApplication(supabaseUrl, serviceRoleKey, application.id);
  }

  return result;
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const webhookSecret = req.headers.get('x-webhook-secret');
  const expectedSecret = Deno.env.get('WEBHOOK_SECRET');

  if (expectedSecret && webhookSecret !== expectedSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload: WebhookPayload = await req.json();

    if (!payload.record || !payload.old_record) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { record, old_record } = payload;

    // Only process status changes from WAITING
    if (old_record.status !== 'WAITING') {
      return new Response(
        JSON.stringify({ message: 'Not a WAITING application, skipping' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if no status change
    if (old_record.status === record.status) {
      return new Response(
        JSON.stringify({ message: 'No status change, skipping' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: { success: boolean; error?: string };

    if (record.status === 'ACCEPTED') {
      if (!record.assigned_unit_id) {
        return new Response(
          JSON.stringify({ error: 'No unit assigned' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result = await sendAcceptanceEmail(supabaseUrl, serviceRoleKey, siteUrl, record);
    } else if (record.status === 'REJECTED') {
      result = await sendRejectionEmail(supabaseUrl, serviceRoleKey, record);
    } else {
      return new Response(
        JSON.stringify({ message: `Status '${record.status}' not handled` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.success ? 'Email sent successfully' : 'Email failed',
        status: record.status
      }),
      { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
