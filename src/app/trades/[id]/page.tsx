"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTrades } from "@/hooks/use-trades"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Trade } from "@/types/trade"
import { EMOTIONAL_STATES } from "@/lib/constants"
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

export default function TradeDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { deleteTrade } = useTrades()
  
  const [trade, setTrade] = useState<Trade | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        const res = await fetch(`/api/trades/${id}`)
        if (res.ok) {
          const data = await res.json()
          setTrade(data)
        }
      } catch (error) {
        console.error("Failed to fetch trade", error)
      } finally {
        setIsLoading(false)
      }
    }
    if (id) fetchTrade()
  }, [id])

  if (isLoading) return <div className="container mx-auto p-6">Loading...</div>
  if (!trade) return <div className="container mx-auto p-6">Trade not found.</div>

  const handleDelete = async () => {
    await deleteTrade(trade.id)
    router.push("/trades")
  }

  const emotion = EMOTIONAL_STATES?.find(e => e.value === trade.emotionalState)
  const isProfit = (trade.pnl || 0) > 0
  const isLoss = (trade.pnl || 0) < 0

  let chartImages: string[] = []
  if (trade.chartImagePath) {
    try {
      chartImages = trade.chartImagePath.startsWith('[') 
        ? JSON.parse(trade.chartImagePath) 
        : [trade.chartImagePath]
    } catch {
      chartImages = [trade.chartImagePath]
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/trades")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Trade Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/trades/${id}/edit`)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this trade from your journal.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Trade
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-8 border-b">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-bold">{trade.asset}</h2>
                <Badge variant={trade.direction === "LONG" ? "default" : "destructive"} className="text-sm">
                  {trade.direction}
                </Badge>
                {trade.assetClass && <Badge variant="secondary">{trade.assetClass}</Badge>}
              </div>
              <div className="text-muted-foreground">
                {trade.entryDate && format(new Date(trade.entryDate), "PPP p")}
                {trade.exitDate && ` - ${format(new Date(trade.exitDate), "PPP p")}`}
              </div>
            </div>
            <div className={`text-right mt-4 md:mt-0 ${isProfit ? 'text-green-600' : isLoss ? 'text-red-600' : ''}`}>
              <div className="text-sm font-medium text-muted-foreground">Net P&L</div>
              <div className="text-4xl font-bold">
                {trade.pnl !== null && trade.pnl !== undefined ? `$${trade.pnl.toFixed(2)}` : "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Entry Price</div>
              <div className="font-semibold">{trade.entryPrice}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Exit Price</div>
              <div className="font-semibold">{trade.exitPrice || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Size</div>
              <div className="font-semibold">{trade.size}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Fees</div>
              <div className="font-semibold">${trade.fees || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Strategy</div>
              <div className="font-semibold">{trade.strategy || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Setup</div>
              <div className="font-semibold">{trade.setup || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Emotion</div>
              <div className="font-semibold">
                {emotion ? `${emotion.emoji} ${emotion.label}` : "—"}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {trade.preTradeNotes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Pre-Trade Notes</h3>
                <p className="whitespace-pre-wrap text-muted-foreground bg-muted p-4 rounded-md">
                  {trade.preTradeNotes}
                </p>
              </div>
            )}
            {trade.postTradeNotes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Post-Trade Notes</h3>
                <p className="whitespace-pre-wrap text-muted-foreground bg-muted p-4 rounded-md">
                  {trade.postTradeNotes}
                </p>
              </div>
            )}
          </div>

          {(trade.tradingViewLink || chartImages.length > 0) && (
            <div className="mt-8 pt-8 border-t space-y-6">
              {trade.tradingViewLink && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">TradingView Chart</h3>
                  <a 
                    href={trade.tradingViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    View Chart on TradingView <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              )}
              {chartImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Attached Images ({chartImages.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chartImages.map((imgUrl, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                          <img src={imgUrl} alt={`Trade Chart ${idx + 1}`} className="w-full h-auto object-cover hover:opacity-90 transition-opacity" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
