import "server-only";
import type { EmailMessage } from "./types";

/**
 * Minimal RFC 2045/2046 MIME builder for emails that carry attachments. SES's
 * "Simple" content type can't attach files, so those messages are sent as a raw
 * MIME string via SES's Raw content instead. Kept dependency-free on purpose.
 */

const CRLF = "\r\n";

/** RFC 2047 encode a header value only when it contains non-ASCII characters. */
function encodeHeader(value: string): string {
  const isAscii = [...value].every((char) => char.charCodeAt(0) <= 127);
  if (isAscii) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

/** Base64-encode bytes, wrapped at 76 characters per line (RFC 2045). */
function base64Wrapped(data: Uint8Array): string {
  const base64 = Buffer.from(data).toString("base64");
  return base64.replace(/.{1,76}/g, "$&" + CRLF).trimEnd();
}

/**
 * Build a `multipart/mixed` MIME message: an HTML body part plus one part per
 * attachment. Returns the raw bytes to hand to SES's Raw content.
 */
export function buildRawMimeEmail(
  message: EmailMessage & { from: string },
): Uint8Array {
  const boundary = `----maatram-${Buffer.from(
    message.subject + message.to.join(","),
  )
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 24)}`;

  const headers = [
    `From: ${message.from}`,
    `To: ${message.to.join(", ")}`,
    ...(message.replyTo ? [`Reply-To: ${message.replyTo}`] : []),
    `Subject: ${encodeHeader(message.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ];

  const parts: string[] = [
    headers.join(CRLF) + CRLF,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Wrapped(new TextEncoder().encode(message.html)),
  ];

  for (const attachment of message.attachments ?? []) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      base64Wrapped(attachment.content),
    );
  }

  parts.push(`--${boundary}--`, "");

  return new TextEncoder().encode(parts.join(CRLF));
}
