// Test de bout en bout du parcours Kistone sur le projet Supabase lié :
// besoin → matching → accord → mission (dossiers, contrats) → CRA signé → factures → notifications.
//
// Chaque acteur (client, freelance, admin) agit avec sa propre session et les mêmes requêtes
// que l'interface : les règles de sécurité (RLS, déclencheurs) sont donc éprouvées. Les comptes
// sont fictifs (@test.kistone.invalid, aucun email ne part) et tout est supprimé à la fin,
// sauf avec --keep.
//
//   npm run e2e            (ou node scripts/e2e-flow.mjs [--keep])
//
// Prérequis : .env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) et la CLI Supabase liée
// au projet (`npx supabase link`) : les étapes techniques (création des comptes, nettoyage)
// passent par `supabase db query --linked`, jamais par une clé secrète.
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  }),
);
const URL_ = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!URL_ || !ANON) throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY manquants dans .env");

const KEEP = process.argv.includes("--keep");
const STAMP = Date.now().toString(36);
const TAG = `[E2E ${STAMP}]`;
const DOMAIN = "test.kistone.invalid";
const startedAt = new Date().toISOString();

// ── Outils ─────────────────────────────────────────────────────────────────────
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
function sql(query) {
  const out = execFileSync("npx", ["supabase", "db", "query", "--linked", query], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(out.slice(out.indexOf("{"))).rows;
}

const results = [];
function check(label, ok, detail = "") {
  results.push({ label, ok: !!ok });
  console.log(`${ok ? "✔" : "✘"} ${label}${detail ? ` — ${detail}` : ""}`);
  return !!ok;
}
/** Étape indispensable à la suite : on arrête si elle échoue. */
function must(label, ok, detail = "") {
  if (!check(label, ok, detail)) throw new Error(`Étape bloquante en échec : ${label}`);
}
const section = (t) => console.log(`\n── ${t}`);
const pdf = (text) => new Blob([`%PDF-1.4\n%${text}\n%%EOF`], { type: "application/pdf" });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const users = {
  admin: { email: `e2e-admin-${STAMP}@${DOMAIN}` },
  client: { email: `e2e-client-${STAMP}@${DOMAIN}` },
  freelance: { email: `e2e-freelance-${STAMP}@${DOMAIN}` },
};

function createAccount(u) {
  u.password = `E2e-${randomBytes(12).toString("base64url")}`;
  const [row] = sql(`insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', ${q(u.email)},
      extensions.crypt(${q(u.password)}, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
    returning id;`);
  u.id = row.id;
}

async function signIn(u) {
  const c = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email: u.email, password: u.password });
  if (error) throw new Error(`Connexion ${u.email} : ${error.message}`);
  return c;
}

/** Appel d'une fonction : renvoie { data } ou { error } lisible. */
async function invoke(c, name, body) {
  const { data, error } = await c.functions.invoke(name, { body });
  if (error) {
    const b = await error.context?.json?.().catch(() => null);
    return { error: b?.error ?? error.message };
  }
  if (data?.error) return { error: data.error };
  return { data };
}

/** Jours ouvrés (lun–ven) du mois en cours, à partir du 1er. */
function weekdaysOfMonth(n) {
  const now = new Date();
  const days = [];
  for (let d = 1; days.length < n && d <= 28; d++) {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), d));
    const dow = date.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();
const MONTH_START = `${YEAR}-${String(MONTH).padStart(2, "0")}-01`;
const ids = {};

