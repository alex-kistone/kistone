import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { colors, fontBody, fontDisplay } from "../theme";

export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 120 } });
  const subIn = spring({ frame: frame - 25, fps, config: { damping: 20, stiffness: 140 } });
  const logoIn = spring({ frame, fps, config: { damping: 18, stiffness: 180 } });
  const titleY = interpolate(titleIn, [0, 1], [40, 0]);
  const subY = interpolate(subIn, [0, 1], [30, 0]);
  const blur = interpolate(titleIn, [0, 1], [12, 0]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80 }}>
      {/* Kistone logo */}
      <div
        style={{
          opacity: logoIn,
          transform: `scale(${interpolate(logoIn, [0, 1], [0.7, 1])})`,
          marginBottom: 50,
        }}
      >
        <Img
          src={staticFile("images/kistone-logo.svg")}
          style={{ height: 90, width: "auto", objectFit: "contain" }}
        />
      </div>
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${titleY}px)`,
          filter: `blur(${blur}px)`,
          fontFamily: fontDisplay,
          fontWeight: 800,
          fontSize: 140,
          lineHeight: 1.05,
          color: colors.navy,
          textAlign: "center",
          maxWidth: 1500,
          letterSpacing: -3,
        }}
      >
        Gérer une mission.
        <br />
        <span style={{ color: colors.fuchsia, fontStyle: "italic" }}>De A à Z.</span>
      </div>
      <div
        style={{
          opacity: subIn,
          transform: `translateY(${subY}px)`,
          fontFamily: fontBody,
          fontWeight: 500,
          fontSize: 28,
          color: colors.textMuted,
          marginTop: 36,
          letterSpacing: 0.5,
        }}
      >
        Le quotidien d'un admin Kistone, en 20 secondes.
      </div>
    </AbsoluteFill>
  );
};
