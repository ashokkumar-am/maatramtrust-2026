import type { Model } from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import type { AuditUser } from "@/lib/audit";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export type Doc = Record<string, unknown>;

export interface ListResult {
  items: Doc[];
  total: number;
  page: number;
  limit: number;
}

export interface Repository {
  list(searchParams: URLSearchParams): Promise<ListResult>;
  findById(id: string): Promise<Doc | null>;
  create(input: Doc, actor: AuditUser): Promise<Doc>;
  update(id: string, input: Doc, actor: AuditUser): Promise<Doc | null>;
  /** Returns the deleted document, or `null` when nothing matched. */
  remove(id: string): Promise<Doc | null>;
}

function toInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Escape regex metacharacters so a search term is matched literally. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generic paginated CRUD data-access over a Mongoose model. When
 * `options.audit` is set, `createdBy`/`updatedBy` are stamped from the actor
 * on writes so audited models (e.g. students) get their trail automatically.
 * `options.searchFields` enables case-insensitive `?q=` search across those
 * fields.
 */
export function createMongoRepository(
  model: Model<Doc>,
  options: { audit?: boolean; searchFields?: string[] } = {},
): Repository {
  const withAudit = options.audit ?? false;
  const searchFields = options.searchFields ?? [];

  return {
    async list(searchParams) {
      await connectMongoDB();
      const limit = Math.min(
        toInt(searchParams.get("limit"), DEFAULT_LIMIT),
        MAX_LIMIT,
      );
      const page = toInt(searchParams.get("page"), 1);

      const q = searchParams.get("q")?.trim();
      const filter: Doc =
        q && searchFields.length > 0
          ? {
              $or: searchFields.map((field) => ({
                [field]: { $regex: escapeRegex(q), $options: "i" },
              })),
            }
          : {};
      const hasFilter = Object.keys(filter).length > 0;

      const [items, total] = await Promise.all([
        model
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean<Doc[]>()
          .exec(),
        hasFilter
          ? model.countDocuments(filter)
          : model.estimatedDocumentCount(),
      ]);

      return { items, total, page, limit };
    },

    async findById(id) {
      await connectMongoDB();
      return model.findById(id).lean<Doc>().exec();
    },

    async create(input, actor) {
      await connectMongoDB();
      const payload = withAudit
        ? { ...input, createdBy: actor, updatedBy: actor }
        : input;
      const created = await model.create(payload);
      return created.toObject() as Doc;
    },

    async update(id, input, actor) {
      await connectMongoDB();
      const payload: Doc = withAudit
        ? { ...input, updatedBy: actor }
        : { ...input };

      // An explicit `null` clears the field ($unset); omitted keys are left
      // untouched. Lets callers remove optional values (e.g. a blog cover)
      // instead of being able only to overwrite them.
      const set: Doc = {};
      const unset: Record<string, ""> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value === null) unset[key] = "";
        else set[key] = value;
      }

      const update: Record<string, unknown> = {};
      if (Object.keys(set).length > 0) update.$set = set;
      if (Object.keys(unset).length > 0) update.$unset = unset;

      return model
        .findByIdAndUpdate(id, update, { new: true, runValidators: true })
        .lean<Doc>()
        .exec();
    },

    async remove(id) {
      await connectMongoDB();
      return model.findByIdAndDelete(id).lean<Doc>().exec();
    },
  };
}