// ── Scénario ───────────────────────────────────────────────────────────────────
async function run() {
  section("Comptes");
  for (const u of Object.values(users)) createAccount(u);
  sql(`insert into public.user_roles (user_id, role) values (${q(users.admin.id)}, 'admin');`);
  const admin = await signIn(users.admin);
  const client = await signIn(users.client);
  const free = await signIn(users.freelance);
  must("Client · rôle attribué comme à l'inscription", !(await invoke(client, "assign-client-role", {})).error);
  must("Freelance · rôle attribué comme à l'inscription", !(await invoke(free, "assign-freelance-role", {})).error);
  const both = await invoke(client, "assign-freelance-role", {});
  check("Un compte client ne peut pas devenir freelance", !!both.error, both.error);

  section("Profils et besoin");
  const { data: rp, error: rpErr } = await free.from("recruiter_profiles").insert({
    user_id: users.freelance.id, email: users.freelance.email, first_name: "Camille", last_name: `E2E-${STAMP}`,
    linkedin_url: `https://www.linkedin.com/in/e2e-${STAMP}`, job_title: "Recruteuse Tech & Data",
    skills: ["Tech", "Data"], sectors: ["Startup/scaleup"], mobility: ["Paris"], remote_preference: "hybrid",
    tjm: 550, available: true, model: "RPO",
  }).select("id, onboarding_completed").single();
  must("Freelance · crée son profil (complet)", !rpErr && rp.onboarding_completed, rpErr?.message);
  ids.profile = rp.id;
  const cp = await client.from("client_profiles").upsert({ user_id: users.client.id, email: users.client.email, company_name: `${TAG} Scale-up`, first_name: "Claire", last_name: "E2E" }, { onConflict: "user_id" });
  must("Client · crée son profil", !cp.error, cp.error?.message);
  const { data: need, error: nErr } = await client.from("client_needs").insert({
    user_id: users.client.id, company_name: `${TAG} Scale-up`, contact_name: "Claire E2E", contact_email: users.client.email,
    job_title: `${TAG} Recruteur Tech`, mission_location: "Paris", remote_policy: "hybrid", profile_types: ["Tech"],
    sectors: ["Startup/scaleup"], budget_tjm_min: 600, budget_tjm_max: 800, description: "Recrutement de 5 développeurs backend.",
  }).select("id").single();
  must("Client · dépose un besoin", !nErr, nErr?.message);
  ids.need = need.id;

  section("Matching et accord");
  const match = await invoke(admin, "match-profiles", { need_id: need.id });
  must("Admin · lance le matching", !match.error, match.error);
  const { data: sugg } = await client.from("profile_suggestions").select("id, match_score, recruiter_profile_id, pipeline_status").eq("need_id", need.id);
  const mine = sugg?.find((s) => s.recruiter_profile_id === ids.profile);
  must("Matching · le profil E2E est proposé au client", !!mine, `${sugg?.length ?? 0} profil(s), score ${mine?.match_score}`);
  ids.suggestion = mine.id;
  const { data: cView } = await client.from("profile_suggestions").select("*").eq("id", mine.id).single();
  check("Client · ne voit pas le nom de famille du freelance", !JSON.stringify(cView).includes(`E2E-${STAMP}`));
  for (const status of ["shortlisted", "accepted"]) {
    const { error } = await client.from("profile_suggestions").update({ pipeline_status: status, status_updated_at: new Date().toISOString() }).eq("id", mine.id);
    must(`Client · passe le profil en « ${status} »`, !error, error?.message);
  }
  const score = await client.from("profile_suggestions").update({ match_score: 100 }).eq("id", mine.id);
  check("Client · ne peut pas modifier le score", !!score.error, score.error?.message);

  section("Mise en place de la mission");
  const { data: mission, error: mErr } = await admin.from("missions").insert({
    suggestion_id: mine.id, need_id: need.id, recruiter_profile_id: ids.profile, title: `${TAG} Recruteur Tech`,
    company_name: `${TAG} Scale-up`, location: "Paris", recruiter_tjm: 550, client_tjm: 650, start_date: MONTH_START,
    status: "onboarding", created_by: users.admin.id,
  }).select("id").single();
  must("Admin · crée la mission (en préparation)", !mErr, mErr?.message);
  ids.mission = mission.id;
  const { data: needAfter } = await admin.from("client_needs").select("status").eq("id", need.id).single();
  check("Besoin passé « Pourvu » à la création de la mission", needAfter?.status === "staffed", needAfter?.status);
  const { data: dossiers } = await admin.from("kyc_dossiers").select("user_id, status").in("user_id", [users.client.id, users.freelance.id]);
  check("Dossiers client et freelance ouverts", dossiers?.length === 2, dossiers?.map((d) => d.status).join(", "));
  const early = await admin.rpc("activate_mission", { _mission_id: mission.id });
  check("Démarrage refusé tant que dossiers et contrats manquent", !!early.error || early.data?.ok === false, early.error?.message ?? JSON.stringify(early.data));

  const addDoc = async (c, uid, kind, expires) => {
    const path = `${uid}/${kind}/${crypto.randomUUID()}.pdf`;
    const up = await c.storage.from("admin-documents").upload(path, pdf(`E2E ${kind}`), { contentType: "application/pdf" });
    if (up.error) return up.error.message;
    const { error } = await c.from("kyc_documents").insert({ user_id: uid, kind, path, file_name: `${kind}.pdf`, mime: "application/pdf", size: 30, expires_at: expires ? `${YEAR + 1}-01-01` : null });
    return error?.message ?? null;
  };
  const incomplete = await free.from("kyc_dossiers").update({ status: "submitted" }).eq("user_id", users.freelance.id);
  check("Base · dossier incomplet refusé à l'envoi", !!incomplete.error, incomplete.error?.message);
  const f1 = await free.from("recruiter_profiles").update({ company_name: `${TAG} Conseil`, legal_form: "SASU", siren: "732829320", siret: "73282932000074", company_address: "1 rue de Test, 75001 Paris", iban: "FR7630006000011234567890189", bic: "AGRIFRPP" }).eq("user_id", users.freelance.id);
  must("Freelance · renseigne sa société", !f1.error, f1.error?.message);
  for (const [kind, exp] of [["kbis"], ["identity"], ["rib"], ["urssaf", true], ["insurance", true]]) {
    const err = await addDoc(free, users.freelance.id, kind, exp);
    must(`Freelance · dépose « ${kind} »`, !err, err ?? "");
  }
  must("Freelance · envoie son dossier", !(await free.from("kyc_dossiers").update({ status: "submitted" }).eq("user_id", users.freelance.id)).error);
  const c1 = await client.from("client_profiles").update({ legal_form: "SAS", siren: "732829320", siret: "73282932000074", company_address: "2 avenue de Test, 75002 Paris", representative_name: "Claire E2E", representative_title: "Présidente", billing_email: `compta-${STAMP}@${DOMAIN}` }).eq("user_id", users.client.id);
  must("Client · renseigne son entreprise", !c1.error, c1.error?.message);
  must("Client · dépose son Kbis", !(await addDoc(client, users.client.id, "kbis")));
  must("Client · envoie son dossier", !(await client.from("kyc_dossiers").update({ status: "submitted" }).eq("user_id", users.client.id)).error);
  const peek = await client.storage.from("admin-documents").list(users.freelance.id);
  check("Client · ne voit pas les pièces du freelance", !peek.data?.length);
  const selfOk = await client.from("kyc_dossiers").update({ status: "approved" }).eq("user_id", users.client.id).select();
  check("Client · ne peut pas valider son propre dossier", !!selfOk.error || !selfOk.data?.length);
  for (const u of [users.freelance, users.client]) {
    const { error } = await admin.from("kyc_dossiers").update({ status: "approved" }).eq("user_id", u.id);
    must(`Admin · valide le dossier ${u === users.client ? "client" : "freelance"}`, !error, error?.message);
  }
  for (const party of ["client", "freelance"]) {
    const path = `${mission.id}/${party}/signe-e2e.pdf`;
    const up = await admin.storage.from("contracts").upload(path, pdf(`E2E contrat ${party}`), { contentType: "application/pdf", upsert: true });
    const { error } = await admin.from("contracts").upsert({ mission_id: mission.id, party, status: "signed", signed_document_path: path, signed_at: new Date().toISOString() }, { onConflict: "mission_id,party" });
    must(`Admin · dépose le contrat ${party} signé`, !up.error && !error, up.error?.message ?? error?.message);
  }
  const theirs = await client.storage.from("contracts").download(`${mission.id}/freelance/signe-e2e.pdf`);
  check("Client · n'accède pas au contrat du freelance", !!theirs.error);
  const act = await admin.rpc("activate_mission", { _mission_id: mission.id });
  const { data: mAfter } = await admin.from("missions").select("status").eq("id", mission.id).single();
  must("Admin · démarre la mission", !act.error && mAfter.status === "active", act.error?.message ?? mAfter.status);
  const { data: cm } = await client.from("client_missions").select("*").eq("id", mission.id).single();
  check("Client · voit son TJM (650 €), pas celui du freelance", cm?.client_tjm === 650 && !("recruiter_tjm" in (cm ?? {})));
  const rawM = await client.from("missions").select("recruiter_tjm").eq("id", mission.id);
  check("Client · ne lit pas la table des missions (marge)", !rawM.data?.length);

  section("CRA");
  const { data: ts, error: tErr } = await free.from("timesheets").insert({ mission_id: mission.id, month: MONTH, year: YEAR }).select("id").single();
  must("Freelance · ouvre son CRA du mois", !tErr, tErr?.message);
  ids.timesheet = ts.id;
  const [d1, d2] = weekdaysOfMonth(2);
  must("Freelance · saisit 1,5 jour", !(await free.from("timesheet_days").insert([{ timesheet_id: ts.id, day_date: d1, value: 1 }, { timesheet_id: ts.id, day_date: d2, value: 0.5 }])).error);
  const rPath = `${ts.id}/${crypto.randomUUID()}.pdf`;
  await free.storage.from("expense-receipts").upload(rPath, pdf("E2E billet"), { contentType: "application/pdf" });
  must("Freelance · ajoute un frais", !(await free.from("timesheet_expenses").insert({ timesheet_id: ts.id, expense_date: d1, category: "transport", label: `${TAG} Train`, amount_ht: 50, vat_amount: 5, receipt_path: rPath })).error);
  const { data: sub } = await free.from("timesheets").update({ status: "submitted", total_days: 30, freelancer_comment: "E2E" }).eq("id", ts.id).select("total_days").single();
  check("Base · total recalculé à l'envoi (1,5 j, pas 30)", Number(sub?.total_days) === 1.5, sub?.total_days);
  const direct = await client.from("timesheets").update({ status: "client_approved" }).eq("id", ts.id);
  check("Client · ne peut pas valider sans signature", !!direct.error);
  must("Client · refuse avec un motif", !(await client.from("timesheets").update({ status: "client_rejected", rejection_reason: "Le 2e jour était complet" }).eq("id", ts.id)).error);
  await free.from("timesheet_days").update({ value: 1 }).eq("timesheet_id", ts.id).eq("day_date", d2);
  must("Freelance · corrige et renvoie (2 j)", !(await free.from("timesheets").update({ status: "submitted" }).eq("id", ts.id)).error);
  const code = await invoke(client, "cra-sign", { action: "request_code", timesheet_id: ts.id });
  must("Client · reçoit un code de signature", !!code.data?.test_code, code.error);
  const wrong = await invoke(client, "cra-sign", { action: "sign", timesheet_id: ts.id, code: code.data.test_code === "000000" ? "111111" : "000000", full_name: "Claire E2E", accepted: true });
  check("Client · mauvais code refusé", !!wrong.error, wrong.error);
  const signed = await invoke(client, "cra-sign", { action: "sign", timesheet_id: ts.id, code: code.data.test_code, full_name: "Claire E2E", accepted: true });
  must("Client · signe le CRA", !!signed.data?.reference, signed.error);
  const proof = await invoke(client, "cra-sign", { action: "proof_url", timesheet_id: ts.id });
  const proofBytes = proof.data?.url ? new Uint8Array(await (await fetch(proof.data.url)).arrayBuffer()) : new Uint8Array();
  const { data: sig } = await client.from("timesheet_signatures").select("document_sha256").eq("timesheet_id", ts.id).single();
  check("Preuve PDF · empreinte SHA-256 conforme", proofBytes.length > 0 && sha256(proofBytes) === sig?.document_sha256);
  check("Freelance · n'accède pas à la preuve (TJM client)", !!(await invoke(free, "cra-sign", { action: "proof_url", timesheet_id: ts.id })).error);
  const { data: rates } = await admin.from("timesheet_rates").select("client_amount, freelance_amount, expenses_ht").eq("timesheet_id", ts.id).single();
  check("Taux figés · 2 j × 650 / 550 + 50 € de frais", Number(rates?.client_amount) === 1300 && Number(rates?.freelance_amount) === 1100 && Number(rates?.expenses_ht) === 50, JSON.stringify(rates));
  const leak = [await client.from("timesheet_rates").select("*"), await free.from("timesheet_rates").select("*")];
  check("Client et freelance · ne lisent pas les taux figés", leak.every((r) => !r.data?.length));

  section("Facturation (mode Pennylane)");
  const { data: draftId, error: dErr } = await admin.rpc("create_invoice_draft", { _timesheet_id: ts.id });
  must("Admin · prépare la facture depuis le CRA", !dErr, dErr?.message);
  ids.invoice = draftId;
  const { data: draft } = await admin.from("client_invoices").select("total_ht, total_ttc").eq("id", draftId).single();
  check("Brouillon · 1 350 € HT (jours + frais), 1 620 € TTC", Number(draft?.total_ht) === 1350 && Number(draft?.total_ttc) === 1620, JSON.stringify(draft));
  check("Client · ne voit pas le brouillon", !(await client.from("client_invoices").select("id").eq("id", draftId)).data?.length);
  const number = `E2E-${STAMP}`;
  const rec = await admin.rpc("record_external_invoice", { _invoice_id: draftId, _number: number, _issue_date: new Date().toISOString().slice(0, 10), _due_date: null });
  must("Admin · enregistre la facture Pennylane", !rec.error, rec.error?.message);
  const invPath = `${users.client.id}/${number}.pdf`;
  const invUp = await admin.storage.from("invoices").upload(invPath, pdf(`E2E facture ${number}`), { contentType: "application/pdf" });
  must("Admin · joint le PDF Pennylane", !invUp.error && !(await admin.from("client_invoices").update({ pdf_path: invPath }).eq("id", draftId)).error, invUp.error?.message);
  const locked = await admin.from("client_invoices").update({ total_ht: 1 }).eq("id", draftId);
  check("Facture émise figée (montant non modifiable)", !!locked.error);
  const cInv = await client.storage.from("invoices").download(invPath);
  check("Client · télécharge sa facture", !cInv.error);
  check("Freelance · n'accède pas à la facture client", !!(await free.storage.from("invoices").download(invPath)).error);
  must("Admin · enregistre le paiement", !(await admin.from("client_invoices").update({ status: "paid", paid_at: new Date().toISOString().slice(0, 10), paid_amount: 1620 }).eq("id", draftId)).error);

  const fPath = `${users.freelance.id}/${ts.id}/${crypto.randomUUID()}.pdf`;
  must("Freelance · dépose le PDF de sa facture", !(await free.storage.from("freelance-invoices").upload(fPath, pdf("E2E facture freelance"), { contentType: "application/pdf" })).error);
  const { data: fInv, error: fiErr } = await free.from("freelance_invoices").insert({ timesheet_id: ts.id, freelance_user_id: users.freelance.id, invoice_number: `F-${STAMP}`, invoice_date: new Date().toISOString().slice(0, 10), amount_ht: 1150, vat_amount: 230, file_path: fPath }).select("id, status, expected_ht").single();
  must("Freelance · envoie sa facture", !fiErr, fiErr?.message);
  check("Montant attendu calculé en base (1 100 + 50 = 1 150 € HT)", Number(fInv.expected_ht) === 1150, fInv.expected_ht);
  for (const status of ["approved", "paid"]) {
    const { error } = await admin.from("freelance_invoices").update({ status, ...(status === "paid" ? { paid_at: new Date().toISOString().slice(0, 10) } : {}) }).eq("id", fInv.id);
    must(`Admin · facture freelance « ${status} »`, !error, error?.message);
  }

  section("Notifications");
  const kinds = async (c) => (await c.from("notifications").select("kind")).data?.map((n) => n.kind) ?? [];
  const cK = await kinds(client);
  const fK = await kinds(free);
  const aK = await kinds(admin);
  const expect = (who, list, wanted) => check(`${who} · notifié de chaque étape`, wanted.every((k) => list.includes(k)), wanted.filter((k) => !list.includes(k)).join(", ") || `${list.length} notifications`);
  expect("Client", cK, ["suggestion", "mission_created", "kyc_approved", "mission_started", "cra_submitted", "invoice_issued", "invoice_paid"]);
  expect("Freelance", fK, ["mission_created", "kyc_approved", "mission_started", "cra_rejected", "cra_approved", "freelance_invoice_approved", "freelance_invoice_paid"]);
  expect("Admin", aK, ["kyc_submitted", "cra_approved", "freelance_invoice_submitted"]);
  check("Client · ne reçoit aucune notification du freelance", !cK.some((k) => k.startsWith("freelance_invoice") || k.startsWith("cra_rejected")));
}

