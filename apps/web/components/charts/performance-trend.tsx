"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatNumber } from "@/lib/format";

export function PerformanceTrend({
  data
}: {
  data: Array<{ date: string; clicks: number; impressions: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="clicks" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0f9dff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0f9dff" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="impressions" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6e9d58" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#6e9d58" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(90, 105, 122, 0.12)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#728197", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#728197", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
          <Tooltip
            contentStyle={{
              background: "rgba(255,255,255,0.96)",
              borderRadius: "16px",
              border: "1px solid rgba(90, 105, 122, 0.16)"
            }}
          />
          <Area type="monotone" dataKey="impressions" stroke="#6e9d58" fill="url(#impressions)" strokeWidth={2} />
          <Area type="monotone" dataKey="clicks" stroke="#0f9dff" fill="url(#clicks)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
