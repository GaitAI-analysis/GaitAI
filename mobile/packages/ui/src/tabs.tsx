import React from "react";
import { Tabs } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "./theme";

type Icon = "home" | "analyze" | "progress" | "reports" | "profile";
function TabIcon({ name, color }: { name: Icon; color: string }) {
  const p: Record<Icon, React.ReactNode> = {
    home: <Path d="M3 11 12 3l9 8v10H3z" stroke={color} strokeWidth={1.8} fill="none" strokeLinejoin="round" />,
    analyze: <><Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={1.8} fill="none" /><Path d="M8 13l3-4 2 3 3-5" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    progress: <Path d="M4 19h16M6 15l4-5 4 3 4-7" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    reports: <Path d="M6 3h9l4 4v14H6zM9 12h6M9 16h6" stroke={color} strokeWidth={1.8} fill="none" strokeLinejoin="round" />,
    profile: <><Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} fill="none" /><Path d="M4 21c1-4 4-6 8-6s7 2 8 6" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" /></>,
  };
  return <Svg width={24} height={24} viewBox="0 0 24 24">{p[name]}</Svg>;
}

/** Five tabs. `progressTitle` is "Progress" for MobilityCare, "Activity" for SecureVision. */
export function AppTabs({ progressTitle }: { progressTitle: string }) {
  const t = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: t.accent, tabBarInactiveTintColor: t.mute, tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line, height: 64, paddingTop: 6 }, tabBarLabelStyle: { fontSize: 11, fontWeight: "600" }, tabBarHideOnKeyboard: true }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <TabIcon name="home" color={String(color)} /> }} />
      <Tabs.Screen name="analyze" options={{ title: "Analyze", tabBarIcon: ({ color }) => <TabIcon name="analyze" color={String(color)} /> }} />
      <Tabs.Screen name="progress" options={{ title: progressTitle, tabBarIcon: ({ color }) => <TabIcon name="progress" color={String(color)} /> }} />
      <Tabs.Screen name="reports" options={{ title: "Reports", tabBarIcon: ({ color }) => <TabIcon name="reports" color={String(color)} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <TabIcon name="profile" color={String(color)} /> }} />
    </Tabs>
  );
}
