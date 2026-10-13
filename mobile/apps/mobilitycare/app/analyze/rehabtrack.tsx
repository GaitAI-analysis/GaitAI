import React from "react";
import { RehabTrackScreen, RequireSubscription } from "@gaitai/ui";

export default function Screen() {
  return <RequireSubscription><RehabTrackScreen /></RequireSubscription>;
}
