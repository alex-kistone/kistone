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

/** Découpe une ligne CSV (séparateur « , », « ; » ou tabulation, champs entre guillemets). */
function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (c === sep && !quoted) { out.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

/**
 * Fichier CSV d'adresses (export de tableur, de LinkedIn ou d'un CRM) converti en lignes
 * « Prénom ; email » pour le champ des invitations. Avec une ligne d'en-tête, les colonnes email,
 * prénom (ou nom complet) sont reconnues ; sans en-tête, la cellule qui contient « @ » est l'email
 * et la première autre cellule le prénom.
 */
export function csvToInviteeLines(csv: string): string[] {
  const rows = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!rows.length) return [];
  const sep = [";", "\t", ","].map((s) => [s, rows[0].split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const cells = rows.map((r) => splitCsvLine(r, sep));
  const header = cells[0].map(norm);
  const hasHeader = !cells[0].some((c) => c.includes("@"));
  const find = (...names: string[]) => header.findIndex((h) => names.some((n) => h === n || h.startsWith(n)));
  const emailCol = hasHeader ? find("email", "mail", "courriel", "emailaddress", "adresse") : -1;
  const firstCol = hasHeader ? find("prenom", "firstname", "first", "givenname") : -1;
  const nameCol = hasHeader ? find("nom", "name", "fullname", "nomcomplet", "contact") : -1;
  const lines: string[] = [];
  for (const row of hasHeader ? cells.slice(1) : cells) {
    const email = emailCol >= 0 ? row[emailCol] : row.find((c) => c.includes("@"));
    if (!email?.includes("@")) continue;
    const name = firstCol >= 0 ? row[firstCol] : nameCol >= 0 && nameCol !== emailCol ? row[nameCol] : !hasHeader ? row.find((c) => c && !c.includes("@")) : "";
    lines.push(name?.trim() ? `${name.trim()} ; ${email.trim()}` : email.trim());
  }
  return lines;
}
