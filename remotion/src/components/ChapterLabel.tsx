import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { colors, fontBody } from "../theme";

interface Props {
  number: string;
  label: string;
  color?: string;
}

export const ChapterLabel: React.FC<Props> = ({ number, label, color = colors.fuchsia }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 180 } });
  const y = interpolate(s, [0, 1], [-30, 0]);
  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        left: 80,
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: s,
        transform: `translateY(${y}px)`,
        fontFamily: fontBody,
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: color,
          color: "white",
          padding: "16px 28px",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: 2,
        }}
      >
        {number}
      </div>
      <div
        style={{
          color: colors.navy,
          fontWeight: 600,
          fontSize: 40,
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};
