// src/lib/email.ts
// Email service using Brevo (Sendinblue) transactional API

import * as brevo from "@getbrevo/brevo";
import { EMAIL_TEMPLATES, EmailType, prefixSubject } from "./email-templates";

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();

// Set API key if available
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
}

const SENDER = {
  email: process.env.EMAIL_FROM_ADDRESS || "noreply@dymaptic.com",
  name: process.env.EMAIL_FROM_NAME || "Accessible Map Agent",
};

// Get admin emails for BCC on user-facing emails
function getAdminBccEmails(): Array<{ email: string }> {
  const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return adminEmails.map((email) => ({ email }));
}

// Admin email template types (no BCC needed)
const ADMIN_EMAIL_TYPES = [
  "admin_notification",
  "admin_new_subscription_request",
  "admin_enterprise_inquiry",
  "admin_professional_at_limit",
  "admin_subscription_expiring",
  "admin_new_user",
] as const;

function isAdminEmailType(type: string): boolean {
  return ADMIN_EMAIL_TYPES.includes(type as typeof ADMIN_EMAIL_TYPES[number]);
}

interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Send a transactional email using a template
 */
export async function sendEmail<T extends EmailType>(
  type: T,
  recipient: EmailRecipient,
  data: Parameters<(typeof EMAIL_TEMPLATES)[T]["html"]>[0]
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Email] Attempting to send "${type}" to ${recipient.email}`);
  console.log(`[Email] BREVO_API_KEY configured: ${!!process.env.BREVO_API_KEY}`);
  console.log(`[Email] Sender: ${SENDER.email} (${SENDER.name})`);

  // Skip if no API key configured (development mode)
  if (!process.env.BREVO_API_KEY) {
    console.log(`[Email] SKIPPED (no API key) - Would send "${type}" to ${recipient.email}:`, JSON.stringify(data, null, 2));
    return { success: true };
  }

  try {
    const template = EMAIL_TEMPLATES[type];
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = SENDER;
    sendSmtpEmail.to = [{ email: recipient.email, name: recipient.name }];

    // BCC admins on user-facing emails (not admin notifications)
    if (!isAdminEmailType(type)) {
      const bccEmails = getAdminBccEmails();
      if (bccEmails.length > 0) {
        sendSmtpEmail.bcc = bccEmails;
        console.log(`[Email] BCC: ${bccEmails.map(e => e.email).join(", ")}`);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSubject = template.subject(data as any);
    sendSmtpEmail.subject = prefixSubject(rawSubject);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendSmtpEmail.htmlContent = template.html(data as any);

    console.log(`[Email] Sending via Brevo API...`);
    console.log(`[Email] Subject: ${sendSmtpEmail.subject}`);

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Email] SUCCESS - Sent "${type}" to ${recipient.email}`);
    console.log(`[Email] Brevo response:`, JSON.stringify(response, null, 2));
    return { success: true };
  } catch (error) {
    console.error(`[Email] FAILED to send "${type}" to ${recipient.email}`);
    console.error(`[Email] Error details:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send an email to multiple recipients
 */
export async function sendEmailToMany<T extends EmailType>(
  type: T,
  recipients: EmailRecipient[],
  data: Parameters<(typeof EMAIL_TEMPLATES)[T]["html"]>[0]
): Promise<{ success: boolean; errors?: string[] }> {
  const results = await Promise.all(
    recipients.map((recipient) => sendEmail(type, recipient, data))
  );

  const errors = results
    .filter((r) => !r.success && r.error)
    .map((r) => r.error!);

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Send notification to all admin emails
 */
export async function sendAdminNotification(
  subject: string,
  html: string
): Promise<void> {
  console.log(`[Email] sendAdminNotification called with subject: "${subject}"`);

  const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  console.log(`[Email] ADMIN_NOTIFICATION_EMAILS: ${adminEmails.length > 0 ? adminEmails.join(", ") : "(not configured)"}`);

  if (adminEmails.length === 0) {
    console.log("[Email] SKIPPED - No ADMIN_NOTIFICATION_EMAILS configured");
    return;
  }

  await sendEmailToMany(
    "admin_notification",
    adminEmails.map((email) => ({ email })),
    { subject, html }
  );
}

/**
 * Notify admins about a new subscription request
 */
export async function notifyAdminsNewSubscriptionRequest(data: {
  orgName: string;
  tier: string;
  frequency: string;
  contactName: string;
  contactEmail: string;
  billingAddress: string;
  paymentMethod: string;
  poNumber?: string;
  specialRequirements?: string;
}): Promise<void> {
  console.log(`[Email] notifyAdminsNewSubscriptionRequest called for org: ${data.orgName}, tier: ${data.tier}`);

  const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    console.log("[Email] SKIPPED - No ADMIN_NOTIFICATION_EMAILS configured");
    return;
  }

  console.log(`[Email] Notifying ${adminEmails.length} admin(s): ${adminEmails.join(", ")}`);

  await sendEmailToMany(
    "admin_new_subscription_request",
    adminEmails.map((email) => ({ email })),
    data
  );
}

/**
 * Notify admins about a Professional tier org hitting their limit
 */
export async function notifyAdminsProfessionalAtLimit(data: {
  orgName: string;
  mapsUsed: number;
  contactEmail?: string;
}): Promise<void> {
  console.log(`[Email] notifyAdminsProfessionalAtLimit called for org: ${data.orgName}`);

  const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    console.log("[Email] SKIPPED - No ADMIN_NOTIFICATION_EMAILS configured");
    return;
  }

  await sendEmailToMany(
    "admin_professional_at_limit",
    adminEmails.map((email) => ({ email })),
    data
  );
}

/**
 * Notify admins about a new user/organization
 */
export async function notifyAdminsNewUser(data: {
  username: string;
  email?: string;
  orgName: string;
  isNewOrg: boolean;
}): Promise<void> {
  console.log(`[Email] notifyAdminsNewUser called for user: ${data.username}, org: ${data.orgName}, isNewOrg: ${data.isNewOrg}`);

  const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    console.log("[Email] SKIPPED - No ADMIN_NOTIFICATION_EMAILS configured");
    return;
  }

  await sendEmailToMany(
    "admin_new_user",
    adminEmails.map((email) => ({ email })),
    data
  );
}

/**
 * Notify admins about an expiring subscription
 */
export async function notifyAdminsSubscriptionExpiring(data: {
  orgName: string;
  tier: string;
  endDate: string;
  daysLeft: number;
  contactEmail?: string;
}): Promise<void> {
  console.log(`[Email] notifyAdminsSubscriptionExpiring called for org: ${data.orgName}, daysLeft: ${data.daysLeft}`);

  const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    console.log("[Email] SKIPPED - No ADMIN_NOTIFICATION_EMAILS configured");
    return;
  }

  await sendEmailToMany(
    "admin_subscription_expiring",
    adminEmails.map((email) => ({ email })),
    data
  );
}

// === User-Facing Email Helpers ===

/**
 * Send subscription request confirmation to the requester
 */
export async function sendSubscriptionRequestConfirmation(
  recipientEmail: string,
  recipientName: string | undefined,
  data: {
    orgName: string;
    tier: string;
    frequency: string;
    bonusCredits: number;
    contactName: string;
    billingAddress: string;
    paymentMethod: string;
    poNumber?: string;
    specialRequirements?: string;
  }
): Promise<void> {
  await sendEmail(
    "subscription_request_received",
    { email: recipientEmail, name: recipientName },
    data
  );
}

/**
 * Send subscription activation notification
 */
export async function sendSubscriptionActivatedEmail(
  recipientEmail: string,
  recipientName: string | undefined,
  data: { orgName: string; tier: string; quota: number | null; periodEnd: string }
): Promise<void> {
  await sendEmail(
    "subscription_activated",
    { email: recipientEmail, name: recipientName },
    data
  );
}

/**
 * Send 80% usage warning
 */
export async function sendUsageWarningEmail(
  recipientEmail: string,
  data: {
    orgName: string;
    used: number;
    quota: number;
    periodEnd: string;
    bonusCredits: number;
  }
): Promise<void> {
  const percent = Math.round((data.used / data.quota) * 100);
  await sendEmail("usage_warning_80", { email: recipientEmail }, { ...data, percent });
}

/**
 * Send quota exhausted notification (now using bonus credits)
 */
export async function sendQuotaExhaustedEmail(
  recipientEmail: string,
  data: { orgName: string; bonusCredits: number; periodEnd: string }
): Promise<void> {
  await sendEmail("quota_exhausted", { email: recipientEmail }, data);
}

/**
 * Send fully at limit notification
 */
export async function sendFullyAtLimitEmail(
  recipientEmail: string,
  data: { orgName: string; periodEnd: string; tier: string }
): Promise<void> {
  await sendEmail("fully_at_limit", { email: recipientEmail }, data);
}

/**
 * Send renewal reminder (30 or 7 days)
 */
export async function sendRenewalReminderEmail(
  recipientEmail: string,
  daysLeft: 30 | 7,
  data: { orgName: string; tier: string; endDate: string; amount?: string }
): Promise<void> {
  if (daysLeft === 30 && data.amount) {
    await sendEmail("renewal_reminder_30", { email: recipientEmail }, {
      orgName: data.orgName,
      tier: data.tier,
      endDate: data.endDate,
      amount: data.amount,
    });
  } else {
    await sendEmail("renewal_reminder_7", { email: recipientEmail }, {
      orgName: data.orgName,
      tier: data.tier,
      endDate: data.endDate,
    });
  }
}

/**
 * Send grace period started notification
 */
export async function sendGracePeriodStartedEmail(
  recipientEmail: string,
  data: { orgName: string; tier: string; graceEndDate: string }
): Promise<void> {
  await sendEmail("grace_period_started", { email: recipientEmail }, data);
}

/**
 * Send subscription expired notification
 */
export async function sendSubscriptionExpiredEmail(
  recipientEmail: string,
  data: { orgName: string; previousTier: string; historyRetentionDays: number }
): Promise<void> {
  await sendEmail("subscription_expired", { email: recipientEmail }, data);
}

/**
 * Send cancellation request received confirmation
 */
export async function sendCancellationRequestReceivedEmail(
  recipientEmail: string,
  recipientName: string | undefined,
  data: { orgName: string; tier: string; contactName: string; reason: string }
): Promise<void> {
  await sendEmail(
    "cancellation_request_received",
    { email: recipientEmail, name: recipientName },
    data
  );
}

/**
 * Send cancellation processed notification
 */
export async function sendCancellationProcessedEmail(
  recipientEmail: string,
  data: { orgName: string; previousTier: string; historyRetentionDays: number }
): Promise<void> {
  await sendEmail("cancellation_processed", { email: recipientEmail }, data);
}
