import { AbsoluteFill, Series } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";

import { GradientBg } from "./components/GradientBg";
import { SceneHook } from "./scenes/SceneHook";
import { ScenePipeline } from "./scenes/ScenePipeline";
import { SceneNeed } from "./scenes/SceneNeed";
import { SceneMatching } from "./scenes/SceneMatching";
import { SceneContracts } from "./scenes/SceneContracts";
import { SceneCRA } from "./scenes/SceneCRA";
import { SceneOutro } from "./scenes/SceneOutro";

// Durations in frames at 30fps
// Hook 60 + Pipeline 120 + Need 120 + Matching 120 + Contracts 120 + CRA 105 + Outro 60 = 705
// Transitions overlap: 6 transitions × 15f = 90f overlap → ~615 visible frames
// Set durationInFrames=660 to give breathing room.

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <GradientBg />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={60}>
          <SceneHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <ScenePipeline />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneNeed />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneMatching />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneContracts />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={105}>
          <SceneCRA />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={75}>
          <SceneOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
