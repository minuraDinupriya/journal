"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTrades } from "@/hooks/use-trades"
import { TradeForm } from "@/components/trades/trade-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Trade } from "@/types/trade"
import { TradeFormData } from "@/lib/validators/trade-validator"

export default function EditTradePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { updateTrade, isLoading: isUpdating } = useTrades()
  
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

  const handleSubmit = async (data: TradeFormData) => {
    await updateTrade(id, data as any)
    router.push(`/trades/${id}`)
  }

  if (isLoading) return <div className="container mx-auto p-6 max-w-4xl">Loading...</div>
  if (!trade) return <div className="container mx-auto p-6 max-w-4xl">Trade not found.</div>

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Trade</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeForm 
            mode="edit" 
            initialData={trade}
            onSubmit={handleSubmit}
            onAutoSave={(data) => {
              // Quietly save in the background
              fetch(`/api/trades/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              }).catch(() => {})
            }}
            isSubmitting={isUpdating} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
