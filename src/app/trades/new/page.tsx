"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTrades } from "@/hooks/use-trades"
import { TradeForm } from "@/components/trades/trade-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FlaskConical, Zap } from "lucide-react"

function NewTradeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createTrade, isLoading } = useTrades()

  const typeParam = searchParams.get("type") === "BACKTEST" ? "BACKTEST" : "LIVE"

  const handleSubmit = async (data: any) => {
    await createTrade(data)
    router.push(`/trades?tab=${data.tradeType || typeParam}`)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {typeParam === "BACKTEST" ? "New Backtest Trade" : "New Trade"}
          </h1>
          {typeParam === "BACKTEST" ? (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <FlaskConical className="w-3 h-3" /> Backtest Mode
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <Zap className="w-3 h-3" /> Live Mode
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeForm 
            mode="create" 
            defaultTradeType={typeParam}
            onSubmit={handleSubmit} 
            isSubmitting={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewTradePage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6 max-w-4xl">Loading...</div>}>
      <NewTradeContent />
    </Suspense>
  )
}