// ── Nettoyage ──────────────────────────────────────────────────────────────────
/** Supprime tout ce qui dépend des comptes dont l'email correspond au motif (LIKE). */
function purge(emailPattern) {
  sql(`begin;
    create temp table tu as select id from auth.users where email like ${q(emailPattern)};
    create temp table tn as select id from public.client_needs where user_id in (select id from tu);
    create temp table tm as select id from public.missions where need_id in (select id from tn)
      or recruiter_profile_id in (select id from public.recruiter_profiles where user_id in (select id from tu));
    create temp table tt as select id from public.timesheets where mission_id in (select id from tm);
    -- Les factures émises sont indélébiles par conception : garde suspendue le temps de les supprimer.
    set session_replication_role = replica;
    delete from public.client_invoices where client_user_id in (select id from tu) or timesheet_id in (select id from tt);
    set session_replication_role = origin;
    delete from public.freelance_invoices where freelance_user_id in (select id from tu) or timesheet_id in (select id from tt);
    delete from public.timesheets where id in (select id from tt);
    delete from public.contracts where mission_id in (select id from tm);
    delete from public.missions where id in (select id from tm);
    delete from public.profile_suggestions where need_id in (select id from tn)
      or recruiter_profile_id in (select id from public.recruiter_profiles where user_id in (select id from tu));
    delete from public.client_needs where id in (select id from tn);
    delete from public.kyc_documents where user_id in (select id from tu);
    delete from public.kyc_dossiers where user_id in (select id from tu);
    delete from public.notifications where user_id in (select id from tu) or body like '%E2E%';
    delete from public.recruiter_profiles where user_id in (select id from tu);
    delete from public.client_profiles where user_id in (select id from tu);
    delete from public.user_roles where user_id in (select id from tu);
    set storage.allow_delete_query = 'true';
    delete from storage.objects where
      (bucket_id in ('admin-documents', 'freelance-invoices', 'invoices', 'timesheet-proofs') and (storage.foldername(name))[1] in (select id::text from tu))
      or (bucket_id = 'contracts' and (storage.foldername(name))[1] in (select id::text from tm))
      or (bucket_id = 'expense-receipts' and (storage.foldername(name))[1] in (select id::text from tt));
    delete from auth.users where id in (select id from tu);
    commit;`);
}
// Notifications envoyées aux vrais admins pendant le test (sans marqueur dans leur texte).
const purgeAdminNotifications = () => sql(`delete from public.notifications where created_at >= ${q(startedAt)}
  and user_id in (select user_id from public.user_roles where role = 'admin')
  and kind in ('kyc_submitted', 'cra_approved', 'freelance_invoice_submitted');`);

