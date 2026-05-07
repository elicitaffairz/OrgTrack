export function normalizeYearLevel(input: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "Unknown";

  const lowered = raw.toLowerCase().replace(/\s+/g, "");

  const mapNumeric = (n: number) =>
    n === 1
      ? "1st Year"
      : n === 2
        ? "2nd Year"
        : n === 3
          ? "3rd Year"
          : n === 4
            ? "4th Year"
            : "Unknown";

  if (/^[1-4]$/.test(lowered)) {
    return mapNumeric(Number(lowered));
  }

  if (
    lowered === "1st" ||
    lowered === "1styear" ||
    lowered === "first" ||
    lowered === "firstyear" ||
    lowered === "year1"
  )
    return "1st Year";
  if (
    lowered === "2nd" ||
    lowered === "2ndyear" ||
    lowered === "second" ||
    lowered === "secondyear" ||
    lowered === "year2"
  )
    return "2nd Year";
  if (
    lowered === "3rd" ||
    lowered === "3rdyear" ||
    lowered === "third" ||
    lowered === "thirdyear" ||
    lowered === "year3"
  )
    return "3rd Year";
  if (
    lowered === "4th" ||
    lowered === "4thyear" ||
    lowered === "fourth" ||
    lowered === "fourthyear" ||
    lowered === "year4"
  )
    return "4th Year";

  return raw;
}

export function yearLevelToNumber(yearLevel: unknown): "" | "1" | "2" | "3" | "4" {
  const raw = String(yearLevel ?? "").trim();
  if (!raw) return "";

  const lowered = raw.toLowerCase();
  if (/^[1-4]$/.test(lowered)) return lowered as "1" | "2" | "3" | "4";

  if (lowered.includes("1st") || lowered.includes("first")) return "1";
  if (lowered.includes("2nd") || lowered.includes("second")) return "2";
  if (lowered.includes("3rd") || lowered.includes("third")) return "3";
  if (lowered.includes("4th") || lowered.includes("fourth")) return "4";

  const digit = lowered.match(/[1-4]/)?.[0];
  return (digit ?? "") as "" | "1" | "2" | "3" | "4";
}
