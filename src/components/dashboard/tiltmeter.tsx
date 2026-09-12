"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TiltmeterData } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from "recharts";

interface TiltmeterProps {
  data: TiltmeterData[];
  isLoading: boolean;
}

export function Tiltmeter({ data, isLoading }: TiltmeterProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tiltmeter - Emotion vs. Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[350px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiltmeter - Emotion vs. Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            No emotional data available.
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="emotion" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={(val) => `$${val}`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as TiltmeterData;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <p className="font-medium mb-1">{item.emotion}</p>
                          <div className="grid gap-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground text-sm">Avg P&L:</span>
                              <span className={`font-medium ${item.averagePnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(item.averagePnl)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground text-sm">Trades:</span>
                              <span className="font-medium">{item.tradeCount}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground text-sm">Win Rate:</span>
                              <span className="font-medium">{(item.winRate * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="averagePnl" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.averagePnl >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
