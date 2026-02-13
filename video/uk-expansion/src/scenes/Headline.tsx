import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { Colors, FONT_FAMILY } from "../components/brand";

export const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "United Kingdom" spring entrance
  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const titleY = interpolate(titleEnter, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleEnter, [0, 1], [0, 1]);

  // Animated counter 25% → 100%
  const counterProgress = interpolate(
    frame,
    [0.5 * fps, 2.5 * fps],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );
  const counterValue = Math.round(
    interpolate(counterProgress, [0, 1], [25, 100])
  );

  // Subtitle fade in
  const subtitleOpacity = interpolate(
    frame,
    [2 * fps, 3 * fps],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const subtitleY = interpolate(
    frame,
    [2 * fps, 3 * fps],
    [20, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Counter scale pulse when hitting 100
  const isAt100 = counterValue >= 100;
  const pulseScale = isAt100
    ? interpolate(
        frame,
        [2.5 * fps, 2.8 * fps, 3.1 * fps],
        [1, 1.08, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      )
    : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: Colors.midnightBlue,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Subtle background gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }}
      />

      {/* United Kingdom text */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 52,
          fontWeight: 600,
          color: "rgba(255,255,255,0.8)",
          letterSpacing: 8,
          textTransform: "uppercase",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 20,
        }}
      >
        United Kingdom
      </div>

      {/* Big counter */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 200,
          fontWeight: 800,
          color: Colors.white,
          transform: `scale(${pulseScale})`,
          lineHeight: 1,
          textShadow: isAt100
            ? `0 0 40px rgba(255,215,0,0.4)`
            : "none",
        }}
      >
        {counterValue}%
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 38,
          fontWeight: 600,
          color: "rgba(255,255,255,0.85)",
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          marginTop: 24,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        First Hub Country at Full CLM Migration
      </div>
    </AbsoluteFill>
  );
};
