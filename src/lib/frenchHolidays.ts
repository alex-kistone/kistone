/**
 * French public holidays utility
 * Calculates fixed + moving holidays (Easter-based) for a given year
 */

// Easter calculation (Meeus/Jones/Butcher algorithm)
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getFrenchHolidays(year: number): Set<string> {
  const easter = getEasterDate(year);

  const holidays = [
    // Fixed holidays
    new Date(year, 0, 1),   // Jour de l'An
    new Date(year, 4, 1),   // Fête du Travail
    new Date(year, 4, 8),   // Victoire 1945
    new Date(year, 6, 14),  // Fête nationale
    new Date(year, 7, 15),  // Assomption
    new Date(year, 10, 1),  // Toussaint
    new Date(year, 10, 11), // Armistice
    new Date(year, 11, 25), // Noël
    // Easter-based holidays
    addDays(easter, 1),     // Lundi de Pâques
    addDays(easter, 39),    // Ascension
    addDays(easter, 50),    // Lundi de Pentecôte
  ];

  return new Set(holidays.map(formatDate));
}

export function getFrenchHolidayName(dateStr: string): string | null {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const easter = getEasterDate(year);
  const m = date.getMonth();
  const d = date.getDate();

  // Fixed holidays
  if (m === 0 && d === 1) return "Jour de l'An";
  if (m === 4 && d === 1) return "Fête du Travail";
  if (m === 4 && d === 8) return "Victoire 1945";
  if (m === 6 && d === 14) return "Fête nationale";
  if (m === 7 && d === 15) return "Assomption";
  if (m === 10 && d === 1) return "Toussaint";
  if (m === 10 && d === 11) return "Armistice";
  if (m === 11 && d === 25) return "Noël";

  // Easter-based
  const fd = formatDate(date);
  if (fd === formatDate(addDays(easter, 1))) return "Lundi de Pâques";
  if (fd === formatDate(addDays(easter, 39))) return "Ascension";
  if (fd === formatDate(addDays(easter, 50))) return "Lundi de Pentecôte";

  return null;
}
