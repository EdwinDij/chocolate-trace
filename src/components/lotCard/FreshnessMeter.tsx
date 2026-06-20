import { parseWeekLabel, weekDiff } from "../../utils/dates";

interface FreshnessMeterProps {
  weekReceiving: string;
  lifeWeeks: number;
  withdrawalDate?: string | null;
  expirationDate?: string | null;
}

export default function FreshnessMeter({
  weekReceiving,
  lifeWeeks,
  withdrawalDate,
  expirationDate,
}: FreshnessMeterProps) {
  const receivingDate = parseWeekLabel(weekReceiving);
  if (!receivingDate || lifeWeeks <= 0) return null;

  const now = new Date();
  const weeksElapsed = Math.max(0, weekDiff(receivingDate, now));
  const progress = Math.min(1, weeksElapsed / lifeWeeks);
  const withdrawAt = Math.max(0, (lifeWeeks - 2) / lifeWeeks);

  let weeksUntilWithdrawal: number;
  if (withdrawalDate) {
    weeksUntilWithdrawal = Math.round(
      (new Date(withdrawalDate).getTime() - now.getTime()) / (7 * 86400000),
    );
  } else if (expirationDate) {
    const expMs = new Date(expirationDate).getTime();
    weeksUntilWithdrawal = Math.round(
      (expMs - now.getTime()) / (7 * 86400000) - 2,
    );
  } else {
    weeksUntilWithdrawal = lifeWeeks - 2 - weeksElapsed;
  }

  const isOverdue = weeksUntilWithdrawal <= 0;
  const isWarning = weeksUntilWithdrawal > 0 && weeksUntilWithdrawal <= 2;

  const progressPct = `${Math.min(progress, withdrawAt) * 100}%`;
  const amberPct = `${(progress - withdrawAt) * 100}%`;
  const withdrawPct = `${withdrawAt * 100}%`;
  const todayPct = `${progress * 100}%`;

  return (
    <div className="mt-3">
      <div className="relative h-2 bg-stone-100 rounded-full overflow-visible">
        {/* Green fill up to withdrawal marker */}
        <div
          className="absolute left-0 top-0 h-full bg-green-400 rounded-full"
          style={{ width: progressPct }}
        />
        {/* Amber fill in withdrawal zone */}
        {progress > withdrawAt && (
          <div
            className="absolute top-0 h-full bg-amber-400 rounded-l-none rounded-r-full"
            style={{ left: withdrawPct, width: amberPct }}
          />
        )}
        {/* Withdrawal marker line */}
        <div
          className="absolute top-0 h-full w-px bg-amber-500/50"
          style={{ left: withdrawPct }}
        />
        {/* Today dot */}
        <div
          className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 shadow-sm"
          style={{
            left: todayPct,
            transform: "translate(-50%, -50%)",
            borderColor: isOverdue
              ? "#dc2626"
              : isWarning
                ? "#d97706"
                : "#16a34a",
          }}
        />
      </div>

      <p
        className={`mt-2 text-[10px] font-semibold ${
          isOverdue
            ? "text-red-600"
            : isWarning
              ? "text-amber-600"
              : "text-green-700"
        }`}
      >
        {isOverdue
          ? `⚠️ Retrait dépassé de ${Math.abs(weeksUntilWithdrawal)} sem.`
          : isWarning
            ? `🕐 À retirer dans ${weeksUntilWithdrawal} sem.`
            : `✓ Retrait dans ${weeksUntilWithdrawal} sem.`}
      </p>
    </div>
  );
}
