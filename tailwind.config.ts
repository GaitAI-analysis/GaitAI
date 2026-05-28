import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "2rem",
        lg: "3rem",
        xl: "4rem",
      },
      screens: {
        "2xl": "1320px",
      },
    },
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "rgb(var(--c-obsidian) / <alpha-value>)",
          50: "rgb(var(--c-obsidian-50) / <alpha-value>)",
          100: "rgb(var(--c-obsidian-100) / <alpha-value>)",
          200: "rgb(var(--c-obsidian-200) / <alpha-value>)",
          300: "rgb(var(--c-obsidian-300) / <alpha-value>)",
          400: "rgb(var(--c-obsidian-400) / <alpha-value>)",
          500: "rgb(var(--c-obsidian-500) / <alpha-value>)",
        },
        gunmetal: {
          DEFAULT: "rgb(var(--c-gunmetal) / <alpha-value>)",
          light: "rgb(var(--c-gunmetal-light) / <alpha-value>)",
          dark: "rgb(var(--c-gunmetal-dark) / <alpha-value>)",
        },
        royal: {
          DEFAULT: "#2563FF",
          50: "#E8EFFF",
          100: "#C5D5FF",
          200: "#8FAFFF",
          300: "#5587FF",
          400: "#2563FF",
          500: "#1B4ED9",
          600: "#1438A8",
          700: "#0E2879",
        },
        violet: {
          DEFAULT: "#7C3AED",
          50: "#F1E8FE",
          100: "#DEC8FB",
          200: "#BD96F6",
          300: "#9C64F1",
          400: "#7C3AED",
          500: "#5F25BF",
          600: "#481B92",
          700: "#311265",
        },
        cyan: {
          DEFAULT: "#4FD1FF",
          50: "#E8F8FF",
          100: "#C5ECFF",
          200: "#92DEFF",
          300: "#4FD1FF",
          400: "#1EB8EF",
          500: "#108FC0",
          600: "#0A6890",
        },
        soft: {
          white: "rgb(var(--c-soft-white) / <alpha-value>)",
          gray: "rgb(var(--c-soft-gray) / <alpha-value>)",
          mute: "rgb(var(--c-soft-mute) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-2xl": ["clamp(3rem, 7vw, 6.25rem)", { lineHeight: "1.02", letterSpacing: "-0.04em", fontWeight: "600" }],
        "display-xl": ["clamp(2.5rem, 5.5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "600" }],
        "display-lg": ["clamp(2rem, 4vw, 3.25rem)", { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-md": ["clamp(1.5rem, 2.5vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(148, 163, 184, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.06) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(circle at center, rgba(37, 99, 255, 0.25), transparent 60%)",
        "radial-violet":
          "radial-gradient(circle at center, rgba(124, 58, 237, 0.25), transparent 60%)",
        "radial-cyan":
          "radial-gradient(circle at center, rgba(79, 209, 255, 0.2), transparent 60%)",
        "gradient-brand":
          "linear-gradient(135deg, #2563FF 0%, #7C3AED 60%, #4FD1FF 100%)",
        "gradient-secure":
          "linear-gradient(135deg, #0E2879 0%, #2563FF 50%, #4FD1FF 100%)",
        "gradient-care":
          "linear-gradient(135deg, #311265 0%, #7C3AED 50%, #4FD1FF 100%)",
        "gradient-mesh":
          "radial-gradient(at 20% 20%, rgba(37,99,255,0.25) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(124,58,237,0.22) 0px, transparent 50%), radial-gradient(at 60% 80%, rgba(79,209,255,0.18) 0px, transparent 50%)",
      },
      backgroundSize: {
        "grid-lg": "60px 60px",
        "grid-md": "40px 40px",
      },
      boxShadow: {
        glow: "0 0 40px rgba(37,99,255,0.35), 0 0 80px rgba(37,99,255,0.18)",
        "glow-violet": "0 0 40px rgba(124,58,237,0.35), 0 0 80px rgba(124,58,237,0.18)",
        "glow-cyan": "0 0 40px rgba(79,209,255,0.35), 0 0 80px rgba(79,209,255,0.18)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.05)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 30px 60px -20px rgba(0,0,0,0.5)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out both",
        "fade-up": "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "spin-slow": "spin 20s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "scan-line": "scanLine 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          from: { backgroundPosition: "0% 50%" },
          to: { backgroundPosition: "200% 50%" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
