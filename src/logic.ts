const LC_DAY_PATTERN = /^LC:\s*Day\s+(\d+)/i;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseIsoDate(date: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(date);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function parseLcDayNumber(title: string): number | null {
  const match = LC_DAY_PATTERN.exec(title);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

export function findMaxLcDay(titles: string[]): number {
  let maxDay = 0;

  for (const title of titles) {
    const dayNumber = parseLcDayNumber(title);
    if (dayNumber !== null && dayNumber > maxDay) {
      maxDay = dayNumber;
    }
  }

  return maxDay;
}

export function getNextLcTitle(maxDay: number, prefix: string): string {
  return `${prefix.trimEnd()} ${maxDay + 1}`;
}

export function getTodayIsoDate(timeZone: string, now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Unable to format date for time zone: ${timeZone}`);
  }

  return `${year}-${month}-${day}`;
}

export function getNextDate(latestDate: string): string {
  const parsed = parseIsoDate(latestDate);
  if (!parsed) {
    throw new Error(`Invalid ISO date: ${latestDate}`);
  }

  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return formatIsoDate(parsed);
}

export function buildAutomationKey(team: string, isoDate: string): string {
  const normalizedTeam = team.trim().toLowerCase().replace(/\s+/g, "-");
  return `lc-daily-${normalizedTeam}-${isoDate}`;
}

export function shouldCreatePage(
  existingAutomationKeys: string[],
  candidateKey: string
): boolean {
  return !existingAutomationKeys.includes(candidateKey);
}
