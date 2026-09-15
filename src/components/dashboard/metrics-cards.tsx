import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardMetrics } from "@/types/metrics";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Scale
} from "lucide-react";

interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
}

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total P&L",
      value: metrics ? formatCurrency(metrics.totalPnl) : "$0.00",
      icon: DollarSign,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      valueColor: metrics && metrics.totalPnl >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Win Rate",
      value: metrics ? `${metrics.winRate.toFixed(2)}%` : "0%",
      icon: Target,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      valueColor: "",
    },
    {
      title: "Profit Factor",
      value: metrics ? metrics.profitFactor.toFixed(2) : "0.00",
      icon: TrendingUp,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      valueColor: "",
    },
    {
      title: "Average Win",
      value: metrics ? formatCurrency(metrics.averageWin) : "$0.00",
      icon: ArrowUpRight,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      valueColor: "text-emerald-500",
    },
    {
      title: "Average Loss",
      value: metrics ? formatCurrency(metrics.averageLoss) : "$0.00",
      icon: ArrowDownRight,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      valueColor: "text-rose-500",
    },
    {
      title: "Max Drawdown",
      value: metrics ? formatCurrency(metrics.maxDrawdown) : "$0.00",
      icon: TrendingDown,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      valueColor: "text-red-500",
    },
    {
      title: "Avg Realized R:R",
      value: metrics ? `${metrics.averageRrr > 0 ? '+' : ''}${metrics.averageRrr.toFixed(2)}R` : "—",
      icon: Scale,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      valueColor: metrics && metrics.averageRrr > 0 ? "text-emerald-500" : metrics && metrics.averageRrr < 0 ? "text-rose-500" : "",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("p-2 rounded-full", card.bgColor)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className={cn("text-2xl font-bold", card.valueColor)}>
                {card.value}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
