import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { colors, fontBody, fontDisplay } from "../theme";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const tagIn = spring({ frame: frame - 15, fps, config: { damping: 20, stiffness: 140 } });
  const urlIn = spring({ frame: frame - 25, fps, config: { damping: 20, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: logoIn,
          transform: `scale(${interpolate(logoIn, [0, 1], [0.5, 1])})`,
        }}
      >
        <Img
          src={staticFile("images/kistone-logo.svg")}
          style={{ height: 220, width: "auto", objectFit: "contain" }}
        />
      </div>
      <div
        style={{
          opacity: tagIn,
          transform: `translateY(${interpolate(tagIn, [0, 1], [20, 0])}px)`,
          fontFamily: fontDisplay,
          fontWeight: 600,
          fontSize: 44,
          color: colors.navy,
          marginTop: 20,
          fontStyle: "italic",
        }}
      >
        Le freelancing, sans friction.
      </div>
      <div
        style={{
          opacity: urlIn,
          fontFamily: fontBody,
          fontWeight: 500,
          fontSize: 22,
          color: colors.textMuted,
          marginTop: 40,
          letterSpacing: 1,
        }}
      >
        kistone.studio
      </div>
    </AbsoluteFill>
  );
};
