import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const FONT_FAMILY = fontFamily;

// Colors derived from lib/doc-style.ts
export const Colors = {
  midnightBlue: "#002373",
  darkGray: "#5D6D7E",
  charcoal: "#1E1E28",
  white: "#FFFFFF",
  lightGray: "#F8F9FA",
  borderGray: "#D5D8DC",
  // Status
  onTrack: "#2E7D32",
  potentialIssues: "#F57F17",
  atRisk: "#C62828",
  // UK Flag colors
  ukRed: "#CF142B",
  ukBlue: "#00247D",
  // Accent
  gold: "#FFD700",
} as const;
