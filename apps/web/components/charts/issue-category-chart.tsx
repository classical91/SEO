"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function IssueCategoryChart({
  data
}: {
  data: Array<{ category: string; count: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(90, 105, 122, 0.12)" vertical={false} />
          <XAxis dataKey="category" tick={{ fill: "#728197", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#728197", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(255,255,255,0.96)",
              borderRadius: "16px",
              border: "1px solid rgba(90, 105, 122, 0.16)"
            }}
          />
          <Bar dataKey="count" fill="#0f9dff" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
