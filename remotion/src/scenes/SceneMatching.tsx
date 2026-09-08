import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { colors, fontBody, fontDisplay } from "../theme";
import { ChapterLabel } from "../components/ChapterLabel";

const PROFILES = [
  { name: "Léa Martin", role: "Lead Product Designer", initials: "LM", score: 96, color: colors.fuchsia },
  { name: "Sofia Rey", role: "Sr Product Designer", initials: "SR", score: 91, color: colors.sky },
  { name: "Marc Aubry", role: "UX/UI Designer", initials: "MA", score: 88, color: colors.emerald },
  { name: "Karim Naït", role: "Product Designer", initials: "KN", score: 73, color: colors.amber },
  { name: "Julie Roy", role: "UI Designer", initials: "JR", score: 61, color: colors.lavender },
];

export const SceneMatching: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const board = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const boardY = interpolate(board, [0, 1], [50, 0]);

  return (
    <AbsoluteFill>
      <ChapterLabel number="03" label="Matching IA" color={colors.fuchsia} />

      {/* IA badge top right */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 80,
          opacity: board,
          background: `linear-gradient(135deg, ${colors.fuchsia}, ${colors.sky})`,
          color: "white",
          padding: "10px 20px",
          borderRadius: 999,
          fontFamily: fontBody,
          fontWeight: 700,
          fontSize: 18,
          boxShadow: `0 10px 30px ${colors.fuchsia}40`,
        }}
      >
        ✨ Matching alimenté par IA
      </div>

      <div
        style={{
          position: "absolute",
          top: 200,
          left: "50%",
          transform: `translateX(-50%) translateY(${boardY}px)`,
          opacity: board,
          width: 1100,
          background: "white",
          borderRadius: 24,
          padding: 36,
          boxShadow: "0 20px 60px rgba(26, 27, 58, 0.1)",
          border: `1px solid ${colors.border}`,
          fontFamily: fontBody,
        }}
      >
        <div style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 52, color: colors.navy, marginBottom: 24 }}>
          5 profils analysés
        </div>

        {PROFILES.map((p, i) => {
          const rowIn = spring({ frame: frame - 10 - i * 6, fps, config: { damping: 22, stiffness: 160 } });
          const barProgress = spring({ frame: frame - 25 - i * 6, fps, config: { damping: 24, stiffness: 100 } });
          const isTop = p.score >= 88;
          const highlightIn = spring({ frame: frame - 75, fps, config: { damping: 22, stiffness: 140 } });

          return (
            <div
              key={i}
              style={{
                opacity: rowIn,
                transform: `translateX(${interpolate(rowIn, [0, 1], [-30, 0])}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "14px 16px",
                marginBottom: 8,
                borderRadius: 14,
                background: isTop ? `rgba(16, 185, 129, ${0.08 * highlightIn})` : "transparent",
                border: `2px solid ${isTop ? `rgba(16, 185, 129, ${highlightIn * 0.6})` : "transparent"}`,
                transition: "none",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: p.color,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {p.initials}
              </div>
              <div style={{ width: 240 }}>
                <div style={{ color: colors.navy, fontWeight: 700, fontSize: 17 }}>{p.name}</div>
                <div style={{ color: colors.textMuted, fontSize: 13 }}>{p.role}</div>
              </div>
              <div style={{ flex: 1, height: 14, background: colors.border, borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${barProgress * p.score}%`,
                    height: "100%",
                    background: isTop
                      ? `linear-gradient(90deg, ${colors.emerald}, ${colors.fuchsia})`
                      : `linear-gradient(90deg, ${colors.sky}, ${colors.lavender})`,
                    borderRadius: 999,
                  }}
                />
              </div>
              <div
                style={{
                  width: 70,
                  textAlign: "right",
                  fontFamily: fontDisplay,
                  fontWeight: 800,
                  fontSize: 24,
                  color: isTop ? colors.emerald : colors.navy,
                }}
              >
                {Math.round(barProgress * p.score)}%
              </div>
              {isTop && (
                <div
                  style={{
                    opacity: highlightIn,
                    background: colors.emerald,
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    width: 90,
                    textAlign: "center",
                  }}
                >
                  ✓ MATCH
                </div>
              )}
              {!isTop && <div style={{ width: 90 }} />}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
