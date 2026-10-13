import React from "react";
import { CrowdScreen, RequireSubscription } from "@gaitai/ui";

export default function Screen() {
  return <RequireSubscription><CrowdScreen kind="crowdsense" /></RequireSubscription>;
}
