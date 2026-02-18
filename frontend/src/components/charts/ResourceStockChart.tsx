import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

interface ResourceData {
  name: string;
  stock: number;
}

export default function ResourceStockChart({ data }: { data: ResourceData[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={36}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <Bar dataKey="stock" name="Stock" fill="#16a34a" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.stock === 0 ? "#dc2626" : entry.stock < 50 ? "#d97706" : "#16a34a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
