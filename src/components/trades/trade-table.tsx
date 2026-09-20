"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trade } from "@/types/trade"
import { format } from "date-fns"
import { EMOTIONAL_STATES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Eye, 
  Trash2, 
  ArrowUpDown, 
  FlaskConical, 
  Zap, 
  CheckCircle2, 
  Layers
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TradeTableProps {
  trades: Trade[]
  isLoading: boolean
  onDelete: (id: string) => void
  onUpdate?: (id: string, data: any, background?: boolean) => void
  onBulkMove?: (ids: string[], targetType: 'LIVE' | 'BACKTEST') => Promise<void>
  onBulkDelete?: (ids: string[]) => Promise<void>
  activeTab?: 'LIVE' | 'BACKTEST'
}

type SortField = 'date' | 'asset' | 'pnl'
type SortOrder = 'asc' | 'desc'

export function TradeTable({ 
  trades, 
  isLoading, 
  onDelete, 
  onUpdate,
  onBulkMove,
  onBulkDelete,
  activeTab = 'LIVE'
}: TradeTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([])
  const [isBulkOperating, setIsBulkOperating] = useState(false)

  // Clear selection whenever trades change or tab changes
  useEffect(() => {
    setSelectedTradeIds([])
  }, [activeTab])

  useEffect(() => {
    if (isLoading || trades.length === 0) return

    let targetId: string | null = null
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash && hash.startsWith("#trade-")) {
        targetId = hash.replace("#trade-", "")
      } else {
        targetId = sessionStorage.getItem("lastViewedTradeId")
      }
    }

    if (targetId) {
      setHighlightedId(targetId)

      const scrollTimer = setTimeout(() => {
        const row = document.getElementById(`trade-${targetId}`)
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 150)

      const fadeTimer = setTimeout(() => {
        setHighlightedId(null)
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("lastViewedTradeId")
          if (window.location.hash.startsWith("#trade-")) {
            history.replaceState(null, "", window.location.pathname + window.location.search)
          }
        }
      }, 3500)

      return () => {
        clearTimeout(scrollTimer)
        clearTimeout(fadeTimer)
      }
    }
  }, [isLoading, trades])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedTrades = [...trades].sort((a, b) => {
    let result = 0
    if (sortField === 'date') {
      const dateA = new Date(a.entryDate || a.createdAt).getTime()
      const dateB = new Date(b.entryDate || b.createdAt).getTime()
      result = dateA - dateB
    } else if (sortField === 'asset') {
      result = a.asset.localeCompare(b.asset)
    } else if (sortField === 'pnl') {
      const pnlA = a.pnl || 0
      const pnlB = b.pnl || 0
      result = pnlA - pnlB
    }
    return sortOrder === 'asc' ? result : -result
  })

  const allSelected = sortedTrades.length > 0 && selectedTradeIds.length === sortedTrades.length
  const someSelected = selectedTradeIds.length > 0 && selectedTradeIds.length < sortedTrades.length

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTradeIds(sortedTrades.map(t => t.id))
    } else {
      setSelectedTradeIds([])
    }
  }

  const handleSelectTrade = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTradeIds(prev => [...prev, id])
    } else {
      setSelectedTradeIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleExecuteBulkMove = async (targetType: 'LIVE' | 'BACKTEST') => {
    if (!onBulkMove || selectedTradeIds.length === 0) return
    setIsBulkOperating(true)
    try {
      await onBulkMove(selectedTradeIds, targetType)
      setSelectedTradeIds([])
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleExecuteBulkDelete = async () => {
    if (!onBulkDelete || selectedTradeIds.length === 0) return
    setIsBulkOperating(true)
    try {
      await onBulkDelete(selectedTradeIds)
      setSelectedTradeIds([])
    } finally {
      setIsBulkOperating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {activeTab === 'BACKTEST' 
            ? "No backtesting trades found. Start journaling your backtests or move trades from Live."
            : "No live trades found. Start journaling your trades to see your history here."}
        </p>
        <Button onClick={() => router.push(`/trades/new?type=${activeTab}`)}>
          {activeTab === 'BACKTEST' ? "Add First Backtest Trade" : "Add Your First Trade"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Multi-Select Floating Bulk Action Bar */}
      {selectedTradeIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg shadow-sm transition-all duration-200">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-2 py-1 font-semibold text-xs bg-primary/20 text-primary">
              <Layers className="w-3.5 h-3.5 mr-1 inline" />
              {selectedTradeIds.length} trade{selectedTradeIds.length > 1 ? 's' : ''} selected
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedTradeIds([])}
            >
              Clear Selection
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isBulkOperating}
              onClick={() => handleExecuteBulkMove(activeTab === 'BACKTEST' ? 'LIVE' : 'BACKTEST')}
              className="h-8 text-xs font-medium border-primary/40 hover:bg-primary/10"
            >
              {activeTab === 'BACKTEST' ? (
                <>
                  <Zap className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  Move to Live Trades
                </>
              ) : (
                <>
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                  Move to Backtesting
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  disabled={isBulkOperating}
                  className="h-8 text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete ({selectedTradeIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Trades</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedTradeIds.length} selected trade{selectedTradeIds.length > 1 ? 's' : ''}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExecuteBulkDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox 
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  aria-label="Select all trades"
                />
              </TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                Date <ArrowUpDown className="w-3 h-3 inline-block ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('asset')}>
                Asset <ArrowUpDown className="w-3 h-3 inline-block ml-1" />
              </TableHead>
              <TableHead>Direction</TableHead>
              <TableHead className="text-right">R:R</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('pnl')}>
                P&L <ArrowUpDown className="w-3 h-3 inline-block ml-1" />
              </TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Setup</TableHead>
              <TableHead>Emotion</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTrades.map((trade) => {
              const isProfit = (trade.pnl || 0) > 0
              const isLoss = (trade.pnl || 0) < 0
              const emotion = EMOTIONAL_STATES?.find(e => e.value === trade.emotionalState)
              const isSelected = selectedTradeIds.includes(trade.id)

              return (
                <TableRow 
                  key={trade.id} 
                  id={`trade-${trade.id}`}
                  className={cn(
                    "cursor-pointer transition-all duration-500",
                    isSelected ? "bg-primary/10" : "",
                    highlightedId === trade.id 
                      ? "bg-primary/20 ring-2 ring-primary/60 border-primary shadow-lg shadow-primary/10" 
                      : "hover:bg-muted/50"
                  )} 
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("lastViewedTradeId", trade.id)
                    }
                    router.push(`/trades/${trade.id}`)
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={(checked) => handleSelectTrade(trade.id, !!checked)}
                      aria-label={`Select trade ${trade.asset}`}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdate) onUpdate(trade.id, { isReviewed: !trade.isReviewed }, true)
                      }}
                      title={trade.isReviewed ? "Reviewed (click to unmark)" : "Click to mark as reviewed"}
                      className="p-1 rounded hover:bg-muted/80 transition-colors"
                    >
                      <CheckCircle2 className={cn(
                        "w-4 h-4 transition-colors",
                        trade.isReviewed ? "text-emerald-500 fill-emerald-500/20" : "text-muted-foreground/30 hover:text-muted-foreground"
                      )} />
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(trade.entryDate || trade.createdAt), "MMM dd, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{trade.asset}</span>
                      {trade.tradeType === 'BACKTEST' && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-purple-500/10 text-purple-400 border-purple-500/30 font-normal">
                          Backtest
                        </Badge>
                      )}
                      {highlightedId === trade.id && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/40 animate-pulse font-normal">
                          Last Viewed
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.direction === "LONG" ? "default" : "destructive"}>
                      {trade.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {trade.realizedRr !== null && trade.realizedRr !== undefined ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${trade.realizedRr > 0 ? 'text-emerald-500 bg-emerald-500/10' : trade.realizedRr < 0 ? 'text-rose-500 bg-rose-500/10' : 'text-muted-foreground bg-muted'}`}>
                        {trade.realizedRr > 0 ? '+' : ''}{trade.realizedRr.toFixed(2)}R
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${isProfit ? 'text-emerald-500' : isLoss ? 'text-rose-500' : ''}`}>
                    {trade.pnl !== null && trade.pnl !== undefined ? `$${trade.pnl.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>
                    {trade.strategy ? (
                      <Badge variant="outline" className="font-normal">{trade.strategy}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {trade.setup ? (
                      <Badge variant="secondary" className="font-normal">{trade.setup}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xl" title={emotion?.label}>
                    {emotion?.emoji || "-"}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {/* Quick Move Button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title={trade.tradeType === 'BACKTEST' ? "Move to Live Trades" : "Move to Backtesting"}
                        onClick={() => {
                          const target = trade.tradeType === 'BACKTEST' ? 'LIVE' : 'BACKTEST'
                          if (onUpdate) onUpdate(trade.id, { tradeType: target }, false)
                        }}
                      >
                        {trade.tradeType === 'BACKTEST' ? (
                          <Zap className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <FlaskConical className="w-4 h-4 text-purple-400" />
                        )}
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => router.push(`/trades/${trade.id}`)} title="View trade">
                        <Eye className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete trade">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this trade? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(trade.id)} className="bg-destructive text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
