"use client"

import Link from "next/link"
import { useTrades } from "@/hooks/use-trades"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TradeTable } from "@/components/trades/trade-table"
import { Plus, Upload } from "lucide-react"

export default function TradesPage() {
  const { trades, isLoading, deleteTrade } = useTrades()

  const totalTrades = trades.length
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
  const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/trades/import">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/trades/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Trade
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnl > 0 ? 'text-green-600' : totalPnl < 0 ? 'text-red-600' : ''}`}>
              ${totalPnl.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeTable trades={trades} isLoading={isLoading} onDelete={deleteTrade} />
        </CardContent>
      </Card>
    </div>
  )
}
