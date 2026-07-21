import "server-only";
import { v2 as cloudinary } from "cloudinary";

export type CloudinaryResourceType = "image" | "video" | "raw";

/**
 * Configure the Cloudinary server SDK from env (used for server-side asset
 * deletion). The API secret must be a server-only var (`CLOUDINARY_API_SECRET`)
 * — never a `NEXT_PUBLIC_*` one, which ships to the browser. Returns false (no
 * throw) when unconfigured so cleanup stays best-effort. Uploads happen in the
 * browser via an unsigned preset and don't need the secret.
 */
function configure(): boolean {
  const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const api_key =
    process.env.CLOUDINARY_API_KEY ??
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    return false;
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  return true;
}

/** Whether the Cloudinary server SDK has the credentials it needs. */
export function isCloudinaryConfigured(): boolean {
  return configure();
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
}

/**
 * Upload file bytes to Cloudinary via the server SDK (signed with the API
 * secret — no unsigned preset needed). `resource_type: "auto"` handles PDFs,
 * office docs and images. Throws when unconfigured; guard with
 * {@link isCloudinaryConfigured}.
 */
export async function uploadToCloudinary(
  bytes: Uint8Array,
  options: { folder?: string; filename?: string } = {},
): Promise<CloudinaryUploadResult> {
  if (!configure()) {
    throw new Error("Cloudinary is not configured");
  }

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: options.folder,
        use_filename: Boolean(options.filename),
        filename_override: options.filename,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );
    stream.end(Buffer.from(bytes));
  });
}

/**
 * Delete an asset from Cloudinary by public id. Best-effort: no-ops (logged)
 * when the server SDK is unconfigured. Videos require `resourceType: "video"`,
 * raw files `"raw"`.
 */
export async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceType = "image",
): Promise<void> {
  if (!configure()) {
    console.warn("[cloudinary] destroy skipped — server SDK not configured");
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
