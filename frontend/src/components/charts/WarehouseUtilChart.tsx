import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const UTIL_COLOR = (pct: number) => pct > 95 ? "#dc2626" : pct > 80 ? "#d97706" : "#16a34a";

interface WarehouseUtilData {
  name: string;
  used: number;
  free: number;
  pct: number;
}

export default function WarehouseUtilChart({ data }: { data: WarehouseUtilData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={28}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v, n) => [v, n === "used" ? "Used" : "Free"]} />
        <Bar dataKey="used" name="Used" stackId="a" radius={[0, 0, 4, 4]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={UTIL_COLOR(entry.pct)} />
          ))}
        </Bar>
        <Bar dataKey="free" name="Free" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
