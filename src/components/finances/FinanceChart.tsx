"use client";

import type { MonthlyFinanceDataPoint } from "@/lib/finance-utils";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FinanceChartProps {
  data: MonthlyFinanceDataPoint[];
}

const formatEuro = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);

const compactEuro = (amount: number) => {
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(1).replace(".", ",")}k€`;
  }
  return `${amount}€`;
};

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split("-");

  if (!year || !month) {
    return monthKey;
  }

  const date = new Date(`${year}-${month}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "2-digit",
  }).format(date);
};

export default function FinanceChart({ data }: FinanceChartProps) {
  if (data.length === 0) {
    return (
      <p className="finance-empty-inline">
        Aucune donnée mensuelle disponible pour le moment.
      </p>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    label: formatMonth(point.month),
  }));

  return (
    <div className="finance-chart-shell">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickFormatter={compactEuro}
            width={52}
          />

          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "#0f0f10",
              border: "1px solid #2b2b30",
              borderRadius: "10px",
              color: "#f0f0f0",
            }}
            formatter={(value, name) => [
              formatEuro(Number(value ?? 0)),
              String(name ?? ""),
            ]}
            labelFormatter={(label) => `Mois: ${String(label ?? "")}`}
          />

          <Legend
            verticalAlign="top"
            align="left"
            wrapperStyle={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              paddingBottom: "8px",
            }}
          />

          <Bar
            dataKey="incomeCompleted"
            name="Revenus réalisés"
            fill="var(--green)"
            radius={[6, 6, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            dataKey="expenseCompleted"
            name="Dépenses réalisées"
            fill="var(--red)"
            radius={[6, 6, 0, 0]}
            maxBarSize={30}
          />

          <Line
            type="monotone"
            dataKey="incomePlanned"
            name="Revenus prévus"
            stroke="var(--accent)"
            strokeWidth={2.2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "var(--accent)" }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="expensePlanned"
            name="Dépenses prévues"
            stroke="var(--amber)"
            strokeWidth={2.2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "var(--amber)" }}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
