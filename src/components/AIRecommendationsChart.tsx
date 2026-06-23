import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AIRecommendationsChartProps {
  treatmentChartData: Array<{ name: string; probability: number; response: string }>;
}

export default function AIRecommendationsChart({ treatmentChartData }: AIRecommendationsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={treatmentChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip
          formatter={(value: number) => `${value}%`}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Bar dataKey="probability" fill="#3b82f6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
