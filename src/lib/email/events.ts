import type { EmailConfig } from "./config";
import type { EmailMessage } from "./types";

/**
 * Registry of email events. To add a new trigger (now or in future), add its
 * payload to {@link EmailEventPayloads} and a builder to {@link EMAIL_EVENTS} —
 * nothing else in the app changes. A builder returns every message the event
 * should send (typically an admin notification plus a user confirmation).
 */
export interface EmailEventPayloads {
  "contact.created": {
    name: string;
    email: string;
    mobile: string;
    comments: string;
  };
  "newsletter.subscribed": {
    email: string;
  };
  "donation.received": {
    email?: string;
    amountPaise: number;
    currency: string;
    paymentId: string;
    donorName?: string;
    category?: string;
    receiptNumber?: string;
    /** PDF receipt bytes, attached to the donor's acknowledgement email. */
    pdf?: Uint8Array;
  };
  "student.sponsored": {
    sponsorName?: string;
    sponsorEmail?: string;
    studentName: string;
    studentId?: string;
    amount: number;
    currency?: string;
  };
  "annadhana.booked": {
    donorName?: string;
    donorEmail?: string;
    occasion: string;
    occasionDetail?: string;
    honoreeName?: string;
    eventDate: Date | string;
    amount: number;
    currency?: string;
    campaignTitle?: string;
  };
}

export type EmailEventName = keyof EmailEventPayloads;

type EmailEventBuilder<K extends EmailEventName> = (
  payload: EmailEventPayloads[K],
  config: EmailConfig,
) => EmailMessage[];

type EmailEventRegistry = {
  [K in EmailEventName]: EmailEventBuilder<K>;
};

const BRAND = "Maatram";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wrap body HTML in a minimal branded shell. */
function layout(title: string, bodyHtml: string): string {
  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6;max-width:560px;margin:0 auto;">',
    `<h2 style="color:#0a7d3e;margin:0 0 16px;">${escapeHtml(title)}</h2>`,
    bodyHtml,
    '<hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />',
    `<p style="font-size:12px;color:#888;">${BRAND} · This is an automated message.</p>`,
    "</div>",
  ].join("");
}

