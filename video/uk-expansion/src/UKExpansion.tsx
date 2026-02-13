import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { RoyalOpening } from "./scenes/RoyalOpening";
import { Headline } from "./scenes/Headline";
import { KeyResults } from "./scenes/KeyResults";
import { EkybBreak } from "./scenes/EkybBreak";
import { TeamCredits } from "./scenes/TeamCredits";
import { Closing } from "./scenes/Closing";

// Scene durations in seconds (at 30fps)
// Includes ~2.5-3s hold time per scene for readability
// Total with transitions: sum(scenes) - 5*0.5s overlap = ~43s
const SCENE_SECONDS = {
  royalOpening: 8,    // +2s black intro + 2.5s hold
  headline: 6.5,      // +2.5s hold
  keyResults: 9.5,    // +3s hold (data-heavy)
  ekybBreak: 7.5,     // +3s hold (data-heavy)
  teamCredits: 7,     // +2.5s hold
  closing: 7,         // +2.5s hold
};

const TRANSITION_FRAMES = 15; // 0.5s fade between scenes

export const UKExpansion: React.FC = () => {
  const { fps } = useVideoConfig();

  const sceneDurations = {
    royalOpening: Math.round(SCENE_SECONDS.royalOpening * fps),
    headline: Math.round(SCENE_SECONDS.headline * fps),
    keyResults: Math.round(SCENE_SECONDS.keyResults * fps),
    ekybBreak: Math.round(SCENE_SECONDS.ekybBreak * fps),
    teamCredits: Math.round(SCENE_SECONDS.teamCredits * fps),
    closing: Math.round(SCENE_SECONDS.closing * fps),
  };

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {/* Scene 1: Royal Opening */}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.royalOpening}>
          <RoyalOpening />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 2: Headline */}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.headline}>
          <Headline />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 3: Key Results */}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.keyResults}>
          <KeyResults />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 4: eKYB Breakthrough */}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.ekybBreak}>
          <EkybBreak />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 5: Team Credits */}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.teamCredits}>
          <TeamCredits />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 6: Closing */}
        <TransitionSeries.Sequence durationInFrames={sceneDurations.closing}>
          <Closing />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Audio — ready for when the MP3 is provided */}
      {/* Uncomment when public/audio/god-save-the-king.mp3 is available:
      <Audio
        src={staticFile("audio/god-save-the-king.mp3")}
        volume={(f) => {
          // Fade in over first 2 seconds
          const fadeIn = interpolate(f, [0, 2 * fps], [0, 0.7], {
            extrapolateRight: "clamp",
          });
          // Lower during data scenes (frames ~200-500)
          const lower = interpolate(f, [180, 210, 480, 510], [1, 0.3, 0.3, 0.7], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          // Fade out in last 2 seconds
          const totalFrames = 750;
          const fadeOut = interpolate(f, [totalFrames - 2 * fps, totalFrames], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return fadeIn * lower * fadeOut;
        }}
      />
      */}
    </AbsoluteFill>
  );
};
