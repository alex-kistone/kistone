import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { colors, fontBody, fontDisplay } from "../theme";
import { ChapterLabel } from "../components/ChapterLabel";

const FIELDS = [
  { label: "Intitulé", value: "Lead Product Designer", delay: 10 },
  { label: "Stack", chips: ["Figma", "Design System", "B2B SaaS"], delay: 25 },
  { label: "TJM cible", value: "650 € / jour", delay: 40 },
  { label: "Démarrage", value: "ASAP — 6 mois renouvelables", delay: 55 },
];

export const SceneNeed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const cardY = interpolate(card, [0, 1], [60, 0]);

  // pulsing publish button (after frame 75)
  const btnIn = spring({ frame: frame - 75, fps, config: { damping: 18, stiffness: 180 } });
  const pulse = Math.sin(Math.max(0, frame - 85) * 0.25) * 0.04 + 1;

  return (
    <AbsoluteFill>
      <ChapterLabel number="02" label="Nouveau besoin" color={colors.sky} />
      <div
        style={{
          position: "absolute",
          top: 200,
          left: "50%",
          transform: `translateX(-50%) translateY(${cardY}px)`,
          opacity: card,
          width: 880,
          background: "white",
          borderRadius: 28,
          padding: 48,
          boxShadow: "0 20px 60px rgba(26, 27, 58, 0.12)",
          border: `1px solid ${colors.border}`,
          fontFamily: fontBody,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${colors.sky}, ${colors.fuchsia})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            📋
          </div>
          <div>
            <div style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 60, color: colors.navy }}>
              Besoin client — Decathlon
            </div>
            <div style={{ color: colors.textMuted, fontSize: 16, marginTop: 4 }}>Publié par Alex · Aujourd'hui</div>
          </div>
        </div>

        {FIELDS.map((f, i) => {
          const fIn = spring({ frame: frame - f.delay, fps, config: { damping: 22, stiffness: 160 } });
          const fy = interpolate(fIn, [0, 1], [20, 0]);
          return (
            <div
              key={i}
              style={{
                opacity: fIn,
                transform: `translateY(${fy}px)`,
                marginBottom: 22,
                paddingBottom: 22,
                borderBottom: i < FIELDS.length - 1 ? `1px solid ${colors.border}` : "none",
              }}
            >
              <div style={{ color: colors.textMuted, fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                {f.label}
              </div>
              {f.value && (
                <div style={{ color: colors.navy, fontSize: 24, fontWeight: 600 }}>{f.value}</div>
              )}
              {f.chips && (
                <div style={{ display: "flex", gap: 10 }}>
                  {f.chips.map((c) => (
                    <div
                      key={c}
                      style={{
                        background: colors.lavender,
                        color: colors.navy,
                        padding: "8px 16px",
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <div
            style={{
              opacity: btnIn,
              transform: `scale(${pulse})`,
              background: colors.fuchsia,
              color: "white",
              padding: "16px 36px",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 20,
              boxShadow: `0 12px 30px ${colors.fuchsia}55`,
            }}
          >
            Publier le besoin →
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
