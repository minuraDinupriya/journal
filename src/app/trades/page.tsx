"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTrades } from "@/hooks/use-trades"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TradeTable } from "@/components/trades/trade-table"
import { Plus, Upload, Zap, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

function TradesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { trades, isLoading, deleteTrade, updateTrade, bulkMoveTrades, bulkDeleteTrades } = useTrades()

  const activeTab: 'LIVE' | 'BACKTEST' = searchParams.get("tab") === "BACKTEST" ? "BACKTEST" : "LIVE"

  const liveTrades = trades.filter(t => (t.tradeType || 'LIVE') === 'LIVE')
  const backtestTrades = trades.filter(t => t.tradeType === 'BACKTEST')
  const currentTrades = activeTab === 'BACKTEST' ? backtestTrades : liveTrades

  const totalTrades = currentTrades.length
  const winningTrades = currentTrades.filter(t => (t.pnl || 0) > 0).length
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
  const totalPnl = currentTrades.reduce((acc, t) => acc + (t.pnl || 0), 0)

  const handleTabChange = (tab: 'LIVE' | 'BACKTEST') => {
    router.push(`/trades?tab=${tab}`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your live journal and historical backtests in separate, focused environments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/trades/import">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/trades/new?type=${activeTab}`}>
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'BACKTEST' ? "New Backtest Trade" : "Add Trade"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-muted/60 border rounded-xl w-fit">
        <button
          type="button"
          onClick={() => handleTabChange('LIVE')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === 'LIVE'
              ? "bg-background text-foreground shadow-sm font-semibold ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className={cn("w-4 h-4", activeTab === 'LIVE' ? "text-emerald-500" : "text-muted-foreground")} />
          <span>Live Trades</span>
          <Badge variant={activeTab === 'LIVE' ? "default" : "secondary"} className="ml-1 text-xs px-1.5 py-0 h-5">
            {liveTrades.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('BACKTEST')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === 'BACKTEST'
              ? "bg-background text-foreground shadow-sm font-semibold ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FlaskConical className={cn("w-4 h-4", activeTab === 'BACKTEST' ? "text-purple-400" : "text-muted-foreground")} />
          <span>Backtesting</span>
          <Badge variant={activeTab === 'BACKTEST' ? "default" : "secondary"} className="ml-1 text-xs px-1.5 py-0 h-5">
            {backtestTrades.length}
          </Badge>
        </button>
      </div>

      {/* KPI Cards for the Active Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {activeTab === 'BACKTEST' ? "Total Backtests" : "Total Live Trades"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {activeTab === 'BACKTEST' ? "Backtest Win Rate" : "Live Win Rate"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {activeTab === 'BACKTEST' ? "Backtest Net P&L" : "Live Net P&L"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnl > 0 ? 'text-green-600' : totalPnl < 0 ? 'text-red-600' : ''}`}>
              ${totalPnl.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade History Table for Active Category */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {activeTab === 'BACKTEST' ? (
              <>
                <FlaskConical className="w-5 h-5 text-purple-400" />
                <span>Backtesting History</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-emerald-500" />
                <span>Live Trade History</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TradeTable 
            trades={currentTrades} 
            isLoading={isLoading} 
            onDelete={deleteTrade} 
            onUpdate={updateTrade}
            onBulkMove={bulkMoveTrades}
            onBulkDelete={bulkDeleteTrades}
            activeTab={activeTab}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function TradesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading trades...</div>}>
      <TradesContent />
    </Suspense>
  )
}
