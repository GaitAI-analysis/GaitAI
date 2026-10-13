import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme, AccessibilityInfo } from "react-native";
import { GEORAMA, makeTheme, type ProductId, type Theme } from "@gaitai/design-system";

const Ctx = createContext<Theme>(makeTheme("mobilitycare", "light"));
const MotionCtx = createContext<boolean>(false);

/**
 * `fontsReady` is true once the layout has loaded Georama (expo-font); until
 * then — and if loading fails — every Text falls back to the system font so
 * nothing renders invisible.
 */
export function ThemeProvider({ product, fontsReady = false, children }: { product: ProductId; fontsReady?: boolean; children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(() => makeTheme(product, scheme === "dark" ? "dark" : "light", fontsReady ? GEORAMA : null), [product, scheme, fontsReady]);
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return <Ctx.Provider value={theme}><MotionCtx.Provider value={reduce}>{children}</MotionCtx.Provider></Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
export const useReducedMotion = () => useContext(MotionCtx);
