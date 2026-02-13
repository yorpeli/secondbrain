import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Colors, FONT_FAMILY } from "./brand";

type FunnelStepProps = {
  label: string;
  oldPct: number;
  newPct: number;
  liftPp: number;
  delay?: number;
  index: number;
  total: number;
};

export const FunnelStep: React.FC<FunnelStepProps> = ({
  label,
  oldPct,
  newPct,
  liftPp,
  delay = 0,
  index,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    delay,
    config: { damping: 200 },
  });

  const barGrow = spring({
    frame,
    fps,
    delay: delay + Math.round(0.2 * fps),
    config: { damping: 200 },
    durationInFrames: Math.round(0.8 * fps),
  });

  const translateX = interpolate(enter, [0, 1], [-60, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  // Funnel narrows as steps progress
  const widthPct = interpolate(index, [0, total - 1], [100, 70]);
  const oldBarWidth = interpolate(barGrow, [0, 1], [0, oldPct]);
  const newBarWidth = interpolate(barGrow, [0, 1], [0, newPct]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${translateX}px)`,
        marginBottom: 20,
        width: `${widthPct}%`,
        margin: "0 auto 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 24,
            fontWeight: 600,
            color: Colors.charcoal,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 22,
            fontWeight: 700,
            color: Colors.onTrack,
            backgroundColor: "rgba(46,125,50,0.1)",
            padding: "2px 12px",
            borderRadius: 16,
          }}
        >
          +{liftPp}pp
        </span>
      </div>

      {/* Stacked bars */}
      <div
        style={{
          position: "relative",
          height: 40,
          backgroundColor: "rgba(0,0,0,0.04)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* Old (gray, behind) */}
        <div
          style={{
            position: "absolute",
            width: `${oldBarWidth}%`,
            height: "100%",
            backgroundColor: Colors.darkGray,
            borderRadius: 8,
            opacity: 0.4,
          }}
        />
        {/* New (green, on top) */}
        <div
          style={{
            position: "absolute",
            width: `${newBarWidth}%`,
            height: "100%",
            backgroundColor: Colors.onTrack,
            borderRadius: 8,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontFamily: FONT_FAMILY,
          fontSize: 18,
        }}
      >
        <span style={{ color: Colors.darkGray }}>Before: {oldPct}%</span>
        <span style={{ color: Colors.onTrack, fontWeight: 700 }}>
          Now: {newPct}%
        </span>
      </div>
    </div>
  );
};
