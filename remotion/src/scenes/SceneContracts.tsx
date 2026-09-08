import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { colors, fontBody, fontDisplay } from "../theme";
import { ChapterLabel } from "../components/ChapterLabel";

const DOCS = [
  { title: "Contrat Client", subtitle: "Decathlon SAS", color: colors.sky, rotation: -8 },
  { title: "Contrat Tripartite", subtitle: "Mission Lead Designer", color: colors.fuchsia, rotation: 0 },
  { title: "Contrat Freelance", subtitle: "Léa Martin EI", color: colors.emerald, rotation: 8 },
];

export const SceneContracts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const board = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const stampIn = spring({ frame: frame - 80, fps, config: { damping: 8, stiffness: 120 } });
  const stampRot = interpolate(stampIn, [0, 1], [-30, -12]);

  return (
    <AbsoluteFill>
      <ChapterLabel number="04" label="Contrats générés" color={colors.emerald} />

      <div
        style={{
          position: "absolute",
          top: 240,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1200,
          height: 700,
        }}
      >
        {DOCS.map((doc, i) => {
          const docIn = spring({ frame: frame - 10 - i * 12, fps, config: { damping: 18, stiffness: 140 } });
          const targetX = (i - 1) * 320;
          const x = interpolate(docIn, [0, 1], [0, targetX]);
          const rot = interpolate(docIn, [0, 1], [0, doc.rotation]);
          const scale = interpolate(docIn, [0, 1], [0.6, 1]);

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: `translateX(calc(-50% + ${x}px)) rotate(${rot}deg) scale(${scale})`,
                opacity: docIn,
                width: 360,
                height: 480,
                background: "white",
                borderRadius: 18,
                padding: 32,
                boxShadow: `0 24px 60px rgba(26, 27, 58, ${0.12 + i * 0.02})`,
                border: `1px solid ${colors.border}`,
                fontFamily: fontBody,
                zIndex: i === 1 ? 3 : 2,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: doc.color,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 18,
                }}
              >
                📄
              </div>
              <div style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 44, color: colors.navy, marginBottom: 10 }}>
                {doc.title}
              </div>
              <div style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24 }}>{doc.subtitle}</div>

              {/* fake content lines */}
              {[0.85, 0.95, 0.7, 0.92, 0.6, 0.88, 0.78].map((w, j) => (
                <div
                  key={j}
                  style={{
                    height: 8,
                    width: `${w * 100}%`,
                    background: colors.border,
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                />
              ))}

              {/* signature line */}
              <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ height: 1, width: 100, background: colors.navy, marginBottom: 6 }} />
                  <div style={{ fontSize: 11, color: colors.textMuted }}>Signature</div>
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>1/3</div>
              </div>
            </div>
          );
        })}

        {/* SIGNED stamp */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: "50%",
            transform: `translateX(-50%) rotate(${stampRot}deg) scale(${interpolate(stampIn, [0, 1], [2, 1])})`,
            opacity: stampIn,
            border: `5px solid ${colors.fuchsia}`,
            color: colors.fuchsia,
            padding: "14px 36px",
            borderRadius: 12,
            fontFamily: fontDisplay,
            fontWeight: 800,
            fontSize: 48,
            letterSpacing: 4,
            zIndex: 10,
          }}
        >
          SIGNÉ ✓
        </div>
      </div>
    </AbsoluteFill>
  );
};
