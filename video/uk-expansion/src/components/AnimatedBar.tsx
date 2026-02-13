import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Colors, FONT_FAMILY } from "./brand";

type AnimatedBarProps = {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  suffix?: string;
  delay?: number;
};

export const AnimatedBar: React.FC<AnimatedBarProps> = ({
  label,
  value,
  maxValue,
  color,
  suffix = "%",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay,
    config: { damping: 200 },
    durationInFrames: Math.round(1.2 * fps),
  });

  const barWidth = interpolate(progress, [0, 1], [0, (value / maxValue) * 100]);
  const displayValue = Math.round(interpolate(progress, [0, 1], [0, value]));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 200,
          textAlign: "right",
          fontFamily: FONT_FAMILY,
          fontSize: 28,
          fontWeight: 600,
          color: Colors.darkGray,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: 48,
          backgroundColor: "rgba(0,0,0,0.06)",
          borderRadius: 8,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: 8,
            transition: "none",
          }}
        />
      </div>
      <div
        style={{
          width: 120,
          fontFamily: FONT_FAMILY,
          fontSize: 32,
          fontWeight: 700,
          color,
        }}
      >
        {displayValue}
        {suffix}
      </div>
    </div>
  );
};
