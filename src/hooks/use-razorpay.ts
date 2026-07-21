"use client";

import { useCallback, useEffect, useState } from "react";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type Status = "idle" | "loading" | "ready" | "error";

/**
 * Loads the Razorpay Checkout script on demand and reports its status.
 * The script is loaded once and reused across the app.
 */
export function useRazorpay() {
  const [status, setStatus] = useState<Status>("idle");

  const load = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setStatus("ready");
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      setStatus(existing.dataset.loaded === "true" ? "ready" : "loading");
      return;
    }

    setStatus("loading");
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      setStatus("ready");
    };
    script.onerror = () => setStatus("error");
    document.body.appendChild(script);
  }, []);

  // Preload as soon as the component using this hook mounts.
  useEffect(() => {
    load();
  }, [load]);

  return { status, isReady: status === "ready", load } as const;
}
