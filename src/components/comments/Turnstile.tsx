"use client";

/**
 * Pluggable Cloudflare Turnstile (CAPTCHA) widget. Renders nothing unless a site
 * key is configured (NEXT_PUBLIC_TURNSTILE_SITE_KEY). The parent treats a null
 * token as "not yet solved" only when CAPTCHA_ENABLED is true, so this stays
 * fully optional.
 */
import { useEffect, useRef } from "react";
import { CAPTCHA_ENABLED, TURNSTILE_SITE_KEY } from "@/lib/comments/config";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Turnstile({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!CAPTCHA_ENABLED) return;

    const mount = () => {
      if (!ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto",
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    };

    if (window.turnstile) {
      mount();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = mount;
      document.head.appendChild(s);
    } else {
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          mount();
        }
      }, 200);
      return () => clearInterval(t);
    }
  }, [onToken]);

  if (!CAPTCHA_ENABLED) return null;
  return <div ref={ref} className="mt-2" />;
}
