import { prefilter, MARGIN_EUR } from "../matching.ts";

const need: any = {
  id: "n1", job_title: "Talent Acquisition Manager Tech", description: "Recrutement de profils backend Go et SRE, scale-up fintech",
  persona: "rpo", profile_types: ["Tech", "SRE"], sectors: ["Fintech"],
  mission_location: "Paris", remote_policy: "hybrid",
  budget_tjm_min: 500, budget_tjm_max: 650,
};

const base: any = {
  skills: [], sectors: [], tech_specialties: [], mobility: [], clients: [], languages: [],
  remote_preference: "flexible", model: "rpo", available: true, availability_date: null,
  admin_rating: 0, super_tam: false, intro_text: "", missions: [], has_linkedin_license: false, job_title: null,
};

const recruiters: any[] = [
  { ...base, id: "a", first_name: "Sarah", skills: ["Tech", "SRE", "Go"], sectors: ["Fintech"], mobility: ["Paris"], tjm: 520, admin_rating: 5, super_tam: true, remote_preference: "hybrid" },
  { ...base, id: "b", first_name: "Thomas", skills: ["Retail"], sectors: ["Retail"], mobility: ["Lyon"], tjm: 400, admin_rating: 3 },
  { ...base, id: "c", first_name: "Cher", skills: ["Tech"], tjm: 900, admin_rating: 5 },                       // hors budget → exclu
  { ...base, id: "d", first_name: "Grille", skills: ["Tech", "SRE"], tjm: 500, admin_rating: 1 },              // note 1 → exclu
  { ...base, id: "e", first_name: "Remote", skills: ["Tech","SRE"], tjm: 480, remote_preference: "remote", mobility: ["Paris"], sectors:["Fintech"] },
  { ...base, id: "f", first_name: "Indispo", skills: ["Tech","SRE"], tjm: 500, available: false, availability_date: null, admin_rating: 3 }, // exclu
  { ...base, id: "g", first_name: "Bientot", skills: ["Tech","SRE"], sectors:["Fintech"], mobility:["Paris"], tjm: 510, available: false, availability_date: new Date(Date.now()+20*864e5).toISOString().slice(0,10) },
];

const busy = new Set<string>(["g"]);
console.log("marge =", MARGIN_EUR, "€\n");
for (const s of prefilter(need, recruiters, busy)) {
  console.log(`${s.score.toString().padStart(3)}  ${s.recruiter.first_name.padEnd(9)} ${JSON.stringify(s.notes)}`);
}
const kept = prefilter(need, recruiters, busy).map(s => s.recruiter.id);
console.log("\nretenus:", kept.join(","));
for (const [id,why] of [["c","hors budget"],["d","note admin 1"],["f","indispo sans date"]] as const)
  console.log(`exclu ${id} (${why}) :`, !kept.includes(id) ? "OK" : "ÉCHEC");
