import React from "react";
import { Link } from "expo-router";
import { Button, Screen, Text } from "@gaitai/ui";

export default function NotFound() {
  return (
    <Screen>
      <Text variant="title" style={{ marginTop: 32 }}>That screen does not exist.</Text>
      <Link href="/(tabs)" asChild><Button label="Go home" onPress={() => {}} style={{ marginTop: 16 }} /></Link>
    </Screen>
  );
}
