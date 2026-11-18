import type { CSSProperties } from "react";

/** Icône au trait 24×24 (chemins SVG de src/content/transition.ts). */
export const Icon = ({ paths, size = 22 }: { paths: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths }} />
);

export const Check = () => (
  <svg className="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" strokeWidth={1.6} /><path d="m8 12.3 2.7 2.7L16.2 9.5" />
  </svg>
);

export const Lock = () => <Icon size={15} paths={'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'} />;
export const ArrowRight = () => <Icon size={18} paths={'<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'} />;

/** Grand pictogramme Kistone en filigrane, en fond de section. */
export const Watermark = ({ style, dark = false }: { style: CSSProperties; dark?: boolean }) => (
  <div className={`watermark${dark ? " dark" : ""}`} style={style} aria-hidden="true" />
);
