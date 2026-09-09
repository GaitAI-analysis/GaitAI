import { MotionLoader } from "@/components/ui/MotionLoader";

/**
 * Route-level pending state. On the static export this only appears during a
 * client-side navigation while the next page's payload is fetched, so it is
 * deliberately quiet: one gait-cycle line, no layout that competes with the
 * page about to arrive.
 */
export default function Loading() {
  return (
    <div className="container-wide grid min-h-[60vh] place-items-center py-24">
      <MotionLoader label="Tracing the next page" />
    </div>
  );
}
