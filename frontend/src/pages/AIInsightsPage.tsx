import { useState } from "react";
import { BrainCircuit, AlertTriangle, Info, TrendingUp, Lightbulb, X } from "lucide-react";
import { useData } from "../contexts/DataContext";
import type { Suggestion } from "../types";

const SEV_CONFIG = {
  critical: { bg: "bg-red-50", border: "border-red-400", text: "text-red-800", badge: "bg-red-100 text-red-700", icon: AlertTriangle, iconColor: "text-red-600" },
  warning:  { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-800", badge: "bg-yellow-100 text-yellow-700", icon: AlertTriangle, iconColor: "text-yellow-600" },
  info:     { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-800", badge: "bg-blue-100 text-blue-700", icon: Info, iconColor: "text-blue-600" },
};

const TYPE_LABELS: Record<string, string> = {
  OPTIMIZATION: "Optimization",
  DEPLETION_WARNING: "Depletion Warning",
  RECOMMENDATION: "Recommendation",
  FORECAST: "Forecast",
};

const TYPE_ICONS: Record<string, typeof Info> = {
  OPTIMIZATION: Lightbulb,
  DEPLETION_WARNING: AlertTriangle,
  RECOMMENDATION: TrendingUp,
  FORECAST: TrendingUp,
};

function SuggestionCard({ s, onDismiss }: { s: Suggestion & { id: number }; onDismiss: (id: number) => void }) {
  const cfg = SEV_CONFIG[s.severity];
  const TypeIcon = TYPE_ICONS[s.type] ?? Info;
  return (
    <div className={`rounded-xl border-l-4 ${cfg.border} ${cfg.bg} p-4 relative`}>
      <button onClick={() => onDismiss(s.id)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
        <X size={15} />
      </button>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 ${cfg.iconColor}`}>
          <TypeIcon size={18} />
        </div>
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`font-semibold text-sm ${cfg.text}`}>{s.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {s.severity.toUpperCase()}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {TYPE_LABELS[s.type]}
            </span>
          </div>
          <p className="text-sm text-gray-700">{s.message}</p>
        </div>
      </div>
    </div>
  );
}

export default function AIInsightsPage() {
  const { suggestions } = useData();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sevFilter, setSevFilter] = useState<string>("ALL");

  const tagged = suggestions.map((s, i) => ({ ...s, id: i }));
  const active = tagged.filter((s) => !dismissed.has(s.id));

  const filtered = active.filter((s) => {
    const matchType = typeFilter === "ALL" || s.type === typeFilter;
    const matchSev = sevFilter === "ALL" || s.severity === sevFilter;
    return matchType && matchSev;
  });

  const critCount = active.filter((s) => s.severity === "critical").length;
  const warnCount = active.filter((s) => s.severity === "warning").length;
  const infoCount = active.filter((s) => s.severity === "info").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BrainCircuit className="text-purple-600" size={26} /> AI Insights
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Smart suggestions based on your data</p>
        </div>
        {dismissed.size > 0 && (
          <button onClick={() => setDismissed(new Set())} className="text-sm text-blue-600 hover:underline">
            Restore {dismissed.size} dismissed
          </button>
        )}
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
          <AlertTriangle size={14} /> {critCount} Critical
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-700">
          <AlertTriangle size={14} /> {warnCount} Warning
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">
          <Info size={14} /> {infoCount} Info
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          {["ALL", "OPTIMIZATION", "DEPLETION_WARNING", "RECOMMENDATION", "FORECAST"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${typeFilter === t ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {t === "ALL" ? "All Types" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["ALL", "critical", "warning", "info"].map((s) => (
            <button key={s} onClick={() => setSevFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${sevFilter === s ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {s === "ALL" ? "All Severity" : s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <BrainCircuit size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No insights to show</p>
          <p className="text-sm text-gray-400 mt-1">All clear! Or try adjusting filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SuggestionCard key={s.id} s={s} onDismiss={(id) => setDismissed((prev) => new Set([...prev, id]))} />
          ))}
        </div>
      )}
    </div>
  );
}
