"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"

interface TradeScoreData {
  winPercent: number
  profitFactor: number
  avgWinLoss: number
  recoveryFactor: number
  maxDrawdownScore: number
  consistency: number
  compositeScore: number
}

interface TradeScoreProps {
  data: TradeScoreData | null
  isLoading: boolean
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-blue-400"
  if (score >= 60) return "text-emerald-400"
  if (score >= 40) return "text-yellow-400"
  if (score >= 20) return "text-orange-400"
  return "text-red-400"
}

export function TradeScore({ data, isLoading }: TradeScoreProps) {
  const chartData = data ? [
    { metric: "Win %", value: data.winPercent, fullMark: 100 },
    { metric: "Profit factor", value: data.profitFactor, fullMark: 100 },
    { metric: "Avg win/loss", value: data.avgWinLoss, fullMark: 100 },
    { metric: "Recovery factor", value: data.recoveryFactor, fullMark: 100 },
    { metric: "Max drawdown", value: data.maxDrawdownScore, fullMark: 100 },
    { metric: "Consistency", value: data.consistency, fullMark: 100 },
  ] : []

  const score = data?.compositeScore || 0

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          Trade Score
          <Info className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <>
            {/* Radar Chart */}
            <div className="h-[250px] -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(262, 83%, 58%)"
                    fill="hsl(262, 83%, 58%)"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Composite Score */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Trade Score</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                  {score.toFixed(2)}
                </span>
                <div className="flex-1">
                  {/* Gradient score bar */}
                  <div className="relative h-3 rounded-full overflow-hidden" style={{
                    background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6)"
                  }}>
                    {/* Score indicator */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-5 rounded-sm bg-white border-2 border-slate-800 shadow-md transition-all"
                      style={{ left: `calc(${Math.min(score, 100)}% - 6px)` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                    <span>60</span>
                    <span>80</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
