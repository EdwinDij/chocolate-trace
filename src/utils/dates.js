const WITHDRAWAL_WEEKS = 2;

export function getISOWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
}

export function getCurrentWeekLabel() {
  const now = new Date();
  const week = getISOWeek(now);
  const year = now.getFullYear();
  return `S${String(week).padStart(2, "0")}-${year}`;
}

export function parseWeekLabel(label) {
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

export function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function weekDiff(dateA, dateB) {
  return Math.round((dateB - dateA) / (7 * 86400000));
}
export function formatDate(date) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// /**
//   Calcule des dates clées d'un lot ouvert
//   @param {string} weekOpening - "S22-2025"
//   @param {number} lifeWeeks   - durée de vie du type (ex: 5)
//   @returns {{ expiryWeek, withdrawalWeek, weeksUntilWithdrawal, status }}
//

export function computeBatchesDates(weekOpening, lifeWeeks) {
  const openingDate = parseWeekLabel(weekOpening);
  if (!openingDate) return null;

  const expiryDate = addWeeks(openingDate, lifeWeeks);
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

export function computeStatus(weeksUntilWithdrawal) {
  if (weeksUntilWithdrawal <= 0) return "expired"; // À retirer
  if (weeksUntilWithdrawal <= 2) return "warning"; // Attention
  return "ok"; // En bonne forme
}

//retourne les classe tailwind
export function getStatusStyle(status) {
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
    default:
      return { bg: "bg-stone-100", text: "text-stone-500", label: "Fermé" };
  }
}
