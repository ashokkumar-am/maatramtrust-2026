<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Engineering standards

Apply these to all code written in this repo:

- **Clean code / SonarQube:** write code that passes SonarQube quality gates — no code smells, no duplication, low cognitive complexity, no unused variables (e.g. unused `catch (error)` bindings), proper error handling, no hardcoded secrets.
- **SOLID principles** and appropriate **design patterns** — favor small, single-responsibility units and dependency inversion over concrete implementations.
- **Modular approach** — separate concerns (routes thin, business logic in `src/lib` / services, data access in models); keep functions and files focused and reusable.
- **Next.js 16 App Router + Server Actions** — prefer Server Components and Server Actions; use Route Handlers only where an HTTP API is genuinely needed. Always confirm current APIs against `node_modules/next/dist/docs/` (see Next.js rules above).

# Project conventions

- **Keep `docs/STATUS.md` current.** Whenever you add or change an API endpoint, a model in `src/models`, or a lib helper in `src/lib`, update the relevant table (and the `_Last updated:_` date) in `docs/STATUS.md` in the same change.
- **DB connections:** v1 API routes use the Mongoose helper `connectMongoDB` from `@/lib/mongoose`. The native `mongodb` driver `clientPromise` in `@/lib/mongodb` is used by `auth.ts` and `donations.ts` — don't conflate them.
