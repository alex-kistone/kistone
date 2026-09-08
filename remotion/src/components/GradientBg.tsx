import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors } from "../theme";

export const GradientBg: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 660], [0, 30]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.paleBlue} 0%, ${colors.lavender} 50%, ${colors.pink} 100%)`,
      }}
    >
      {/* soft floating blobs */}
      <div
        style={{
          position: "absolute",
          top: `-10%`,
          left: `${-5 + shift * 0.2}%`,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.pink} 0%, transparent 70%)`,
          filter: "blur(40px)",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: `-15%`,
          right: `${-5 - shift * 0.15}%`,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.paleBlue} 0%, transparent 70%)`,
          filter: "blur(50px)",
          opacity: 0.7,
        }}
      />
      {/* cream overlay so content reads */}
      <AbsoluteFill style={{ background: `${colors.cream}cc` }} />
    </AbsoluteFill>
  );
};
