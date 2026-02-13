import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Colors, FONT_FAMILY } from "./brand";

type MetricCardProps = {
  label: string;
  oldValue: string;
  newValue: string;
  change: string;
  isPositive: boolean;
  delay?: number;
  clmValue: number;
  fourStepValue: number;
  maxValue: number;
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  oldValue,
  newValue,
  change,
  isPositive,
  delay = 0,
  clmValue,
  fourStepValue,
  maxValue,
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
    delay: delay + Math.round(0.3 * fps),
    config: { damping: 200 },
    durationInFrames: Math.round(1 * fps),
  });

  const translateY = interpolate(enter, [0, 1], [40, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const clmWidth = interpolate(barGrow, [0, 1], [0, (clmValue / maxValue) * 100]);
  const fourStepWidth = interpolate(barGrow, [0, 1], [0, (fourStepValue / maxValue) * 100]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        marginBottom: 32,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 26,
          fontWeight: 700,
          color: Colors.charcoal,
          marginBottom: 12,
        }}
      >
        {label}
      </div>

      {/* CLM bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <div
          style={{
            width: 80,
            fontFamily: FONT_FAMILY,
            fontSize: 20,
            fontWeight: 600,
            color: Colors.onTrack,
          }}
        >
          CLM
        </div>
        <div
          style={{
            flex: 1,
            height: 36,
            backgroundColor: "rgba(0,0,0,0.04)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${clmWidth}%`,
              height: "100%",
              backgroundColor: Colors.onTrack,
              borderRadius: 6,
            }}
          />
        </div>
        <div
          style={{
            width: 80,
            fontFamily: FONT_FAMILY,
            fontSize: 24,
            fontWeight: 700,
            color: Colors.onTrack,
          }}
        >
          {newValue}
        </div>
      </div>

      {/* 4-Step bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <div
          style={{
            width: 80,
            fontFamily: FONT_FAMILY,
            fontSize: 20,
            fontWeight: 600,
            color: Colors.darkGray,
          }}
        >
          4-Step
        </div>
        <div
          style={{
            flex: 1,
            height: 36,
            backgroundColor: "rgba(0,0,0,0.04)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${fourStepWidth}%`,
              height: "100%",
              backgroundColor: Colors.darkGray,
              borderRadius: 6,
            }}
          />
        </div>
        <div
          style={{
            width: 80,
            fontFamily: FONT_FAMILY,
            fontSize: 24,
            fontWeight: 700,
            color: Colors.darkGray,
          }}
        >
          {oldValue}
        </div>
      </div>

      {/* Change badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          paddingRight: 8,
        }}
      >
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 22,
            fontWeight: 700,
            color: isPositive ? Colors.onTrack : Colors.onTrack,
            backgroundColor: isPositive ? "rgba(46,125,50,0.1)" : "rgba(46,125,50,0.1)",
            padding: "4px 16px",
            borderRadius: 20,
          }}
        >
          {change}
        </div>
      </div>
    </div>
  );
};
