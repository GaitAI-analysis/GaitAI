import React from "react";
import { AnalyzeScreen, RequireSubscription } from "@gaitai/ui";

export default function Screen() {
  return <RequireSubscription><AnalyzeScreen /></RequireSubscription>;
}
