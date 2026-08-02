import type { NextConfig } from "next";
import { loadSecretsIntoEnv } from "./secrets-env";

// mongodb and mongoose are on Next's default serverExternalPackages list, so
// they're require()d from node_modules at runtime instead of being bundled.
// Amplify packages the SSR compute strictly from output file traces, which
// miss these packages' own dependency trees — without the includes below the
// server crashes at import with "Cannot find module 'bson'/'kareem'".
// Transitive runtime closure of mongodb@7 + mongoose@9:
const externalDbPackages = [
  "@mongodb-js/saslprep",
  "@standard-schema/spec",
  "@types/webidl-conversions",
  "@types/whatwg-url",
  "bson",
  "kareem",
  "memory-pager",
  "mongodb",
  "mongodb-connection-string-url",
  "mongoose",
  "mpath",
  "mquery",
  "ms",
  "punycode",
  "sift",
  "sparse-bitfield",
  "tr46",
  "webidl-conversions",
  "whatwg-url",
];
const dbTracingIncludes = externalDbPackages.map(
  (pkg) => `node_modules/${pkg}/**/*`,
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Placeholder photo hosts used by scripts/seed-dummy-data.mjs demo data.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
  },
  outputFileTracingIncludes: {
    "/*": dbTracingIncludes,
    "/**": dbTracingIncludes,
  },
};

// Async config: when MAATRAM_SECRETS_STAGE is set, pull the app's env from
// AWS Secrets Manager before anything compiles (see secrets-env.ts).
export default async function config(): Promise<NextConfig> {
  await loadSecretsIntoEnv();
  return nextConfig;
}
