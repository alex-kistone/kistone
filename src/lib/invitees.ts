/**
 * Lecture d'une liste d'adresses collée par l'admin (invitations de freelances). Formats acceptés,
 * une entrée par ligne ou séparées par des virgules : « email », « Prénom Nom <email> »,
 * « Prénom ; email » ou « email ; Prénom » (copie de tableur). Seul le prénom est gardé.
 */
export type Invitee = { email: string; first_name: string | null };

const EMAIL_RE = /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/;

const firstNameOf = (name: string) => {
  const first = name.replace(/["']/g, "").trim().split(/\s+/)[0] ?? "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : null;
};

export function parseInvitees(raw: string): { invitees: Invitee[]; invalid: string[] } {
  const invitees: Invitee[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  const add = (email: string, name: string | null) => {
    const e = email.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) { if (e) invalid.push(email.trim()); return; }
    if (seen.has(e)) return;
    seen.add(e);
    invitees.push({ email: e, first_name: name ? firstNameOf(name) : null });
  };
  for (const line of raw.split(/\n/)) {
    const l = line.trim();
    if (!l) continue;
    // « Prénom Nom <email> », éventuellement plusieurs sur la ligne
    if (l.includes("<")) {
      for (const m of l.matchAll(/([^<,;]*)<([^>]+)>/g)) add(m[2], m[1].trim() || null);
      continue;
    }
    const parts = l.split(/[;,\t]/).map((p) => p.trim()).filter(Boolean);
    const emails = parts.filter((p) => p.includes("@"));
    const names = parts.filter((p) => !p.includes("@"));
    // « Prénom ; email » : un nom pour une adresse ; sinon une liste d'adresses
    if (emails.length === 1 && names.length === 1) add(emails[0], names[0]);
    else {
      for (const e of emails) add(e, null);
      if (!emails.length) invalid.push(l);
    }
  }
  return { invitees, invalid };
}
