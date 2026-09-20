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
import { Eye, Trash2, ArrowUpDown } from "lucide-react"
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
}

type SortField = 'date' | 'asset' | 'pnl'
type SortOrder = 'asc' | 'desc'

export function TradeTable({ trades, isLoading, onDelete, onUpdate }: TradeTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

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

      // Slight delay to allow DOM render to settle
      const scrollTimer = setTimeout(() => {
        const row = document.getElementById(`trade-${targetId}`)
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 150)

      // Gracefully clear the highlight after 3.5 seconds
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
        <p className="text-muted-foreground mb-4">No trades found. Start journaling to see your history here.</p>
        <Button onClick={() => router.push("/trades/new")}>Add Your First Trade</Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
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

            return (
              <TableRow 
                key={trade.id} 
                id={`trade-${trade.id}`}
                className={cn(
                  "cursor-pointer transition-all duration-500",
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
                    checked={trade.isReviewed || false} 
                    onCheckedChange={(checked) => {
                      if (onUpdate) onUpdate(trade.id, { isReviewed: !!checked }, true)
                    }}
                    aria-label="Mark as reviewed"
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(trade.entryDate || trade.createdAt), "MMM dd, yyyy h:mm a")}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{trade.asset}</span>
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
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/trades/${trade.id}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
  )
}
