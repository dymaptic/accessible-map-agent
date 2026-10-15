// src/lib/email-templates.ts
// Email templates for transactional emails

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://maps.dymaptic.com";

// Email-safe button using table-based layout (works in all email clients including Outlook)
function emailButton(href: string, text: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
  <tr>
    <td style="border-radius: 6px; background: #2563eb;">
      <a href="${href}" target="_blank" style="background: #2563eb; border: 15px solid #2563eb; font-family: sans-serif; font-size: 14px; line-height: 1.1; text-align: center; text-decoration: none; display: block; border-radius: 6px; font-weight: bold;">
        <span style="color:#ffffff;">${text}</span>
      </a>
    </td>
  </tr>
</table>`.trim();
}

// Environment indicator for email subjects
// Set APP_ENVIRONMENT=production in production to remove the [TEST] prefix
// APP_ENVIRONMENT takes precedence over NODE_ENV (allows testing slot with NODE_ENV=production)
const IS_PRODUCTION = process.env.APP_ENVIRONMENT
  ? process.env.APP_ENVIRONMENT.toLowerCase() === "production"
  : process.env.NODE_ENV === "production";
const ENV_PREFIX = IS_PRODUCTION ? "" : "[TEST] ";

/**
 * Adds environment prefix to email subject lines
 * In non-production environments, subjects are prefixed with [TEST]
 */
export function prefixSubject(subject: string): string {
  return `${ENV_PREFIX}${subject}`;
}

// Base HTML wrapper for all emails
function wrapInTemplate(content: string, isAdminEmail = false): string {
  const footerContent = isAdminEmail
    ? `<p>Accessible Map Agent - Admin Notification</p>`
    : `<p>Accessible Map Agent by dymaptic</p>
       <p><strong>Questions? Just reply to this email</strong> — a real person will get back to you.</p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessible Map Agent</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e40af; margin-bottom: 20px; }
    p { margin: 12px 0; }
    a { color: #2563eb; }
    strong { color: #111; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .button { display: inline-block; background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    .details { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .details p { margin: 8px 0; }
  </style>
</head>
<body>
  ${content}
  <div class="footer">
    ${footerContent}
  </div>
</body>
</html>
`.trim();
}

// Wrapper for admin emails (no "reply to this email" messaging)
function wrapInAdminTemplate(content: string): string {
  return wrapInTemplate(content, true);
}

// === User-Facing Email Templates ===

export const EMAIL_TEMPLATES = {
  subscription_request_received: {
    subject: () => "Subscription Request Received - Accessible Map Agent",
    html: (data: {
      orgName: string;
      tier: string;
      frequency: string;
      bonusCredits: number;
      contactName: string;
      billingAddress: string;
      paymentMethod: string;
      poNumber?: string;
      specialRequirements?: string;
    }) =>
      wrapInTemplate(`
        <h1>Thank You for Your Subscription Request</h1>
        <p>Hi ${data.contactName},</p>
        <p>We've received your request for the <strong>${data.tier}</strong> plan (${data.frequency}) for <strong>${data.orgName}</strong>.</p>
        <p>To help you continue working while we process your request, we've added <strong>${data.bonusCredits} bonus map credits</strong> to your account.</p>

        <div class="details">
          <p><strong>Request Summary:</strong></p>
          <p><strong>Plan:</strong> ${data.tier} (${data.frequency})</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          ${data.poNumber ? `<p><strong>PO Number:</strong> ${data.poNumber}</p>` : ""}
          <p><strong>Billing Address:</strong><br>${data.billingAddress.replace(/\n/g, "<br>")}</p>
          ${data.specialRequirements ? `<p><strong>Special Requirements:</strong><br>${data.specialRequirements.replace(/\n/g, "<br>")}</p>` : ""}
        </div>

        <p>Our team will send you an invoice shortly. Once payment is received, your subscription will be activated.</p>
        <p>If any of the above details are incorrect, just reply to this email and let us know.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  invoice_sent: {
    subject: () => "Invoice for Accessible Map Agent Subscription",
    html: (data: { orgName: string; tier: string; amount: string; frequency: string }) =>
      wrapInTemplate(`
        <h1>Invoice for Your Subscription</h1>
        <p>Please find attached your invoice for the <strong>${data.tier}</strong> plan (${data.frequency}).</p>
        <p><strong>Amount Due:</strong> ${data.amount}</p>
        <p><strong>Organization:</strong> ${data.orgName}</p>
        <p>Payment can be made via check or ACH. Details are included in the attached invoice.</p>
        <p>Once payment is received, your subscription will be activated within 1 business day.</p>
        <p>If you have any questions about your invoice, just reply to this email.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  subscription_activated: {
    subject: () => "Your Subscription is Now Active - Accessible Map Agent",
    html: (data: { orgName: string; tier: string; quota: number | null; periodEnd: string }) =>
      wrapInTemplate(`
        <h1>Welcome to ${data.tier}!</h1>
        <p>Your subscription for <strong>${data.orgName}</strong> is now active.</p>
        <p><strong>Plan:</strong> ${data.tier}</p>
        <p><strong>Monthly Maps:</strong> ${data.quota === null ? "Unlimited" : data.quota}</p>
        <p><strong>Current Period Ends:</strong> ${data.periodEnd}</p>
        <p>You can start generating accessible map descriptions right away.</p>
        ${emailButton(`${APP_URL}/app`, "Start Generating Maps")}
        <p>— The dymaptic Team</p>
      `),
  },

  usage_warning_80: {
    subject: (data: { orgName: string; used: number; quota: number; periodEnd: string; bonusCredits: number; percent: number }) => `Usage Alert: ${data.percent}% of Monthly Maps Used`,
    html: (data: { orgName: string; used: number; quota: number; periodEnd: string; bonusCredits: number; percent: number }) =>
      wrapInTemplate(`
        <h1>Usage Alert</h1>
        <p><strong>${data.orgName}</strong> has used <strong>${data.used} of ${data.quota}</strong> map descriptions this period.</p>
        <p>Your quota resets on <strong>${data.periodEnd}</strong>.</p>
        ${data.bonusCredits > 0 ? `<p>You also have <strong>${data.bonusCredits} bonus credits</strong> available after your monthly quota is used.</p>` : ""}
        <p>Need more maps?</p>
        ${emailButton(`${APP_URL}/settings`, "Upgrade Your Plan")}
        <p>Or contact us about Enterprise pricing for unlimited maps.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  quota_exhausted: {
    subject: () => "Monthly Quota Exhausted - Using Bonus Credits",
    html: (data: { orgName: string; bonusCredits: number; periodEnd: string }) =>
      wrapInTemplate(`
        <h1>Monthly Quota Used</h1>
        <p><strong>${data.orgName}</strong> has used all monthly map descriptions.</p>
        <p>You have <strong>${data.bonusCredits} bonus credits</strong> remaining, which are now being used for new generations.</p>
        <p>Your monthly quota resets on <strong>${data.periodEnd}</strong>.</p>
        <p>Need more capacity?</p>
        ${emailButton(`${APP_URL}/settings`, "Upgrade Your Plan")}
        <p>— The dymaptic Team</p>
      `),
  },

  fully_at_limit: {
    subject: () => "Map Limit Reached - Accessible Map Agent",
    html: (data: { orgName: string; periodEnd: string; tier: string }) =>
      wrapInTemplate(`
        <h1>Map Limit Reached</h1>
        <p><strong>${data.orgName}</strong> has used all available map descriptions (monthly quota + bonus credits).</p>
        <p>Your quota resets on <strong>${data.periodEnd}</strong>.</p>
        <p>Can't wait?</p>
        ${emailButton(`${APP_URL}/settings`, "Upgrade Your Plan")}
        ${data.tier === "PROFESSIONAL" ? "<p>For unlimited maps, ask us about <strong>Enterprise</strong> pricing.</p>" : ""}
        <p>— The dymaptic Team</p>
      `),
  },

  renewal_reminder_30: {
    subject: () => "Subscription Renewal Reminder - 30 Days",
    html: (data: { orgName: string; tier: string; endDate: string; amount: string }) =>
      wrapInTemplate(`
        <h1>Subscription Renewal Reminder</h1>
        <p>Your <strong>${data.tier}</strong> subscription for <strong>${data.orgName}</strong> expires on <strong>${data.endDate}</strong>.</p>
        <p>To ensure uninterrupted service, please renew your subscription.</p>
        <p><strong>Renewal Amount:</strong> ${data.amount}</p>
        <p>To renew, just reply to this email and we'll get you set up.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  renewal_reminder_7: {
    subject: () => "URGENT: Subscription Expires in 7 Days",
    html: (data: { orgName: string; tier: string; endDate: string }) =>
      wrapInTemplate(`
        <h1>Your Subscription Expires Soon</h1>
        <p>Your <strong>${data.tier}</strong> subscription for <strong>${data.orgName}</strong> expires on <strong>${data.endDate}</strong> — just 7 days away.</p>
        <p>After expiration, you'll enter a grace period where you can view existing descriptions but cannot generate new ones.</p>
        <p>Reply to this email now to renew and avoid any interruption.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  grace_period_started: {
    subject: () => "Subscription Expired - Grace Period Active",
    html: (data: { orgName: string; tier: string; graceEndDate: string }) =>
      wrapInTemplate(`
        <h1>Subscription Expired</h1>
        <p>Your <strong>${data.tier}</strong> subscription for <strong>${data.orgName}</strong> has expired.</p>
        <p>You are now in a <strong>grace period</strong> until <strong>${data.graceEndDate}</strong>.</p>
        <p><strong>During the grace period:</strong></p>
        <ul>
          <li>You can view and download existing map descriptions</li>
          <li>You cannot generate new descriptions</li>
        </ul>
        <p>Reply to this email to renew and restore full access.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  subscription_expired: {
    subject: () => "Subscription Ended - Reverted to Free Tier",
    html: (data: { orgName: string; previousTier: string; historyRetentionDays: number }) =>
      wrapInTemplate(`
        <h1>Subscription Ended</h1>
        <p>Your <strong>${data.previousTier}</strong> subscription for <strong>${data.orgName}</strong> has ended.</p>
        <p>Your account has been reverted to the <strong>Free</strong> tier.</p>
        <p><strong>What this means:</strong></p>
        <ul>
          <li>Existing descriptions will be retained for ${data.historyRetentionDays} days, then deleted</li>
          <li>You have 3 free map descriptions total</li>
        </ul>
        <p>Ready to resubscribe? Just reply to this email.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  cancellation_request_received: {
    subject: () => "Cancellation Request Received - Accessible Map Agent",
    html: (data: { orgName: string; tier: string; contactName: string; reason: string }) =>
      wrapInTemplate(`
        <h1>Cancellation Request Received</h1>
        <p>Hi ${data.contactName},</p>
        <p>We've received your request to cancel the <strong>${data.tier}</strong> subscription for <strong>${data.orgName}</strong>.</p>
        <p>Our team will review your request and be in touch within 1-2 business days.</p>
        <p><strong>Reason provided:</strong> ${data.reason}</p>
        <p>Your subscription remains active until the cancellation is processed. If you change your mind, just reply to this email.</p>
        <p>We're sorry to see you go — if there's anything we can do to improve your experience, please let us know.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  cancellation_processed: {
    subject: () => "Subscription Cancelled - Accessible Map Agent",
    html: (data: { orgName: string; previousTier: string; historyRetentionDays: number }) =>
      wrapInTemplate(`
        <h1>Subscription Cancelled</h1>
        <p>Your <strong>${data.previousTier}</strong> subscription for <strong>${data.orgName}</strong> has been cancelled as requested.</p>
        <p>Your account has been moved to the <strong>Free</strong> tier.</p>
        <p><strong>What this means:</strong></p>
        <ul>
          <li>Existing map descriptions will be retained for ${data.historyRetentionDays} days</li>
          <li>You have 3 free map descriptions total</li>
          <li>You can resubscribe at any time</li>
        </ul>
        <p>We appreciate you trying Accessible Map Agent. If you'd like to come back in the future, just reply to this email.</p>
        <p>— The dymaptic Team</p>
      `),
  },

  // === Internal Admin Notifications ===

  admin_notification: {
    subject: (data: { subject: string; html: string }) => data.subject,
    html: (data: { subject: string; html: string }) => wrapInAdminTemplate(data.html),
  },

  admin_new_subscription_request: {
    subject: (data: { orgName: string }) => `New Subscription Request: ${data.orgName}`,
    html: (data: {
      orgName: string;
      tier: string;
      frequency: string;
      contactName: string;
      contactEmail: string;
      billingAddress: string;
      paymentMethod: string;
      poNumber?: string;
      specialRequirements?: string;
    }) =>
      wrapInAdminTemplate(`
        <h1>New Subscription Request</h1>
        <div class="details">
          <p><strong>Organization:</strong> ${data.orgName}</p>
          <p><strong>Requested Plan:</strong> ${data.tier} (${data.frequency})</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          ${data.poNumber ? `<p><strong>PO Number:</strong> ${data.poNumber}</p>` : ""}
        </div>

        <div class="details">
          <p><strong>Billing Contact:</strong></p>
          <p>${data.contactName}</p>
          <p><a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>
          <p>${data.billingAddress.replace(/\n/g, "<br>")}</p>
        </div>

        ${data.specialRequirements ? `
        <div class="details">
          <p><strong>Special Requirements:</strong></p>
          <p>${data.specialRequirements.replace(/\n/g, "<br>")}</p>
        </div>
        ` : ""}

        ${emailButton(`${APP_URL}/admin`, "View in Admin Panel")}
      `),
  },

  admin_enterprise_inquiry: {
    subject: (data: { orgName: string }) => `Enterprise Inquiry: ${data.orgName}`,
    html: (data: { orgName: string; contactName: string; contactEmail: string; notes?: string }) =>
      wrapInAdminTemplate(`
        <h1>Enterprise Inquiry</h1>
        <p><strong>Organization:</strong> ${data.orgName}</p>
        <p><strong>Contact:</strong> ${data.contactName} (<a href="mailto:${data.contactEmail}">${data.contactEmail}</a>)</p>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
        <p>Follow up with this lead!</p>
      `),
  },

  admin_professional_at_limit: {
    subject: (data: { orgName: string }) => `Upsell Opportunity: ${data.orgName} hit Professional limit`,
    html: (data: { orgName: string; mapsUsed: number; contactEmail?: string }) =>
      wrapInAdminTemplate(`
        <h1>Professional Tier Limit Reached</h1>
        <p><strong>${data.orgName}</strong> has hit their Professional tier limit (${data.mapsUsed} maps).</p>
        <p>This is a potential Enterprise upsell opportunity.</p>
        ${data.contactEmail ? `<p><strong>Contact:</strong> <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>` : ""}
        <p>Consider reaching out to discuss Enterprise pricing.</p>
      `),
  },

  admin_subscription_expiring: {
    subject: (data: { orgName: string; daysLeft: number }) =>
      `Subscription Expiring: ${data.orgName} (${data.daysLeft} days)`,
    html: (data: { orgName: string; tier: string; endDate: string; contactEmail?: string }) =>
      wrapInAdminTemplate(`
        <h1>Subscription Expiring Soon</h1>
        <p><strong>Organization:</strong> ${data.orgName}</p>
        <p><strong>Plan:</strong> ${data.tier}</p>
        <p><strong>Expires:</strong> ${data.endDate}</p>
        ${data.contactEmail ? `<p><strong>Contact:</strong> <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>` : ""}
        <p>Follow up on renewal.</p>
      `),
  },

  admin_new_user: {
    subject: (data: { username: string; isNewOrg: boolean }) =>
      data.isNewOrg ? `New Organization: ${data.username}` : `New User: ${data.username}`,
    html: (data: { username: string; email?: string; orgName: string; isNewOrg: boolean }) =>
      wrapInAdminTemplate(`
        <h1>${data.isNewOrg ? "New Organization Registered" : "New User Registered"}</h1>
        <p><strong>Username:</strong> ${data.username}</p>
        ${data.email ? `<p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>` : ""}
        <p><strong>Organization:</strong> ${data.orgName}</p>
        ${emailButton(`${APP_URL}/admin`, "View in Admin Panel")}
      `),
  },
} as const;

export type EmailType = keyof typeof EMAIL_TEMPLATES;
