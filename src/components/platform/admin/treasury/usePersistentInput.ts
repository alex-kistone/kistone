import { useState } from "react";

/** Saisie mémorisée dans ce navigateur (confort personnel ; stockage indisponible = saisie de session). */
export function usePersistentInput(key: string) {
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  });
  const update = (v: string) => {
    setValue(v);
    try {
      if (v) window.localStorage.setItem(key, v);
      else window.localStorage.removeItem(key);
    } catch {
      /* stockage indisponible */
    }
  };
  return [value, update] as const;
}

/** Montant saisi à la française (« 12 500,50 ») ; null si vide ou invalide. */
export const parseAmount = (v: string): number | null => {
  if (!v.trim()) return null;
  const n = Number(v.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".").replace("−", "-"));
  return Number.isFinite(n) ? n : null;
};
