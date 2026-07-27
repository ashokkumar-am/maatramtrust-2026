"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryEnabled = Boolean(UPLOAD_PRESET && CLOUD_NAME);

export interface BannerValues {
  id: string;
  title?: string;
  mediaType: "image" | "video";
  url: string;
  public_id: string;
  alt?: string;
  caption?: string;
  link?: string;
  order?: number;
  isActive?: boolean;
}

interface Media {
  url: string;
  publicId: string;
  mediaType: "image" | "video";
}

function MediaPreview({ media }: { media: Media }) {
  return media.mediaType === "video" ? (
    <video
      src={media.url}
      muted
      preload="metadata"
      className="h-28 w-full rounded-lg border object-cover"
    />
  ) : (
    <Image
      src={media.url}
      alt="Banner media"
      width={320}
      height={200}
      unoptimized
      className="h-28 w-full rounded-lg border object-cover"
    />
  );
}

/**
 * Create or edit a homepage banner. Without `banner` it renders a "New banner"
 * button that POSTs `/api/admin/banners`; with `banner` it renders an Edit
 * button that PATCHes `/api/admin/banners/:id` (cleared optional fields are
 * sent as `null` to $unset them, and replacing the media lets the API delete
 * the previous Cloudinary asset).
 */
export function BannerDialog({ banner }: { banner?: BannerValues }) {
  const router = useRouter();
  const editing = Boolean(banner);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(banner?.title ?? "");
  const [alt, setAlt] = useState(banner?.alt ?? "");
  const [caption, setCaption] = useState(banner?.caption ?? "");
  const [link, setLink] = useState(banner?.link ?? "");
  const [order, setOrder] = useState<number | "">(banner?.order ?? 0);
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [media, setMedia] = useState<Media | null>(
    banner
      ? {
          url: banner.url,
          publicId: banner.public_id,
          mediaType: banner.mediaType,
        }
      : null,
  );

  function save() {
    if (!media) {
      toast.error("Upload the banner image or video first.");
      return;
    }
    const asset = media;

    startTransition(async () => {
      // Create drops empty optional fields; edit sends them as `null` so the
      // server clears previously-set values instead of leaving them untouched.
      const empty = editing ? null : undefined;
      const mediaChanged = asset.publicId !== banner?.public_id;

      const res = await fetch(
        editing ? `/api/admin/banners/${banner!.id}` : "/api/admin/banners",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || empty,
            alt: alt.trim() || empty,
            caption: caption.trim() || empty,
            link: link.trim() || empty,
            order: Number(order) || 0,
            isActive,
            ...((!editing || mediaChanged) && {
              url: asset.url,
              public_id: asset.publicId,
              mediaType: asset.mediaType,
            }),
          }),
        },
      );

      if (res.ok) {
        toast.success(editing ? "Banner updated." : "Banner created.");
        setOpen(false);
        if (!editing) {
          setTitle("");
          setAlt("");
          setCaption("");
          setLink("");
          setOrder(0);
          setIsActive(true);
          setMedia(null);
        }
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(
        data.message ??
          (editing
            ? "Could not update the banner."
            : "Could not create the banner."),
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          editing ? (
            <Button variant="outline" size="sm">
              <Pencil className="size-3" />
              Edit
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="size-3" />
              New banner
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit banner" : "New banner"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the banner details, or replace the media — the previous asset is removed automatically."
              : "Upload the banner media and set how it appears on the homepage."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {media && <MediaPreview media={media} />}
            {cloudinaryEnabled ? (
              <CldUploadWidget
                uploadPreset={UPLOAD_PRESET}
                options={{ multiple: false, resourceType: "auto" }}
                onSuccess={(result) => {
                  const info = result.info;
                  if (info && typeof info === "object") {
                    setMedia({
                      url: info.secure_url,
                      publicId: info.public_id,
                      mediaType:
                        info.resource_type === "video" ? "video" : "image",
                    });
                  }
                }}
              >
                {({ open: openWidget }) => (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openWidget()}
                    className="w-fit"
                  >
                    <ImagePlus className="size-3.5" />
                    {media ? "Replace media" : "Upload image / video"}
                  </Button>
                )}
              </CldUploadWidget>
            ) : (
              <p className="text-muted-foreground text-xs">
                Cloudinary is not configured; banner media can’t be uploaded
                here.
              </p>
            )}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Title (optional)</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Banner title"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Alt text (optional)</span>
              <Input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Accessibility description"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Order</span>
              <Input
                type="number"
                value={order}
                onChange={(e) =>
                  setOrder(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Caption (optional)</span>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Shown over the banner"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Link (optional)</span>
            <Input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://… click-through URL"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 accent-[#0a7d3e]"
            />
            Active (shown on the homepage)
          </label>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" size="sm" type="button">
                Cancel
              </Button>
            }
          />
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Create banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
