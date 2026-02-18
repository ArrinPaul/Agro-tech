import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface AllocationHistoryData {
  date: string;
  daily: number;
  cumulative: number;
}

export default function AllocationHistoryChart({ data }: { data: AllocationHistoryData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">No allocation data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <Tooltip />
        <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="daily" name="Daily" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
