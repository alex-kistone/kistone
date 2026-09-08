import { colors, fontBody } from "../theme";

interface Props {
  name: string;
  role: string;
  tjm?: string;
  avatarColor?: string;
  initials: string;
  badge?: { text: string; color: string };
  width?: number;
}

export const MockCard: React.FC<Props> = ({
  name,
  role,
  tjm,
  avatarColor = colors.emerald,
  initials,
  badge,
  width = 260,
}) => {
  return (
    <div
      style={{
        width,
        background: "white",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 8px 24px rgba(26, 27, 58, 0.08), 0 2px 6px rgba(26, 27, 58, 0.04)",
        border: `1px solid ${colors.border}`,
        fontFamily: fontBody,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: avatarColor,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: colors.navy, fontWeight: 700, fontSize: 16 }}>{name}</div>
          <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>{role}</div>
        </div>
      </div>
      {(tjm || badge) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          {tjm && (
            <div style={{ color: colors.navy, fontWeight: 700, fontSize: 14 }}>
              {tjm} <span style={{ color: colors.textMuted, fontWeight: 500 }}>€/j</span>
            </div>
          )}
          {badge && (
            <div
              style={{
                background: badge.color,
                color: "white",
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 999,
                letterSpacing: 0.5,
              }}
            >
              {badge.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
