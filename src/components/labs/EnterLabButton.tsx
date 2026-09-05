"use client";

import { useEffect, useRef } from "react";
import { enterLab } from "./lab-experience-event";

/**
 * "Enter the Lab". A button, not a link: nothing navigates. It asks the
 * viewer on this page to open, and the viewer returns focus here when it
 * closes.
 *
 * WARMING THE ROOM. The three-dimensional scene is a separate chunk that is
 * only ever needed after this button is pressed. When the button comes within
 * a screen of the viewport the chunk is fetched, so the press itself waits
 * only for the room's assets, not for the code. Assets are not prefetched —
 * a few megabytes is the reader's decision, made by pressing the button.
 */
export function EnterLabButton({
  className = "btn-primary",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let warmed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (warmed || !entries.some((e) => e.isIntersecting)) return;
        warmed = true;
        void import("./scene/LabScene");
        observer.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <button ref={ref} type="button" className={className} onClick={() => enterLab()}>
      {children}
    </button>
  );
}
