import React from "react";
import { WalkScanScreen, RequireSubscription } from "@gaitai/ui";

export default function Screen() {
  return <RequireSubscription><WalkScanScreen /></RequireSubscription>;
}
