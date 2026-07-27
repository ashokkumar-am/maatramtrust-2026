/**
 * Shared "who owns this giving record" shape used by the donor self-service
 * queries across donations, sponsorships and annadhana bookings.
 */
export interface GivingOwner {
  /** Auth.js user id of the signed-in account. */
  userId: string;
  email?: string | null;
}

/**
 * Mongo filter matching records that belong to `owner`: by `userId` when the
 * record was made while signed in, or by the account's email for records
 * keyed only by address (e.g. admin manual entries for a known donor).
 * `emailField` names the collection's email field (`email` on donations,
 * `donorEmail` on sponsorships/bookings).
 */
export function ownerFilter(
  owner: GivingOwner,
  emailField: "email" | "donorEmail",
): Record<string, unknown> {
  const or: Record<string, unknown>[] = [{ userId: owner.userId }];
  if (owner.email) or.push({ [emailField]: owner.email });
  return { $or: or };
}
