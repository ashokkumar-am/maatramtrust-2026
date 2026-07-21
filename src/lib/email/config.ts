import "server-only";

export interface EmailConfig {
  region: string;
  /** Verified SES sender identity (address or "Name <address>"). */
  fromEmail: string;
  /** Inbox that receives admin notifications. */
  adminEmail: string;
}

/**
 * Read email configuration from the environment. Returns `null` (instead of
 * throwing) when unconfigured, so email remains an optional, non-blocking
 * concern — contact/newsletter/donation flows keep working even without SES.
 *
 * AWS credentials are resolved by the default SDK provider chain
 * (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, or an IAM role in production).
 */
export function getEmailConfig(): EmailConfig | null {
  const region = process.env.AWS_REGION ?? process.env.SES_REGION;
  const fromEmail = process.env.SES_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!region || !fromEmail || !adminEmail) {
    return null;
  }

  return { region, fromEmail, adminEmail };
}
