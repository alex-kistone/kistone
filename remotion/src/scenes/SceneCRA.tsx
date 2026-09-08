import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { colors, fontBody, fontDisplay } from "../theme";
import { ChapterLabel } from "../components/ChapterLabel";

// 30 days, with weekends + a few half-days
const STATUSES: Array<"work" | "half" | "off"> = [
  "work","work","work","work","work","off","off",
  "work","work","work","half","work","off","off",
  "work","work","work","work","work","off","off",
  "work","work","half","work","work","off","off",
  "work","work",
];

export const SceneCRA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const cardY = interpolate(card, [0, 1], [50, 0]);
  const totalIn = spring({ frame: frame - 70, fps, config: { damping: 20, stiffness: 140 } });

  const cell = 78;
  const gap = 8;

  return (
    <AbsoluteFill>
      <ChapterLabel number="05" label="CRA mensuel" color={colors.amber} />

      <div
        style={{
          position: "absolute",
          top: 180,
          left: "50%",
          transform: `translateX(-50%) translateY(${cardY}px)`,
          opacity: card,
          width: 1200,
          background: "white",
          borderRadius: 24,
          padding: 40,
          boxShadow: "0 20px 60px rgba(26, 27, 58, 0.1)",
          border: `1px solid ${colors.border}`,
          fontFamily: fontBody,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 56, color: colors.navy }}>
              Avril 2026 — Léa Martin
            </div>
            <div style={{ color: colors.textMuted, fontSize: 16, marginTop: 4 }}>Mission Decathlon · Lead Designer</div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: colors.textMuted }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: colors.emerald, display: "inline-block" }} />
              Travaillé
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: colors.amber, display: "inline-block" }} />
              ½ journée
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: colors.border, display: "inline-block" }} />
              Off
            </div>
          </div>
        </div>

        {/* day headers */}
        <div style={{ display: "flex", gap, marginBottom: 8 }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={i} style={{ width: cell, textAlign: "center", color: colors.textMuted, fontWeight: 600, fontSize: 14 }}>
              {d}
            </div>
          ))}
        </div>

        {/* grid: 5 rows × 7 days, but only 30 cells */}
        <div style={{ display: "flex", flexWrap: "wrap", gap }}>
          {STATUSES.map((s, i) => {
            const cellIn = spring({ frame: frame - 12 - i * 1.5, fps, config: { damping: 22, stiffness: 240 } });
            const bg =
              s === "work" ? colors.emerald :
              s === "half" ? colors.amber :
              colors.border;
            const txt = s === "off" ? colors.textMuted : "white";
            return (
              <div
                key={i}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 10,
                  background: bg,
                  color: txt,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 22,
                  fontFamily: fontDisplay,
                  opacity: cellIn,
                  transform: `scale(${interpolate(cellIn, [0, 1], [0.4, 1])})`,
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* total */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: totalIn,
            transform: `translateY(${interpolate(totalIn, [0, 1], [20, 0])}px)`,
            background: `linear-gradient(135deg, ${colors.lavender}, ${colors.pink})`,
            padding: "20px 28px",
            borderRadius: 16,
          }}
        >
          <div style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 24, color: colors.navy }}>
            Total facturable
          </div>
          <div style={{ display: "flex", gap: 36, alignItems: "baseline" }}>
            <div>
              <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 42, color: colors.navy }}>18,5</span>
              <span style={{ color: colors.textMuted, fontSize: 18, marginLeft: 6 }}>jours</span>
            </div>
            <div>
              <span style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 42, color: colors.fuchsia }}>12 025 €</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
