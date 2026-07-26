import { NextResponse } from "next/server";
import type { ZodError, ZodType } from "zod";
import { requireRole } from "@/lib/admin-auth";
import type { Doc, Repository } from "@/lib/repository";
import type { UserRole } from "@/lib/roles";

/** Handlers are admin-only unless a resource opts more roles in. */
const DEFAULT_ROLES: readonly UserRole[] = ["admin"];

type ItemContext = { params: Promise<{ id: string }> };

function validationError(error: ZodError) {
  return NextResponse.json(
    { message: "Invalid request", errors: error.flatten().fieldErrors },
    { status: 400 },
  );
}

const notFound = () =>
  NextResponse.json({ message: "Not found" }, { status: 404 });

const serverError = () =>
  NextResponse.json({ message: "Something went wrong" }, { status: 500 });

const conflict = () =>
  NextResponse.json({ message: "Already exists" }, { status: 409 });

/** MongoDB duplicate-key errors surface as code 11000 (violated unique index). */
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

async function readJson(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}

/**
 * Async validator for a parsed payload. Returns an error message (rendered as a
 * `400`) when the input is semantically invalid — e.g. a referenced document
 * doesn't exist — or `null` when it's fine. Runs after zod validation.
 */
export type InputValidator = (data: Doc) => Promise<string | null>;

interface CollectionOptions {
  validate?: InputValidator;
  /** Roles allowed on these handlers (default: admin only). */
  roles?: readonly UserRole[];
}

const badRequest = (message: string) =>
  NextResponse.json({ message }, { status: 400 });

/**
 * Build `GET` (paginated list) and `POST` (create) handlers for a collection
 * endpoint. Role-gated (admin by default) and validated against
 * `createSchema`; `options.validate` adds an async semantic check (e.g.
 * referenced-id existence).
 */
export function collectionHandlers(
  repo: Repository,
  createSchema: ZodType,
  options: CollectionOptions = {},
) {
  const roles = options.roles ?? DEFAULT_ROLES;

  async function GET(request: Request) {
    const auth = await requireRole(roles);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    return NextResponse.json(await repo.list(searchParams));
  }

  async function POST(request: Request) {
    const auth = await requireRole(roles);
    if (!auth.ok) return auth.response;

    const json = await readJson(request);
    if (!json.ok) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = createSchema.safeParse(json.body);
    if (!parsed.success) return validationError(parsed.error);

    if (options.validate) {
      const message = await options.validate(parsed.data as Doc);
      if (message) return badRequest(message);
    }

    try {
      const created = await repo.create(parsed.data as Doc, auth.actor);
      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      if (isDuplicateKeyError(error)) return conflict();
      console.error("[admin] create failed", error);
      return serverError();
    }
  }

  return { GET, POST };
}

interface ItemHandlerHooks {
  /** Guard run before DELETE. Return a message (rendered as `409`) to block the
   * delete — e.g. the item is still referenced — or `null` to allow it. */
  beforeDelete?: (id: string) => Promise<string | null>;
  /** Called with the deleted document after a successful DELETE (e.g. to clean
   * up external assets). Runs synchronously in the handler — schedule slow work
   * with `after()` inside the hook so it never blocks the response. */
  afterDelete?: (doc: Doc) => void;
  /** Called after a successful PATCH with the updated doc and the pre-update doc
   * (e.g. to clean up an asset the update replaced). Fetches the previous doc
   * only when this hook is set. Schedule slow work with `after()` inside it. */
  afterUpdate?: (updated: Doc, previous: Doc | null) => void;
  /** Async semantic check on the parsed update payload; a returned message is a
   * `400`. */
  validate?: InputValidator;
  /** Roles allowed on these handlers (default: admin only). */
  roles?: readonly UserRole[];
}

/**
 * Build `GET` (read one), `PATCH` (partial update) and `DELETE` handlers for a
 * single-item endpoint. Role-gated (admin by default) and validated against
 * `updateSchema`.
 */
export function itemHandlers(
  repo: Repository,
  updateSchema: ZodType,
  hooks: ItemHandlerHooks = {},
) {
  const roles = hooks.roles ?? DEFAULT_ROLES;

  async function GET(_request: Request, ctx: ItemContext) {
    const auth = await requireRole(roles);
    if (!auth.ok) return auth.response;

    const { id } = await ctx.params;
    const doc = await repo.findById(id);
    return doc ? NextResponse.json(doc) : notFound();
  }

  async function PATCH(request: Request, ctx: ItemContext) {
    const auth = await requireRole(roles);
    if (!auth.ok) return auth.response;

    const json = await readJson(request);
    if (!json.ok) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = updateSchema.safeParse(json.body);
    if (!parsed.success) return validationError(parsed.error);

    if (hooks.validate) {
      const message = await hooks.validate(parsed.data as Doc);
      if (message) return badRequest(message);
    }

    const { id } = await ctx.params;
    try {
      // Fetch the pre-update doc only when a caller needs it (afterUpdate).
      const previous = hooks.afterUpdate ? await repo.findById(id) : null;
      const updated = await repo.update(id, parsed.data as Doc, auth.actor);
      if (!updated) return notFound();
      hooks.afterUpdate?.(updated, previous);
      return NextResponse.json(updated);
    } catch (error) {
      if (isDuplicateKeyError(error)) return conflict();
      console.error("[admin] update failed", error);
      return serverError();
    }
  }

  async function DELETE(_request: Request, ctx: ItemContext) {
    const auth = await requireRole(roles);
    if (!auth.ok) return auth.response;

    const { id } = await ctx.params;

    if (hooks.beforeDelete) {
      const message = await hooks.beforeDelete(id);
      if (message) return NextResponse.json({ message }, { status: 409 });
    }

    const removed = await repo.remove(id);
    if (!removed) return notFound();

    hooks.afterDelete?.(removed);
    return NextResponse.json({ message: "Deleted" });
  }

  return { GET, PATCH, DELETE };
}
