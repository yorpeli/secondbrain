import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Colors, FONT_FAMILY } from "../components/brand";

export const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "First hub country." entrance
  const line1Enter = spring({
    frame,
    fps,
    delay: Math.round(0.3 * fps),
    config: { damping: 200 },
  });
  const line1Opacity = interpolate(line1Enter, [0, 1], [0, 1]);
  const line1Y = interpolate(line1Enter, [0, 1], [30, 0]);

  // "The template for what's next." entrance
  const line2Enter = spring({
    frame,
    fps,
    delay: Math.round(1.2 * fps),
    config: { damping: 200 },
  });
  const line2Opacity = interpolate(line2Enter, [0, 1], [0, 1]);
  const line2Y = interpolate(line2Enter, [0, 1], [30, 0]);

  // Glow pulse on the text
  const glowIntensity = interpolate(
    frame,
    [2 * fps, 2.5 * fps, 3 * fps, 3.5 * fps],
    [0, 0.4, 0.2, 0.4],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: Colors.midnightBlue,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, rgba(255,215,0,${glowIntensity * 0.15}) 0%, transparent 60%)`,
        }}
      />

      {/* Line 1 */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 72,
          fontWeight: 800,
          color: Colors.white,
          opacity: line1Opacity,
          transform: `translateY(${line1Y}px)`,
          textShadow: `0 0 ${glowIntensity * 40}px rgba(255,215,0,${glowIntensity})`,
          marginBottom: 24,
        }}
      >
        First hub country.
      </div>

      {/* Line 2 */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 48,
          fontWeight: 600,
          color: "rgba(255,255,255,0.85)",
          opacity: line2Opacity,
          transform: `translateY(${line2Y}px)`,
        }}
      >
        The template for what's next.
      </div>
    </AbsoluteFill>
  );
};
