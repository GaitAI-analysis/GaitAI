import React, { useRef, useState } from "react";
import { Animated, Dimensions, Image, ScrollView, View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { analytics } from "@gaitai/core";
import { productMeta, space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Row, Text } from "../primitives";
import { useTheme } from "../theme";

const SLIDES = {
  mobilitycare: [
    { title: "Understand your movement.", body: "A short walking video becomes clear, measured movement indicators." },
    { title: "Record. Analyze. Improve.", body: "Guided capture, analysis on your phone, results you can compare over time." },
    { title: "Your movement data stays under your control.", body: "Videos are analysed on this device and deleted unless you choose to keep them." },
  ],
  securevision: [
    { title: "Understand movement.", body: "Count people and read how a space is used, from footage you are authorised to analyse." },
    { title: "Protect privacy.", body: "Analysis runs on your phone. No faces, no identities: boxes and counts only." },
    { title: "Act on meaningful signals.", body: "Draw a zone, see entries, occupancy and dwell, and export what matters." },
  ],
} as const;

export function OnboardingScreen({ mark, onDone }: { mark: ImageSourcePropType; onDone: () => void }) {
  const t = useTheme(); const app = useApp(); const insets = useSafeAreaInsets();
  const slides = SLIDES[app.product]; const [i, setI] = useState(0);
  const W = Dimensions.get("window").width; const x = useRef(new Animated.Value(0)).current;
  const finish = async () => { await app.updateProfile({ onboardingComplete: true }); await analytics.track("onboarding_completed", { product: app.product }); onDone(); };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }}>
      <Row style={{ paddingHorizontal: space.lg, justifyContent: "space-between" }}>
        <Row gap={10}><Image source={mark} style={{ width: 36, height: 36, borderRadius: 10 }} accessibilityIgnoresInvertColors /><Text variant="bodyStrong">{productMeta[app.product].name}</Text></Row>
        <Button kind="ghost" label="Skip" onPress={finish} />
      </Row>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: false, listener: (e: { nativeEvent: { contentOffset: { x: number } } }) => setI(Math.round(e.nativeEvent.contentOffset.x / W)) })} scrollEventThrottle={16} style={{ flex: 1 }}>
        {slides.map((s, k) => (
          <View key={k} style={{ width: W, paddingHorizontal: space.lg, justifyContent: "center", gap: space.lg }} accessibilityLabel={`Step ${k + 1} of ${slides.length}. ${s.title} ${s.body}`}>
            <View style={{ height: 120, width: 120, borderRadius: 32, backgroundColor: t.accentSoft, alignSelf: "flex-start", alignItems: "center", justifyContent: "center" }}><Text variant="hero" color={t.accent}>{k + 1}</Text></View>
            <Text variant="hero">{s.title}</Text>
            <Text variant="lead">{s.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: space.lg, gap: space.lg }}>
        <Row gap={6} style={{ justifyContent: "center" }} accessibilityLabel={`Page ${i + 1} of ${slides.length}`}>{slides.map((_, k) => <View key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? t.accent : t.line }} />)}</Row>
        <Button label={i === slides.length - 1 ? "Get started" : "Get started"} onPress={finish} />
      </View>
    </View>
  );
}
