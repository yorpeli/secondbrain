import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Colors, FONT_FAMILY } from "../components/brand";

const TEAMS = [
  {
    name: "Compliance",
    contribution: "Eliminated major document requirements",
    color: "#1565C0",
  },
  {
    name: "Legal",
    contribution: "Approved lean launch to learn from data",
    color: "#6A1B9A",
  },
  {
    name: "Operations",
    contribution: "SLA from 2 days to 12 hours",
    color: "#E65100",
  },
  {
    name: "Platform",
    contribution: "Built eKYB + CLM optimizations",
    color: Colors.onTrack,
  },
];

export const TeamCredits: React.FC = () => {
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

  return (
    <AbsoluteFill
      style={{
        backgroundColor: Colors.white,
        padding: "60px 120px",
        overflow: "hidden",
      }}
    >
      {/* Top accent bar */}
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
          fontSize: 48,
          fontWeight: 800,
          color: Colors.midnightBlue,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 16,
        }}
      >
        How We Got Here
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 32,
          fontWeight: 600,
          color: Colors.darkGray,
          opacity: titleOpacity,
          marginBottom: 48,
        }}
      >
        One Payoneer Team
      </div>

      {/* Team cards in 2x2 grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
        }}
      >
        {TEAMS.map((team, i) => {
          const cardEnter = spring({
            frame,
            fps,
            delay: Math.round((0.3 + i * 0.3) * fps),
            config: { damping: 15, stiffness: 120 },
          });
          const cardOpacity = interpolate(cardEnter, [0, 1], [0, 1]);
          const cardX = interpolate(cardEnter, [0, 1], [80, 0]);

          return (
            <div
              key={team.name}
              style={{
                opacity: cardOpacity,
                transform: `translateX(${cardX}px)`,
                width: "calc(50% - 16px)",
                backgroundColor: Colors.lightGray,
                borderRadius: 16,
                padding: "32px 36px",
                borderLeft: `5px solid ${team.color}`,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 30,
                  fontWeight: 700,
                  color: team.color,
                  marginBottom: 12,
                }}
              >
                {team.name}
              </div>
              <div
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 24,
                  fontWeight: 400,
                  color: Colors.charcoal,
                  lineHeight: 1.4,
                }}
              >
                {team.contribution}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
