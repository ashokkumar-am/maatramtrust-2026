import "server-only";
import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error(
    "Missing Razorpay env vars: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
  );
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Public key id is safe to expose to the browser (used by Checkout).
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

// Minimum donation, in the smallest currency unit (paise). ₹10.
export const MIN_DONATION_PAISE = 1000;
export const DONATION_CURRENCY = "INR";
