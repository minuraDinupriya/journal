"use client"

import { useRouter } from "next/navigation"
import { useTrades } from "@/hooks/use-trades"
import { TradeForm } from "@/components/trades/trade-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewTradePage() {
  const router = useRouter()
  const { createTrade, isLoading } = useTrades()

  const handleSubmit = async (data: any) => {
    await createTrade(data)
    router.push("/trades")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Trade</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeForm 
            mode="create" 
            onSubmit={handleSubmit} 
            isSubmitting={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
