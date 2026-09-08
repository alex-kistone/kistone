import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { colors, fontBody, fontDisplay } from "../theme";
import { ChapterLabel } from "../components/ChapterLabel";
import { MockCard } from "../components/MockCard";

const COLS = [
  { title: "Sourcés", color: colors.sky, count: "12" },
  { title: "Shortlist", color: colors.lavender, count: "5", textDark: true },
  { title: "Entretien", color: colors.amber, count: "3" },
  { title: "Placés", color: colors.emerald, count: "2" },
];

interface CardDef {
  name: string;
  role: string;
  initials: string;
  startCol: number;
  endCol: number;
  jumpFrame: number;
  avatarColor: string;
}

const CARDS: CardDef[] = [
  { name: "Léa Martin", role: "Product Designer", initials: "LM", startCol: 0, endCol: 1, jumpFrame: 35, avatarColor: colors.fuchsia },
  { name: "Yanis Dubois", role: "Senior Backend", initials: "YD", startCol: 1, endCol: 2, jumpFrame: 55, avatarColor: colors.sky },
  { name: "Inès Cohen", role: "Data Engineer", initials: "IC", startCol: 2, endCol: 3, jumpFrame: 75, avatarColor: colors.emerald },
];

export const ScenePipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const board = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const boardY = interpolate(board, [0, 1], [50, 0]);

  const colWidth = 320;
  const colGap = 28;
  const totalWidth = COLS.length * colWidth + (COLS.length - 1) * colGap;
  const startX = (1920 - totalWidth) / 2;

  return (
    <AbsoluteFill>
      <ChapterLabel number="01" label="Pipeline freelance" />
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          opacity: board,
          transform: `translateY(${boardY}px)`,
        }}
      >
        {/* columns */}
        <div
          style={{
            display: "flex",
            gap: colGap,
            justifyContent: "center",
            padding: "0 40px",
          }}
        >
          {COLS.map((col, i) => (
            <div
              key={col.title}
              style={{
                width: colWidth,
                background: "rgba(255,255,255,0.65)",
                borderRadius: 22,
                padding: 18,
                border: `1px solid ${colors.border}`,
                minHeight: 600,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontFamily: fontDisplay, fontWeight: 700, color: colors.navy, fontSize: 20 }}>
                  {col.title}
                </div>
                <div
                  style={{
                    background: col.color,
                    color: col.textDark ? colors.navy : "white",
                    fontFamily: fontBody,
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "3px 12px",
                    borderRadius: 999,
                  }}
                >
                  {col.count}
                </div>
              </div>
              {/* placeholder rows */}
              {[0, 1].map((j) => (
                <div
                  key={j}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    border: `1px solid ${colors.border}`,
                    opacity: 0.55,
                  }}
                >
                  <div style={{ height: 10, width: "70%", background: colors.border, borderRadius: 5, marginBottom: 8 }} />
                  <div style={{ height: 8, width: "45%", background: colors.border, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* moving cards */}
        {CARDS.map((c, i) => {
          const appear = spring({ frame: frame - i * 8, fps, config: { damping: 22, stiffness: 160 } });
          const move = spring({ frame: frame - c.jumpFrame, fps, config: { damping: 22, stiffness: 130 } });
          const startCenterX = startX + c.startCol * (colWidth + colGap) + colWidth / 2;
          const endCenterX = startX + c.endCol * (colWidth + colGap) + colWidth / 2;
          const x = interpolate(move, [0, 1], [startCenterX, endCenterX]);
          const y = 80 + i * 30 + interpolate(move, [0, 0.5, 1], [0, -20, 0]);
          const rot = interpolate(move, [0, 0.5, 1], [0, -3, 0]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: y,
                left: x - 130,
                opacity: appear,
                transform: `rotate(${rot}deg) scale(${interpolate(appear, [0, 1], [0.85, 1])})`,
              }}
            >
              <MockCard
                name={c.name}
                role={c.role}
                initials={c.initials}
                avatarColor={c.avatarColor}
                tjm={["520", "680", "750"][i]}
                badge={i === 2 ? { text: "Hot", color: colors.fuchsia } : undefined}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
