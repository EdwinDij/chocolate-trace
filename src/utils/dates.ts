const WITHDRAWAL_WEEKS = 2;

export function getISOWeek(date: Date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
      7,
    )
  );
}

export function getCurrentWeekLabel(): string {
  const now = new Date();
  const week = getISOWeek(now);
  const year = now.getFullYear();
  return `S${String(week).padStart(2, "0")}-${year}`;
}

export function parseWeekLabel(label: string | null | undefined): Date | null {
  const match = label?.match(/^S(\d{1,2})-(\d{4})$/);
  if (!match) return null;
  const week = parseInt(match[1]);
  const year = parseInt(match[2]);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + (week - 1) * 7);
  return monday;
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function weekDiff(dateA: Date, dateB: Date): number {
  return Math.round((dateB.getTime() - dateA.getTime()) / (7 * 86400000));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface BatchDates {
  expiryWeek: string;
  withdrawalWeek: string;
  expiryDate: string;
  withdrawalDate: string;
  weeksUntilWithdrawal: number;
  status: "expired" | "warning" | "ok";
}

export function computeBatchesDates(
  weekReceiving: string,
  lifeWeeks: number,
): BatchDates | null {
  const receivingDate = parseWeekLabel(weekReceiving);
  if (!receivingDate) return null;

  const expiryDate = addWeeks(receivingDate, lifeWeeks);
  const withdrawalDate = addWeeks(expiryDate, -WITHDRAWAL_WEEKS);
  const weeksUntilWithdrawal = weekDiff(new Date(), withdrawalDate);

  const expiryWeek = `S${String(getISOWeek(expiryDate)).padStart(2, "0")}-${expiryDate.getFullYear()}`;
  const withdrawalWeek = `S${String(getISOWeek(withdrawalDate)).padStart(2, "0")}-${withdrawalDate.getFullYear()}`;

  return {
    expiryWeek,
    withdrawalWeek,
    expiryDate: formatDate(expiryDate),
    withdrawalDate: formatDate(withdrawalDate),
    weeksUntilWithdrawal,
    status: computeStatus(weeksUntilWithdrawal),
  };
}

export function computeStatus(
  weeksUntilWithdrawal: number,
): "expired" | "warning" | "ok" {
  if (weeksUntilWithdrawal <= 0) return "expired"; // À retirer
  if (weeksUntilWithdrawal <= 2) return "warning"; // Attention
  return "ok"; // En bonne forme
}

export function endOfWeekFromToday(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  const day = d.getDay();
  if (day !== 0) d.setDate(d.getDate() + (7 - day));
  return d.toISOString().split("T")[0];
}

export function computeStatusFromDates(
  withdrawalDate: string | null,
  expirationDate: string | null,
): "expired" | "warning" | "ok" {
  const ref = withdrawalDate || expirationDate;
  if (!ref) return "ok";
  const diffWeeks =
    (new Date(ref).getTime() - new Date().getTime()) / (7 * 86400000);
  return computeStatus(diffWeeks);
}

export function formatDateFR(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface StatusStyle {
  bg: string;
  text: string;
  label: string;
}

//retourne les classe tailwind
export function getStatusStyle(status: string): StatusStyle {
  switch (status) {
    case "expired":
      return { bg: "bg-red-100", text: "text-red-700", label: "À retirer" };
    case "warning":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "À surveiller",
      };
    case "ok":
      return { bg: "bg-green-100", text: "text-green-700", label: "OK" };
    case "ouvert":
      return { bg: "bg-amber-100", text: "text-amber-700", label: "Ouvert" };
    case "en_vente":
      return { bg: "bg-sky-100", text: "text-sky-700", label: "En vente" };
    case "stock":
      return { bg: "bg-stone-100", text: "text-slate-500", label: "En stock" };
    case "perime":
      return { bg: "bg-red-100", text: "text-red-400", label: "Périmé" };
    case "non_conforme":
      return {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Non conforme",
      };
    default:
      return { bg: "bg-stone-100", text: "text-slate-500", label: "—" };
  }
}
