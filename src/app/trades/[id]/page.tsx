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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      
      let chartImages: string[] = []
      if (trade?.chartImagePath) {
        try {
          chartImages = trade.chartImagePath.startsWith('[') 
            ? JSON.parse(trade.chartImagePath) 
            : [trade.chartImagePath]
        } catch {
          chartImages = [trade.chartImagePath]
        }
      }
      
      if (e.key === 'Escape') {
        setLightboxIndex(null)
      } else if (e.key === 'ArrowLeft' && chartImages.length > 1) {
        setLightboxIndex(prev => prev !== null ? (prev === 0 ? chartImages.length - 1 : prev - 1) : null)
      } else if (e.key === 'ArrowRight' && chartImages.length > 1) {
        setLightboxIndex(prev => prev !== null ? (prev === chartImages.length - 1 ? 0 : prev + 1) : null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, trade])

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
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              {trade.realizedRr !== null && trade.realizedRr !== undefined && (
                <div className="text-right">
                  <div className="text-sm font-medium text-muted-foreground">Realized R:R</div>
                  <div className={`text-4xl font-bold ${trade.realizedRr > 0 ? 'text-emerald-500' : trade.realizedRr < 0 ? 'text-rose-500' : ''}`}>
                    {trade.realizedRr > 0 ? '+' : ''}{trade.realizedRr.toFixed(2)}R
                  </div>
                </div>
              )}
              <div className={`text-right ${isProfit ? 'text-emerald-500' : isLoss ? 'text-rose-500' : ''}`}>
                <div className="text-sm font-medium text-muted-foreground">Net P&L</div>
                <div className="text-4xl font-bold">
                  {trade.pnl !== null && trade.pnl !== undefined ? `$${trade.pnl.toFixed(2)}` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Entry Price</div>
              <div className="font-semibold">{trade.entryPrice}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Exit Price</div>
              <div className="font-semibold">{trade.exitPrice || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Stop Loss (SL)</div>
              <div className="font-semibold">{trade.stopLoss || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Risk per Unit</div>
              <div className="font-semibold text-orange-500/90">
                {trade.stopLoss ? Math.abs(trade.entryPrice - trade.stopLoss).toFixed(2) : "—"}
              </div>
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
            {trade.duringTradeNotes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">During-Trade Notes</h3>
                <p className="whitespace-pre-wrap text-muted-foreground bg-muted p-4 rounded-md">
                  {trade.duringTradeNotes}
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
                      <div 
                        key={idx} 
                        className="rounded-lg overflow-hidden border cursor-pointer group relative"
                        onClick={() => setLightboxIndex(idx)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imgUrl} 
                          alt={`Trade Chart ${idx + 1}`} 
                          className="w-full h-auto object-cover group-hover:opacity-90 transition-opacity" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && chartImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <div 
            className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-white/70 hover:text-white z-50 bg-black/50 p-2 rounded-full"
              onClick={() => setLightboxIndex(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            {/* Previous Button */}
            {chartImages.length > 1 && (
              <button 
                className="absolute left-4 text-white/70 hover:text-white z-50 bg-black/50 p-2 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => prev !== null ? (prev === 0 ? chartImages.length - 1 : prev - 1) : null)
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
            )}

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={chartImages[lightboxIndex]} 
              alt={`Trade Chart ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[90vh] object-contain rounded-md"
            />

            {/* Next Button */}
            {chartImages.length > 1 && (
              <button 
                className="absolute right-4 text-white/70 hover:text-white z-50 bg-black/50 p-2 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => prev !== null ? (prev === chartImages.length - 1 ? 0 : prev + 1) : null)
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            )}
            
            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              {lightboxIndex + 1} / {chartImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