let cleaned = false;
function cleanup() {
  if (cleaned || KEEP) return;
  cleaned = true;
  purge(`e2e-%-${STAMP}@${DOMAIN}`);
  purgeAdminNotifications();
}
// Interruption (Ctrl-C) : on nettoie quand même.
process.on("SIGINT", () => {
  console.log("\nInterrompu : nettoyage…");
  try { cleanup(); } finally { process.exit(130); }
});

// Restes d'un test précédent interrompu brutalement.
purge(`e2e-%@${DOMAIN}`);

let failed = false;
try {
  await run();
} catch (e) {
  failed = true;
  console.error(`\n✘ ${e instanceof Error ? e.message : e}`);
} finally {
  if (KEEP) console.log(`\nDonnées conservées (--keep) : comptes ${Object.values(users).map((u) => u.email).join(", ")}`);
  else {
    try { cleanup(); console.log("\nDonnées de test supprimées."); } catch (e) { console.error("Nettoyage incomplet :", e.message); failed = true; }
  }
  const ko = results.filter((r) => !r.ok);
  console.log(`\n${results.length - ko.length}/${results.length} vérifications réussies.`);
  if (ko.length) console.log(`Échecs : ${ko.map((r) => r.label).join(" · ")}`);
  process.exit(failed || ko.length ? 1 : 0);
}
