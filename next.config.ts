import type { NextConfig } from "next";
import { loadSecretsIntoEnv } from "./secrets-env";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

// Async config: when MAATRAM_SECRETS_STAGE is set, pull the app's env from
// AWS Secrets Manager before anything compiles (see secrets-env.ts).
export default async function config(): Promise<NextConfig> {
  await loadSecretsIntoEnv();
  return nextConfig;
}
