import { collectionHandlers } from "@/lib/crud-route";
import { annadhanaCampaignRepository } from "@/lib/resources";
import { annadhanaCampaignCreateSchema } from "@/lib/validations";

export const { GET, POST } = collectionHandlers(
  annadhanaCampaignRepository,
  annadhanaCampaignCreateSchema,
);
