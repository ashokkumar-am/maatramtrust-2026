"use client";

import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryEnabled = Boolean(UPLOAD_PRESET && CLOUD_NAME);

/**
 * A Cloudinary-backed image field: shows a preview with a remove button, an
 * upload widget when Cloudinary is configured, or a paste-URL input as a
 * fallback. `onChange` receives the URL and the Cloudinary public id (empty
 * when cleared or when a URL is typed manually).
 */
export function ImageUploadField({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string;
  onChange: (url: string, publicId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {url ? (
        <div className="relative w-40 overflow-hidden rounded-lg border">
          <Image
            src={url}
            alt={label}
            width={320}
            height={200}
            unoptimized
            className="h-28 w-full object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={() => onChange("", "")}
            aria-label={`Remove ${label}`}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : cloudinaryEnabled ? (
        <CldUploadWidget
          uploadPreset={UPLOAD_PRESET}
          onSuccess={(result) => {
            const info = result.info;
            if (info && typeof info === "object") {
              onChange(info.secure_url, info.public_id);
            }
          }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => open()}
              className="w-fit"
            >
              <ImagePlus className="size-3.5" />
              Upload {label.toLowerCase()}
            </Button>
          )}
        </CldUploadWidget>
      ) : (
        <Input
          value={url}
          onChange={(e) => onChange(e.target.value, "")}
          placeholder="https://… (paste an image URL)"
        />
      )}
    </div>
  );
}
