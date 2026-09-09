"use client";

import { Component, type ReactNode } from "react";

/**
 * Keeps a decorative WebGL scene from taking the page down with it.
 *
 * `useVisualBudget` already declines to mount a scene on small, slow or
 * data-saving devices, and probes for a WebGL context first — but context
 * creation can still fail at mount time (GPU blocklists, exhausted contexts,
 * a browser policy). React has no per-subtree recovery without a boundary,
 * so without this one the whole homepage unmounted to the route error page.
 * The fallback is the same static Motion DNA the budget hook would have used.
 */
export class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Decorative scene disabled:", error);
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
