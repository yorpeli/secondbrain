import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Colors, FONT_FAMILY } from "../components/brand";
import { FunnelStep } from "../components/FunnelStep";

const FUNNEL_DATA = [
  { label: "Company Details", oldPct: 92, newPct: 94, liftPp: 2 },
  { label: "T&Cs", oldPct: 67, newPct: 73, liftPp: 6 },
  { label: "Submitted Docs", oldPct: 53, newPct: 63, liftPp: 10 },
  { label: "Approval", oldPct: 33, newPct: 44, liftPp: 11 },
];

export const EkybBreak: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const titleOpacity = interpolate(titleEnter, [0, 1], [0, 1]);
  const titleY = interpolate(titleEnter, [0, 1], [-30, 0]);

  // Highlight text
  const highlightOpacity = interpolate(
    frame,
    [2.5 * fps, 3.2 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: Colors.lightGray,
        padding: "60px 160px",
        overflow: "hidden",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 52,
          fontWeight: 800,
          color: Colors.midnightBlue,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 40,
        }}
      >
        The eKYB Breakthrough
      </div>

      {/* Funnel steps */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {FUNNEL_DATA.map((step, i) => (
          <FunnelStep
            key={step.label}
            label={step.label}
            oldPct={step.oldPct}
            newPct={step.newPct}
            liftPp={step.liftPp}
            index={i}
            total={FUNNEL_DATA.length}
            delay={Math.round((0.4 + i * 0.4) * fps)}
          />
        ))}
      </div>

      {/* Highlight callout */}
      <div
        style={{
          opacity: highlightOpacity,
          fontFamily: FONT_FAMILY,
          fontSize: 28,
          fontWeight: 700,
          color: Colors.onTrack,
          textAlign: "center",
          marginTop: 24,
          padding: "16px 32px",
          backgroundColor: "rgba(46,125,50,0.08)",
          borderRadius: 12,
          border: `2px solid rgba(46,125,50,0.2)`,
        }}
      >
        55% of UK companies saw reduced document requests
      </div>
    </AbsoluteFill>
  );
};
