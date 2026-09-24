/** Icônes au trait (1.8–2px, bouts arrondis), toujours décoratives. */
type P = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, strokeWidth: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className,
});

export const Arrow = ({ size = 15, className, strokeWidth = 2 }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Check = ({ size = 16, className, strokeWidth = 2.2 }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M5 12l5 5L20 7" /></svg>
);
export const Cross = ({ size = 11, className, strokeWidth = 3 }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const Plus = ({ size = 14, className, strokeWidth = 2.2 }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Clock = ({ size = 15, className, strokeWidth = 2 }: P) => (
  <svg {...base(size, strokeWidth, className)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Timer = ({ size = 14, className, strokeWidth = 2 }: P) => (
  <svg {...base(size, strokeWidth, className)}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>
);
export const Calendar = ({ size = 18, className, strokeWidth = 1.8 }: P) => (
  <svg {...base(size, strokeWidth, className)}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const Shield = ({ size = 20, className, strokeWidth = 1.8 }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const Bolt = ({ size = 20, className, strokeWidth = 1.8 }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
);
export const Users = ({ size = 20, className, strokeWidth = 1.8 }: P) => (
  <svg {...base(size, strokeWidth, className)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c1.9.7 3.1 2.5 3.5 5.2" /></svg>
);
export const Layers = ({ size = 20, className, strokeWidth = 1.8 }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>
);
