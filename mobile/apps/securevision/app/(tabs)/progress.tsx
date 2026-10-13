import React from "react";
import { ProgressScreen, RequireSubscription } from "@gaitai/ui";

export default function Screen() {
  return <RequireSubscription><ProgressScreen title="Activity" /></RequireSubscription>;
}
