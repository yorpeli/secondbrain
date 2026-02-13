import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Colors, FONT_FAMILY } from "../components/brand";
import { MetricCard } from "../components/MetricCard";

export const KeyResults: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const titleOpacity = interpolate(titleEnter, [0, 1], [0, 1]);
  const titleY = interpolate(titleEnter, [0, 1], [-30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: Colors.white,
        padding: "60px 120px",
        overflow: "hidden",
      }}
    >
      {/* Subtle background accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: Colors.midnightBlue,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 56,
          fontWeight: 800,
          color: Colors.midnightBlue,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 48,
        }}
      >
        The Results
      </div>

      {/* Three metric comparisons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <MetricCard
          label="Approval Rate"
          oldValue="26%"
          newValue="35%"
          change="+35% higher"
          isPositive
          clmValue={35}
          fourStepValue={26}
          maxValue={50}
          delay={Math.round(0.3 * fps)}
        />

        <MetricCard
          label="E2E Time (days)"
          oldValue="5.9d"
          newValue="3.3d"
          change="-44%"
          isPositive
          clmValue={33}
          fourStepValue={59}
          maxValue={70}
          delay={Math.round(0.8 * fps)}
        />

        <MetricCard
          label="Reopened Docs"
          oldValue="35.2%"
          newValue="17.4%"
          change="-51%"
          isPositive
          clmValue={17.4}
          fourStepValue={35.2}
          maxValue={50}
          delay={Math.round(1.3 * fps)}
        />
      </div>
    </AbsoluteFill>
  );
};
