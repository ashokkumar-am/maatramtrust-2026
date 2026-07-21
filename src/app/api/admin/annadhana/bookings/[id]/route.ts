import { itemHandlers } from "@/lib/crud-route";
import { annadhanaBookingRepository } from "@/lib/resources";
import { annadhanaBookingUpdateSchema } from "@/lib/validations";

/**
 * Maintain one booking (admin): read it, fix its details, cancel it
 * (`{"status": "cancelled"}`), or delete a record that never received money.
 * Received bookings are part of the payment ledger — they can only be
 * cancelled, not deleted.
 */
export const { GET, PATCH, DELETE } = itemHandlers(
  annadhanaBookingRepository,
  annadhanaBookingUpdateSchema,
  {
    beforeDelete: async (id) => {
      const booking = await annadhanaBookingRepository.findById(id);
      return booking?.status === "received"
        ? "This booking has a received payment. Cancel it instead."
        : null;
    },
  },
);
