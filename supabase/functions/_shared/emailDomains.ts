// Messageries grand public refusées pour les comptes clients : l'espace client est réservé
// aux adresses professionnelles. Partagé entre le formulaire et la fonction assign-client-role.
const FREE_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "msn.com", "ymail.com", "rocketmail.com", "icloud.com", "me.com", "mac.com",
  "aol.com", "aol.fr", "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "neuf.fr", "bbox.fr", "numericable.fr",
  "club-internet.fr", "aliceadsl.fr", "libertysurf.fr", "voila.fr", "noos.fr", "cegetel.net", "9online.fr",
  "web.de", "protonmail.com", "protonmail.ch", "proton.me", "pm.me", "tutanota.com", "tuta.io", "hey.com",
  "fastmail.com", "zohomail.com", "mail.com", "email.com", "mail.ru", "qq.com", "163.com", "caramail.com",
]);
// Familles déclinées sur plusieurs extensions (hotmail.fr, outlook.be, yahoo.co.uk…).
const FREE_FAMILIES = /^(hotmail|outlook|live|yahoo|gmx|yandex|laposte)\.[a-z.]+$/;

export function isFreeEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return FREE_DOMAINS.has(domain) || FREE_FAMILIES.test(domain);
}

export const FREE_EMAIL_MESSAGE =
  "L'espace client est réservé aux adresses professionnelles : utilisez l'email de votre entreprise (pas de Gmail, Hotmail, Yahoo…).";
