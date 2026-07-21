import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

/**
 * Data needed to render a donation receipt. This is a generic, branded receipt
 * (not yet a statutory 80G certificate) — upgrade later by adding the org's
 * legal name, address, PAN and 80G approval number to {@link ORG}.
 */
export interface ReceiptData {
  donorName?: string;
  amount: number; // major currency units (e.g. rupees)
  currency: string;
  paymentId: string;
  receiptNumber: string;
  category?: string;
  date: Date;
}

// Placeholder org identity. Swap these for real, env-driven values when the
// statutory 80G details are available.
const ORG = {
  name: "Maatram Foundation",
  tagline: "Empowering students through education",
} as const;

const BRAND_GREEN = rgb(0.039, 0.49, 0.243); // #0a7d3e
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.45, 0.45, 0.45);

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Render a single-page A4 donation receipt PDF and return its bytes. Pure and
 * deterministic given its input, so it can be regenerated safely on retries.
 */
export async function generateDonationReceipt(
  data: ReceiptData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Donation Receipt ${data.receiptNumber}`);
  pdf.setProducer(ORG.name);

  const page = pdf.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marginX = 56;
  let cursorY = height - 72;

  // Header band.
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width,
    height: 120,
    color: BRAND_GREEN,
  });
  page.drawText(ORG.name, {
    x: marginX,
    y: height - 66,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(ORG.tagline, {
    x: marginX,
    y: height - 90,
    size: 11,
    font,
    color: rgb(0.9, 0.96, 0.92),
  });

  cursorY = height - 168;
  page.drawText("Donation Receipt", {
    x: marginX,
    y: cursorY,
    size: 18,
    font: bold,
    color: INK,
  });

  cursorY -= 40;

  const rows: Array<[string, string]> = [
    ["Receipt No.", data.receiptNumber],
    ["Date", formatDate(data.date)],
    ["Received from", data.donorName?.trim() || "Anonymous Donor"],
    ["Purpose", data.category?.trim() || "General donation"],
    ["Payment reference", data.paymentId],
  ];

  const labelX = marginX;
  const valueX = marginX + 150;
  const lineGap = 26;
  for (const [label, value] of rows) {
    drawRow(page, { font, bold, label, value, labelX, valueX, y: cursorY });
    cursorY -= lineGap;
  }

  cursorY -= 12;
  // Amount highlight box.
  const boxHeight = 56;
  page.drawRectangle({
    x: marginX,
    y: cursorY - boxHeight + 20,
    width: width - marginX * 2,
    height: boxHeight,
    color: rgb(0.94, 0.97, 0.95),
    borderColor: BRAND_GREEN,
    borderWidth: 1,
  });
  page.drawText("Amount received", {
    x: marginX + 16,
    y: cursorY - 2,
    size: 10,
    font,
    color: MUTED,
  });
  page.drawText(formatCurrency(data.amount, data.currency), {
    x: marginX + 16,
    y: cursorY - 22,
    size: 20,
    font: bold,
    color: BRAND_GREEN,
  });

  cursorY -= boxHeight + 28;
  const thanks =
    "Thank you for your generous contribution. Your support helps students " +
    "continue their education.";
  drawWrapped(page, {
    text: thanks,
    font,
    size: 11,
    color: INK,
    x: marginX,
    y: cursorY,
    maxWidth: width - marginX * 2,
    lineHeight: 16,
  });

  // Footer note.
  page.drawText(
    "This is a computer-generated receipt and does not require a signature.",
    { x: marginX, y: 64, size: 9, font, color: MUTED },
  );
  page.drawText(
    "A tax-exemption (80G) certificate, where applicable, will be issued separately.",
    { x: marginX, y: 50, size: 9, font, color: MUTED },
  );

  return pdf.save();
}

interface RowArgs {
  font: PDFFont;
  bold: PDFFont;
  label: string;
  value: string;
  labelX: number;
  valueX: number;
  y: number;
}

function drawRow(
  page: ReturnType<PDFDocument["addPage"]>,
  { font, bold, label, value, labelX, valueX, y }: RowArgs,
): void {
  page.drawText(label, { x: labelX, y, size: 11, font, color: MUTED });
  page.drawText(value, { x: valueX, y, size: 11, font: bold, color: INK });
}

interface WrapArgs {
  text: string;
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
}

function drawWrapped(
  page: ReturnType<PDFDocument["addPage"]>,
  { text, font, size, color, x, y, maxWidth, lineHeight }: WrapArgs,
): void {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font, color });
      line = word;
      cursorY -= lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) page.drawText(line, { x, y: cursorY, size, font, color });
}
