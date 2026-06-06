import { getDaysInfo } from "../data/appData";

interface ClaimCountdownBarProps {
  dateStr: string;
}

export default function ClaimCountdownBar({ dateStr }: ClaimCountdownBarProps) {
  const { daysRemaining, daysElapsed, isExpired, countdownStatus } = getDaysInfo(dateStr);
  const barColor = isExpired ? "#9ca3af" : countdownStatus === "last10" ? "#ef4444" : countdownStatus === "expiring" ? "#f59e0b" : "#22c55e";
  const pct = Math.min(100, (daysElapsed / 60) * 100);
  const badge =
    isExpired
      ? { label: "Expired", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" }
      : countdownStatus === "last10"
      ? { label: "Last 10 Days", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" }
      : countdownStatus === "expiring"
      ? { label: "Expiring Soon", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" }
      : { label: "Active", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" };

  return (
    <div className={`mt-3 pt-3 border-t border-gray-100 ${isExpired ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide" style={{ fontFamily: "DM Sans, sans-serif" }}>
          Claim Period
        </span>
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor, transition: "width 0.4s ease" }} />
      </div>
      <p className="text-[10px] text-gray-400" style={{ fontFamily: "DM Sans, sans-serif" }}>
        {isExpired ? "60-Day Limit Reached · Eligible for University Disposal Policy" : `${daysRemaining} / 60 Days Remaining`}
      </p>
    </div>
  );
}
