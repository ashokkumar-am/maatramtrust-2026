/**
 * Provider-agnostic email contracts. Any transport (SES today, something else
 * tomorrow) implements {@link EmailProvider}; the rest of the app depends on
 * this interface, not on a concrete SDK (dependency inversion).
 */

/** A binary file attached to an email (e.g. a PDF receipt). */
export interface EmailAttachment {
  filename: string;
  content: Uint8Array;
  contentType: string;
}

export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  /** Reply-To (e.g. so admins can reply straight to a contact submitter). */
  replyTo?: string;
  /** File attachments. When present, the message is sent as raw MIME. */
  attachments?: EmailAttachment[];
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
