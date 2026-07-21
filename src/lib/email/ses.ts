import "server-only";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import type { EmailConfig } from "./config";
import { buildRawMimeEmail } from "./mime";
import type { EmailMessage, EmailProvider } from "./types";

const CHARSET = "UTF-8";

/**
 * Amazon SES implementation of {@link EmailProvider} (SES v2 API). Credentials
 * come from the default AWS provider chain; only the region is passed in.
 * Messages with attachments are sent as raw MIME (SES "Simple" content can't
 * carry attachments); everything else uses the simpler structured payload.
 */
export function createSesProvider(config: EmailConfig): EmailProvider {
  const client = new SESv2Client({ region: config.region });

  return {
    async send(message: EmailMessage): Promise<void> {
      const command = message.attachments?.length
        ? rawCommand(config, message)
        : simpleCommand(config, message);
      await client.send(command);
    },
  };
}

function simpleCommand(config: EmailConfig, message: EmailMessage) {
  return new SendEmailCommand({
    FromEmailAddress: config.fromEmail,
    Destination: { ToAddresses: message.to },
    ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
    Content: {
      Simple: {
        Subject: { Data: message.subject, Charset: CHARSET },
        Body: {
          Html: { Data: message.html, Charset: CHARSET },
          ...(message.text
            ? { Text: { Data: message.text, Charset: CHARSET } }
            : {}),
        },
      },
    },
  });
}

function rawCommand(config: EmailConfig, message: EmailMessage) {
  const data = buildRawMimeEmail({ ...message, from: config.fromEmail });
  return new SendEmailCommand({
    FromEmailAddress: config.fromEmail,
    Destination: { ToAddresses: message.to },
    ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
    Content: { Raw: { Data: data } },
  });
}
