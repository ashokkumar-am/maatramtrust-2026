import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const SECRET_IDS: Record<string, string> = {
  dev: "maatramtrust/dev/app",
  prod: "maatramtrust/prod/app",
};

/**
 * Load the app's configuration from AWS Secrets Manager into `process.env`.
 *
 * Opt-in via `MAATRAM_SECRETS_STAGE=dev|prod` — when unset this is a no-op and
 * the usual `.env*` files apply. Runs from `next.config.ts`, which Next loads
 * before compiling anything, so secret values (including `NEXT_PUBLIC_*` ones)
 * behave exactly like env-file values; keys present in the secret OVERRIDE
 * `.env*` values so Secrets Manager is authoritative when enabled.
 *
 * Credentials use the standard AWS chain (`AWS_PROFILE`/`aws sso login`
 * locally, an IAM role in production).
 */
export async function loadSecretsIntoEnv(): Promise<void> {
  const stage = process.env.MAATRAM_SECRETS_STAGE;
  if (!stage) return;

  const secretId = SECRET_IDS[stage];
  if (!secretId) {
    throw new Error(
      `Unknown MAATRAM_SECRETS_STAGE "${stage}" — use "dev" or "prod".`,
    );
  }

  const client = new SecretsManagerClient({});
  const result = await client.send(
    new GetSecretValueCommand({ SecretId: secretId }),
  );

  let secrets: Record<string, unknown>;
  try {
    secrets = JSON.parse(result.SecretString ?? "");
  } catch {
    throw new Error(`${secretId} is not valid JSON (expected key/value pairs)`);
  }

  for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = String(value);
  }
  console.info(
    `[secrets] loaded ${Object.keys(secrets).length} keys from ${secretId}`,
  );
}
