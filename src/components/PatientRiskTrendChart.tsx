import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PatientRiskTrendChartProps {
  riskHistory: Array<{ date: string; score: number }>;
}

export default function PatientRiskTrendChart({ riskHistory }: PatientRiskTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={riskHistory}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
