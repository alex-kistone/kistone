import { useState } from "react";
import type { Recruiter } from "@/content/home";
import { palettes } from "@/lib/palettes";
import { cn } from "@/lib/utils";

/** Portrait rond d'un profil d'illustration ; les initiales teintées prennent le relais sans photo. */
export default function PersonAvatar({ r, className }: { r: Pick<Recruiter, "initials" | "palette" | "photo">; className?: string }) {
  const [failed, setFailed] = useState(false);
  const p = palettes[r.palette];
  const base = cn("flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full font-ks-display text-[15px] font-semibold", className);
  if (r.photo && !failed) {
    return <img src={r.photo} alt="" loading="lazy" onError={() => setFailed(true)} className={cn(base, "object-cover object-top")} style={{ background: p.tint }} />;
  }
  return (
    <span className={base} style={{ background: p.tint, color: p.ink }} aria-hidden="true">
      {r.initials}
    </span>
  );
}