/** Format an amount given in the smallest currency unit (e.g. paise → ₹). */
function formatMinorAmount(minor: number, currency: string): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major} ${currency}`;
  }
}

export const EMAIL_EVENTS: EmailEventRegistry = {
  "contact.created": (payload, config) => {
    const name = escapeHtml(payload.name);
    return [
      {
        to: [config.adminEmail],
        replyTo: payload.email,
        subject: `New contact submission from ${payload.name}`,
        html: layout(
          "New contact submission",
          `<p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
           <p><strong>Mobile:</strong> ${escapeHtml(payload.mobile)}</p>
           <p><strong>Message:</strong><br/>${escapeHtml(payload.comments)}</p>`,
        ),
      },
      {
        to: [payload.email],
        subject: `We received your message`,
        html: layout(
          `Thank you, ${payload.name}`,
          `<p>Thanks for reaching out to ${BRAND}. We've received your message and will get back to you soon.</p>`,
        ),
      },
    ];
  },

  "newsletter.subscribed": (payload, config) => [
    {
      to: [config.adminEmail],
      subject: `New newsletter subscriber`,
      html: layout(
        "New newsletter subscriber",
        `<p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>`,
      ),
    },
    {
      to: [payload.email],
      subject: `You're subscribed to ${BRAND}`,
      html: layout(
        "Subscription confirmed",
        `<p>Thanks for subscribing to the ${BRAND} newsletter. We'll keep you posted.</p>`,
      ),
    },
  ],

  "donation.received": (payload, config) => {
    const amount = formatMinorAmount(payload.amountPaise, payload.currency);
    const messages: EmailMessage[] = [
      {
        to: [config.adminEmail],
        subject: `Donation received — ${amount}`,
        html: layout(
          "Donation received",
          `<p><strong>Amount:</strong> ${escapeHtml(amount)}</p>
           ${payload.category ? `<p><strong>Category:</strong> ${escapeHtml(payload.category)}</p>` : ""}
           <p><strong>Payment ID:</strong> ${escapeHtml(payload.paymentId)}</p>
           ${payload.receiptNumber ? `<p><strong>Receipt No.:</strong> ${escapeHtml(payload.receiptNumber)}</p>` : ""}
           ${payload.donorName ? `<p><strong>Donor:</strong> ${escapeHtml(payload.donorName)}</p>` : ""}
           ${payload.email ? `<p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>` : ""}`,
        ),
      },
    ];
    if (payload.email) {
      const greeting = payload.donorName
        ? `Thank you, ${escapeHtml(payload.donorName)}`
        : "Thank you for your generosity";
      const receiptLine = payload.receiptNumber
        ? `<p>Your receipt <strong>${escapeHtml(payload.receiptNumber)}</strong> is attached as a PDF for your records.</p>`
        : "";
      messages.push({
        to: [payload.email],
        subject: `Thank you for your donation${payload.receiptNumber ? ` — receipt ${payload.receiptNumber}` : ""}`,
        html: layout(
          greeting,
          `<p>We've received your donation of <strong>${escapeHtml(amount)}</strong>. Thank you for supporting ${BRAND}.</p>
           ${receiptLine}
           <p style="font-size:12px;color:#888;">Reference: ${escapeHtml(payload.paymentId)}</p>`,
        ),
        attachments: payload.pdf
          ? [
              {
                filename: `Maatram-Receipt-${(payload.receiptNumber ?? payload.paymentId).replace(/[^\w.-]/g, "-")}.pdf`,
                content: payload.pdf,
                contentType: "application/pdf",
              },
            ]
          : undefined,
      });
    }
    return messages;
  },

  "annadhana.booked": (payload, config) => {
    const currency = payload.currency ?? "INR";
    const amount = formatMinorAmount(payload.amount * 100, currency);
    const occasion = escapeHtml(payload.occasionDetail || payload.occasion);
    const eventDate = new Date(payload.eventDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const details = `<p><strong>Occasion:</strong> ${occasion}</p>
       ${payload.honoreeName ? `<p><strong>For:</strong> ${escapeHtml(payload.honoreeName)}</p>` : ""}
       <p><strong>Date:</strong> ${escapeHtml(eventDate)}</p>
       <p><strong>Amount:</strong> ${escapeHtml(amount)}</p>
       ${payload.campaignTitle ? `<p><strong>Campaign:</strong> ${escapeHtml(payload.campaignTitle)}</p>` : ""}`;

    const messages: EmailMessage[] = [
      {
        to: [config.adminEmail],
        subject: `New Annadhana Sevai booking — ${eventDate}`,
        html: layout(
          "New Annadhana Sevai booking",
          `${details}
           ${payload.donorName ? `<p><strong>Donor:</strong> ${escapeHtml(payload.donorName)}</p>` : ""}
           ${payload.donorEmail ? `<p><strong>Email:</strong> ${escapeHtml(payload.donorEmail)}</p>` : ""}`,
        ),
      },
    ];
    if (payload.donorEmail) {
      messages.push({
        to: [payload.donorEmail],
        subject: `Your Annadhana Sevai booking is confirmed — ${eventDate}`,
        html: layout(
          `Thank you${payload.donorName ? `, ${escapeHtml(payload.donorName)}` : ""}`,
          `<p>Your Annadhana Sevai booking with ${BRAND} is confirmed.</p>
           ${details}
           <p>Your kindness will feed many. Thank you for your generosity.</p>`,
        ),
      });
    }
    return messages;
  },

  "student.sponsored": (payload, config) => {
    const currency = payload.currency ?? "INR";
    const amount = formatMinorAmount(payload.amount * 100, currency);
    const student = escapeHtml(payload.studentName);
    const messages: EmailMessage[] = [
      {
        to: [config.adminEmail],
        subject: `New sponsorship for ${payload.studentName}`,
        html: layout(
          "New student sponsorship",
          `<p><strong>Student:</strong> ${student}${payload.studentId ? ` (${escapeHtml(payload.studentId)})` : ""}</p>
           <p><strong>Amount:</strong> ${escapeHtml(amount)}</p>
           ${payload.sponsorName ? `<p><strong>Sponsor:</strong> ${escapeHtml(payload.sponsorName)}</p>` : ""}
           ${payload.sponsorEmail ? `<p><strong>Sponsor email:</strong> ${escapeHtml(payload.sponsorEmail)}</p>` : ""}`,
        ),
      },
    ];
    if (payload.sponsorEmail) {
      messages.push({
        to: [payload.sponsorEmail],
        subject: `Thank you for sponsoring ${payload.studentName}`,
        html: layout(
          "Thank you for sponsoring a student",
          `<p>Thank you${payload.sponsorName ? `, ${escapeHtml(payload.sponsorName)}` : ""}, for sponsoring <strong>${student}</strong> with <strong>${escapeHtml(amount)}</strong>. Your support changes lives.</p>`,
        ),
      });
    }
    return messages;
  },
};
