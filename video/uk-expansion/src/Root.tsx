import { Composition } from "remotion";
import { UKExpansion } from "./UKExpansion";

// 30fps, ~43 seconds (extended for readability + black intro)
const FPS = 30;
const DURATION_FRAMES = 1290;

export const RemotionRoot = () => {
  return (
    <Composition
      id="UKExpansion"
      component={UKExpansion}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
