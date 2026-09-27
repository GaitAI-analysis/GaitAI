import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme, AccessibilityInfo } from "react-native";
import { makeTheme, type ProductId, type Theme } from "@gaitai/design-system";

const Ctx = createContext<Theme>(makeTheme("mobilitycare", "light"));
const MotionCtx = createContext<boolean>(false);

export function ThemeProvider({ product, children }: { product: ProductId; children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(() => makeTheme(product, scheme === "dark" ? "dark" : "light"), [product, scheme]);
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
