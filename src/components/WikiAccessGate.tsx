"use client";

import { useEffect } from "react";

const privateOrigin = "https://gaitai-wiki.gait-ai-founder.workers.dev";

/** Public entry point only. Documentation and its search data live privately. */
export function WikiAccessGate({ path }: { path: string }) {
  const destination = `${privateOrigin}${path}`;
  useEffect(() => {
    window.location.replace(destination + window.location.search + window.location.hash);
  }, [destination]);
  return <section aria-labelledby="private-wiki-heading" className="mx-auto min-h-[60vh] max-w-3xl px-6 py-24">
    <p className="text-sm font-medium uppercase tracking-widest text-soft-gray">GaitAI Wiki</p>
    <h1 id="private-wiki-heading" className="mt-4 text-3xl font-semibold text-soft-white">Private technical documentation</h1>
    <p className="mt-5 text-base leading-relaxed text-soft-gray">The Wiki requires sign-in with the approved GitHub account.</p>
    <a href={destination} className="mt-8 inline-flex min-h-12 items-center rounded-lg border border-current px-5 py-3 font-medium text-soft-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Open private Wiki</a>
  </section>;
}
