export interface OccasionSponsor {
  donorName?: string;
  occasion: string;
  occasionDetail?: string;
  honoreeName?: string;
}

/** "their birthday", "the memory of Lakshmi", "their wedding anniversary"… */
export function occasionPhrase(sponsor: OccasionSponsor): string {
  const honoree = sponsor.honoreeName;
  switch (sponsor.occasion) {
    case "birthday":
      return honoree ? `${honoree}'s birthday` : "a birthday";
    case "anniversary":
      return honoree ? `${honoree}'s anniversary` : "an anniversary";
    case "memorial":
      return honoree ? `the memory of ${honoree}` : "a loved one's memory";
    default:
      return sponsor.occasionDetail || "a celebration";
  }
}
