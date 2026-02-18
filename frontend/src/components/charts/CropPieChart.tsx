import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  PLANTED: "#16a34a", GROWING: "#2563eb", HARVESTED: "#d97706", STORED: "#7c3aed",
};

interface CropStatusData {
  name: string;
  value: number;
}

export default function CropPieChart({ data }: { data: CropStatusData[] }) {
  return (
    <div className="flex items-center justify-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-sm" style={{ background: STATUS_COLORS[entry.name] ?? "#94a3b8" }} />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
