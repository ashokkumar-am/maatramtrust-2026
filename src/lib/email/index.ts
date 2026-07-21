import "server-only";
import { after } from "next/server";
import { getEmailConfig, type EmailConfig } from "./config";
import { createSesProvider } from "./ses";
import {
  EMAIL_EVENTS,
  type EmailEventName,
  type EmailEventPayloads,
} from "./events";
import type { EmailProvider } from "./types";

interface EmailRuntime {
  config: EmailConfig;
  provider: EmailProvider;
}

// `undefined` = not resolved yet; `null` = resolved but unconfigured.
let runtime: EmailRuntime | null | undefined;

function getRuntime(): EmailRuntime | null {
  if (runtime !== undefined) {
    return runtime;
  }
  const config = getEmailConfig();
  runtime = config ? { config, provider: createSesProvider(config) } : null;
  return runtime;
}

/**
 * Fire-and-forget email trigger. Sending is scheduled with `after()` so it runs
 * once the response is sent and never blocks or fails the caller — a per-message
 * SES failure is logged, not thrown. No-ops (with a warning) when SES is
 * unconfigured. Safe to call from Route Handlers and Server Actions.
 *
 * @example triggerEmail("contact.created", { name, email, mobile, comments })
 */
export function triggerEmail<K extends EmailEventName>(
  event: K,
  payload: EmailEventPayloads[K],
): void {
  after(async () => {
    const active = getRuntime();
    if (!active) {
      console.warn(`[email] skipped "${event}" — SES not configured`);
      return;
    }

    const builder = EMAIL_EVENTS[event];
    const messages = builder(payload, active.config);

    for (const message of messages) {
      try {
        await active.provider.send(message);
      } catch (error) {
        console.error(
          `[email] failed to send "${event}" to ${message.to.join(", ")}`,
          error,
        );
      }
    }
  });
}

export type { EmailEventName, EmailEventPayloads };
