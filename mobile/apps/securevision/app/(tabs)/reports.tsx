import React from "react";
import { ReportsScreen, RequireSubscription } from "@gaitai/ui";

export default function Screen() {
  return <RequireSubscription><ReportsScreen /></RequireSubscription>;
}
