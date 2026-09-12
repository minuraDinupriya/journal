"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Trade } from "@/types/trade"
import { ASSET_CLASSES, EMOTIONAL_STATES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartUpload } from "@/components/trades/chart-upload"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { tradeFormSchema, TradeFormData } from "@/lib/validators/trade-validator"

interface TradeFormProps {
  mode: 'create' | 'edit'
  initialData?: Trade
  onSubmit: (data: TradeFormData) => Promise<void>
  isSubmitting: boolean
}

export function TradeForm({ mode, initialData, onSubmit, isSubmitting }: TradeFormProps) {
  const router = useRouter()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema) as any,
    defaultValues: {
      asset: initialData?.asset || "",
      assetClass: initialData?.assetClass || "",
      direction: initialData?.direction || "LONG",
      entryPrice: initialData?.entryPrice || 0,
      exitPrice: initialData?.exitPrice || undefined,
      size: initialData?.size || 0,
      fees: initialData?.fees || 0,
      entryDate: initialData?.entryDate ? new Date(initialData.entryDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      exitDate: initialData?.exitDate ? new Date(initialData.exitDate).toISOString().slice(0, 16) : undefined,
      strategy: initialData?.strategy || "",
      setup: initialData?.setup || "",
      preTradeNotes: initialData?.preTradeNotes || "",
      postTradeNotes: initialData?.postTradeNotes || "",
      emotionalState: initialData?.emotionalState || "",
      tradingViewLink: initialData?.tradingViewLink || "",
      chartImages: initialData?.chartImagePath 
        ? (initialData.chartImagePath.startsWith('[') ? JSON.parse(initialData.chartImagePath) : [initialData.chartImagePath])
        : []
    }
  })

  const [calculatedPnl, setCalculatedPnl] = useState<number | null>(null)

  const direction = watch("direction")
  const entryPrice = watch("entryPrice")
  const exitPrice = watch("exitPrice")
  const size = watch("size")
  const fees = watch("fees")
  const emotionalState = watch("emotionalState")
  const assetClass = watch("assetClass")
  const chartImages = watch("chartImages")

  useEffect(() => {
    if (entryPrice > 0 && exitPrice !== undefined && exitPrice !== null && exitPrice > 0 && size > 0) {
      let pnl = 0
      if (direction === "LONG") {
        pnl = (exitPrice - entryPrice) * size
      } else {
        pnl = (entryPrice - exitPrice) * size
      }
      pnl -= (fees || 0)
      setCalculatedPnl(pnl)
    } else {
      setCalculatedPnl(null)
    }
  }, [entryPrice, exitPrice, size, direction, fees])

  const onError = (formErrors: any) => {
    toast.error("Please fill in all required fields correctly.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="asset">Asset</Label>
          <Input id="asset" {...register("asset")} placeholder="e.g. AAPL, EURUSD, BTC" />
          {errors.asset && <p className="text-red-500 text-sm">{errors.asset.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assetClass">Asset Class</Label>
          <Select value={assetClass} onValueChange={(val) => setValue("assetClass", val)}>
            <SelectTrigger id="assetClass">
              <SelectValue placeholder="Select Asset Class" />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CLASSES?.map(ac => (
                <SelectItem key={ac.value} value={ac.value}>{ac.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="direction">Direction</Label>
          <Select value={direction} onValueChange={(val: "LONG" | "SHORT") => setValue("direction", val)}>
            <SelectTrigger id="direction">
              <SelectValue placeholder="Select Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LONG">LONG</SelectItem>
              <SelectItem value="SHORT">SHORT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input id="size" type="number" step="any" {...register("size", { setValueAs: v => v === "" ? 0 : parseFloat(v) })} />
          {errors.size && <p className="text-red-500 text-sm">{errors.size.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="entryPrice">Entry Price</Label>
          <Input id="entryPrice" type="number" step="any" {...register("entryPrice", { setValueAs: v => v === "" ? 0 : parseFloat(v) })} />
          {errors.entryPrice && <p className="text-red-500 text-sm">{errors.entryPrice.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="exitPrice">Exit Price</Label>
          <Input id="exitPrice" type="number" step="any" {...register("exitPrice", { setValueAs: v => v === "" ? undefined : parseFloat(v) })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fees">Fees</Label>
          <Input id="fees" type="number" step="any" {...register("fees", { setValueAs: v => v === "" ? 0 : parseFloat(v) })} />
        </div>

        <div className="space-y-2">
          <Label>Estimated P&L</Label>
          <div className={`p-2 border rounded-md font-semibold ${calculatedPnl !== null ? (calculatedPnl > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50') : 'text-muted-foreground bg-muted'}`}>
            {calculatedPnl !== null ? `$${calculatedPnl.toFixed(2)}` : "Awaiting entry/exit/size"}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entryDate">Entry Date</Label>
          <Input id="entryDate" type="datetime-local" {...register("entryDate")} />
          {errors.entryDate && <p className="text-red-500 text-sm">{errors.entryDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="exitDate">Exit Date</Label>
          <Input id="exitDate" type="datetime-local" {...register("exitDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="strategy">Strategy</Label>
          <Input id="strategy" {...register("strategy")} placeholder="e.g. Breakout" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup">Setup</Label>
          <Input id="setup" {...register("setup")} placeholder="e.g. Bull Flag" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="emotionalState">Emotional State</Label>
          <Select value={emotionalState || undefined} onValueChange={(val) => setValue("emotionalState", val)}>
            <SelectTrigger id="emotionalState">
              <SelectValue placeholder="How did you feel?" />
            </SelectTrigger>
            <SelectContent>
              {EMOTIONAL_STATES?.map(emo => (
                <SelectItem key={emo.value} value={emo.value}>
                  <span className="mr-2">{emo.emoji}</span>
                  {emo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="preTradeNotes">Pre-Trade Notes</Label>
          <Textarea id="preTradeNotes" {...register("preTradeNotes")} placeholder="What was your thesis?" rows={3} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="postTradeNotes">Post-Trade Notes</Label>
          <Textarea id="postTradeNotes" {...register("postTradeNotes")} placeholder="What went well? What could be improved?" rows={3} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="tradingViewLink">TradingView Link</Label>
          <Input id="tradingViewLink" {...register("tradingViewLink")} placeholder="https://www.tradingview.com/x/..." />
          {errors.tradingViewLink && <p className="text-red-500 text-sm">{errors.tradingViewLink.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Chart Screenshots</Label>
          <ChartUpload value={chartImages || []} onChange={(paths) => setValue("chartImages", paths)} />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === 'create' ? 'Create Trade' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
