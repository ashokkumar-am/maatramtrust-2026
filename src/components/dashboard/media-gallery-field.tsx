"use client";

import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryEnabled = Boolean(UPLOAD_PRESET && CLOUD_NAME);

export interface GalleryMedia {
  url: string;
  publicId?: string;
  mediaType: "image" | "video";
}

/**
 * A Cloudinary-backed photo/video gallery field: thumbnails with remove
 * buttons plus a multi-file upload widget (or a paste-URL fallback when
 * Cloudinary isn't configured). Multi-uploads fire `onAdd` once per file —
 * apply it with a functional state update (`setMedia(prev => [...prev, item])`)
 * so rapid successive uploads don't clobber each other.
 */
export function MediaGalleryField({
  label,
  media,
  onAdd,
  onRemove,
}: {
  label: string;
  media: GalleryMedia[];
  onAdd: (item: GalleryMedia) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>

      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {media.map((item, index) => (
            <div
              key={item.publicId ?? item.url}
              className="relative overflow-hidden rounded-lg border"
            >
              {item.mediaType === "video" ? (
                <video
                  src={item.url}
                  muted
                  preload="metadata"
                  className="h-24 w-full object-cover"
                />
              ) : (
                <Image
                  src={item.url}
                  alt=""
                  width={200}
                  height={120}
                  unoptimized
                  className="h-24 w-full object-cover"
                />
              )}
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute top-1 right-1"
                onClick={() => onRemove(index)}
                aria-label="Remove media"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {cloudinaryEnabled ? (
        <CldUploadWidget
          uploadPreset={UPLOAD_PRESET}
          options={{ multiple: true, resourceType: "auto" }}
          onSuccess={(result) => {
            const info = result.info;
            if (info && typeof info === "object") {
              onAdd({
                url: info.secure_url,
                publicId: info.public_id,
                mediaType: info.resource_type === "video" ? "video" : "image",
              });
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
              Add photos / videos
            </Button>
          )}
        </CldUploadWidget>
      ) : (
        <Input
          placeholder="https://… (paste a media URL and press Enter)"
          onKeyDown={(e) => {
            const value = e.currentTarget.value.trim();
            if (e.key === "Enter" && value) {
              e.preventDefault();
              onAdd({ url: value, mediaType: "image" });
              e.currentTarget.value = "";
            }
          }}
        />
      )}
    </div>
  );
}
