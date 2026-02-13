import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { Colors, FONT_FAMILY } from "../components/brand";

export const RoyalOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 2 seconds of pure black before anything appears
  const DELAY = 2 * fps;

  // Union Jack diagonal lines sweep (starts after 2s black)
  const lineProgress = interpolate(frame, [DELAY, DELAY + 2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // "UK" text pulse (starts after 2s black)
  const ukOpacity = interpolate(frame, [DELAY + 1 * fps, DELAY + 2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ukScale = interpolate(
    frame,
    [DELAY + 1 * fps, DELAY + 2.5 * fps, DELAY + 3 * fps],
    [0.8, 1.05, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );

  // Crown / decorative element opacity (starts after 2s black)
  const crownOpacity = interpolate(frame, [DELAY + 1.5 * fps, DELAY + 2.5 * fps], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A12",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Diagonal line - top left to center (red) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "150%",
          height: 4,
          backgroundColor: Colors.ukRed,
          transformOrigin: "0 0",
          transform: `rotate(33deg) scaleX(${lineProgress})`,
          opacity: 0.7,
        }}
      />
      {/* Diagonal line - top right to center (blue) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "150%",
          height: 4,
          backgroundColor: Colors.ukBlue,
          transformOrigin: "100% 0",
          transform: `rotate(-33deg) scaleX(${lineProgress})`,
          opacity: 0.7,
        }}
      />
      {/* Horizontal cross line (white) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          height: 3,
          backgroundColor: "rgba(255,255,255,0.3)",
          transform: `scaleX(${lineProgress})`,
          transformOrigin: "center",
        }}
      />
      {/* Vertical cross line (white) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: 3,
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.3)",
          transform: `scaleY(${lineProgress})`,
          transformOrigin: "center",
        }}
      />

      {/* Subtle crown / decorative element */}
      <div
        style={{
          position: "absolute",
          top: 200,
          opacity: crownOpacity,
          fontSize: 120,
          color: Colors.gold,
          filter: "blur(1px)",
        }}
      >
        {"\u2655"}
      </div>

      {/* UK text */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 180,
          fontWeight: 800,
          color: Colors.white,
          opacity: ukOpacity,
          transform: `scale(${ukScale})`,
          letterSpacing: 20,
          textShadow: `0 0 60px rgba(0,35,115,0.6)`,
        }}
      >
        UK
      </div>

      {/* Subtle glow ring behind UK */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: `2px solid rgba(255,215,0,${crownOpacity * 0.3})`,
          opacity: crownOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
