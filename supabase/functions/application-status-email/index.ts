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

// SMTP email sending using Deno
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
    // Simple SMTP sending using Deno TCP
    const conn = await Deno.connect({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
    });

    const writer = conn.writable.getWriter();
    const reader = conn.readable.getReader();

    // Read server greeting
    await reader.read();

    // EHLO
    await writer.write(new TextEncoder().encode(`EHLO arenahomes.co.ke\r\n`));
    await reader.read();

    // STARTTLS if port is 587
    if (SMTP_PORT === 587) {
      await writer.write(new TextEncoder().encode(`STARTTLS\r\n`));
      await reader.read();
      // Note: In production, you'd upgrade to TLS here
    }

    // AUTH LOGIN
    await writer.write(new TextEncoder().encode(`AUTH LOGIN\r\n`));
    await reader.read();

    // Send credentials (base64 encoded)
    await writer.write(new TextEncoder().encode(`${btoa(SMTP_USER)}\r\n`));
    await reader.read();
    await writer.write(new TextEncoder().encode(`${btoa(SMTP_PASS)}\r\n`));
    await reader.read();

    // MAIL FROM
    await writer.write(new TextEncoder().encode(`MAIL FROM:<${SMTP_FROM.replace(/.*<|>.*/g, '')}>\r\n`));
    await reader.read();

    // RCPT TO
    await writer.write(new TextEncoder().encode(`RCPT TO:<${to}>\r\n`));
    await reader.read();

    // DATA
    await writer.write(new TextEncoder().encode(`DATA\r\n`));
    await reader.read();

    // Build email content
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

    await writer.write(new TextEncoder().encode(emailContent + '\r\n'));
    await reader.read();

    // QUIT
    await writer.write(new TextEncoder().encode(`QUIT\r\n`));
    await reader.read();

    writer.releaseLock();
    reader.releaseLock();
    conn.close();

    return { success: true, messageId: `smtp-${Date.now()}` };
  } catch (error) {
    console.error('SMTP send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'SMTP connection failed' };
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
        token_hash: await hashToken(token),
        application_id: applicationId,
        email: email,
        expires_at: expiresAt.toISOString(),
        used_at: null,
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

// Simple hash for token storage
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    // Fetch property
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

    // Fetch unit if provided
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
  const unitInfo = details?.unitNumber ? `Unit: Room ${details.unitNumber}` : '';

  const subject = 'Congratulations — Your Arena Homes Application Was Accepted';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Accepted - Arena Homes</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 15px 0; }
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
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${setupLink}</p>
    
    <p><strong>After setting your password:</strong></p>
    <ul>
      <li>Login using your email: <strong>${application.email}</strong></li>
      <li>Use the password you just created</li>
      <li>Access your tenant dashboard to view your property and unit details</li>
    </ul>
    
    <p>This link expires in 48 hours for security reasons.</p>
    
    <p>Welcome to Arena Homes!</p>
    
    <div class="footer">
      <p>Best regards,<br>The Arena Homes Team</p>
      <p>If you did not apply for accommodation at Arena Homes, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

  const textBody = `
Hello ${application.full_name},

Congratulations! Your application for accommodation at ${propertyName} has been ACCEPTED.

Your Assigned Unit:
${unitInfo || 'Details available in your dashboard'}

To activate your tenant dashboard, please set your password by visiting:
${setupLink}

This link expires in 48 hours for security reasons.

After setting your password:
- Login using your email: ${application.email}
- Use the password you just created
- Access your tenant dashboard to view your property and unit details

Welcome to Arena Homes!

Best regards,
The Arena Homes Team

If you did not apply for accommodation at Arena Homes, please ignore this email.
`;

  // Send via SMTP
  const result = await sendSmtpEmail({
    to: application.email,
    subject,
    html: htmlBody,
    text: textBody,
  });

  // Log the result
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

  const htmlBody = `
<!DOCTYPE html>
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
    
    <p>We appreciate your understanding and wish you the best in finding suitable accommodation.</p>
    
    <div class="footer">
      <p>Best regards,<br>The Arena Homes Team</p>
    </div>
  </div>
</body>
</html>
`;

  const textBody = `
Hello ${application.full_name},

Thank you for your interest in Arena Homes and for submitting your application for accommodation at ${propertyName}.

After careful consideration, we regret to inform you that we are unable to approve your application at this time.

Reason:
${reason}

You may apply for another available property on Arena Homes at any time.

We appreciate your understanding and wish you the best in finding suitable accommodation.

Best regards,
The Arena Homes Team
`;

  // Send via SMTP
  const result = await sendSmtpEmail({
    to: application.email,
    subject,
    html: htmlBody,
    text: textBody,
  });

  // Log the result
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

  return result;
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify webhook secret
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

    // Validate payload
    if (!payload.record || !payload.old_record) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: missing record or old_record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { record, old_record } = payload;

    // Only process status changes from PENDING/WAITING to ACCEPTED/APPROVED or REJECTED
    const oldStatus = old_record.status;
    const newStatus = record.status;

    // Skip if status didn't change
    if (oldStatus === newStatus) {
      return new Response(
        JSON.stringify({ message: 'No status change detected, skipping' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process valid transitions
    const validOldStatuses = ['PENDING', 'WAITING', 'CARETAKER_APPROVED'];
    const validNewStatuses = ['ACCEPTED', 'APPROVED', 'REJECTED'];

    if (!validOldStatuses.includes(oldStatus)) {
      return new Response(
        JSON.stringify({ message: `Old status '${oldStatus}' not eligible for email trigger` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validNewStatuses.includes(newStatus)) {
      return new Response(
        JSON.stringify({ message: `New status '${newStatus}' does not trigger emails` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: { success: boolean; error?: string };

    // Handle acceptance
    if (newStatus === 'ACCEPTED' || newStatus === 'APPROVED') {
      // Validate required fields for acceptance
      if (!record.assigned_unit_id) {
        return new Response(
          JSON.stringify({ error: 'Application accepted but no unit assigned' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      }

      result = await sendAcceptanceEmail(supabaseUrl, serviceRoleKey, siteUrl, record);
    }
    // Handle rejection
    else if (newStatus === 'REJECTED') {
      result = await sendRejectionEmail(supabaseUrl, serviceRoleKey, record);
    }
    else {
      return new Response(
        JSON.stringify({ message: `Status '${newStatus}' not handled` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent successfully for application ${record.id}`,
          status: newStatus 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          message: 'Email sending failed but logged for retry'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
