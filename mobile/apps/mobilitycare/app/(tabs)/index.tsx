import React from "react";
import { HomeScreen, RequireSubscription } from "@gaitai/ui";
import { MARK } from "../_layout";

export default function Home() {
  return <RequireSubscription><HomeScreen mark={MARK} /></RequireSubscription>;
}
