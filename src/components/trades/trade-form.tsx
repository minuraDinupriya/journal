"use client"

import { useState, useEffect, useRef } from "react"
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
import { NotionEditor } from "@/components/ui/notion-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartUpload } from "@/components/trades/chart-upload"
import { VoiceRecorder } from "@/components/ui/voice-recorder"
import { Loader2, Zap, FlaskConical } from "lucide-react"
import { toast } from "sonner"
import { toLocalDatetimeString, cn } from "@/lib/utils"

import { tradeFormSchema, TradeFormData } from "@/lib/validators/trade-validator"

interface TradeFormProps {
  mode: 'create' | 'edit'
  initialData?: Trade
  defaultTradeType?: 'LIVE' | 'BACKTEST'
  onSubmit: (data: TradeFormData) => Promise<void>
  onAutoSave?: (data: TradeFormData) => void
  isSubmitting: boolean
}

export function TradeForm({ mode, initialData, defaultTradeType, onSubmit, onAutoSave, isSubmitting }: TradeFormProps) {
  const router = useRouter()
  const { register, handleSubmit, setValue, watch, getValues, formState: { errors, isDirty } } = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema) as any,
    defaultValues: {
      asset: initialData?.asset || "",
      assetClass: initialData?.assetClass || "",
      direction: initialData?.direction || "LONG",
      entryPrice: initialData?.entryPrice || 0,
      exitPrice: initialData?.exitPrice || undefined,
      stopLoss: initialData?.stopLoss ?? undefined,
      realizedRr: initialData?.realizedRr ?? undefined,
      size: initialData?.size || 0,
      fees: initialData?.fees || 0,
      entryDate: initialData?.entryDate ? toLocalDatetimeString(initialData.entryDate) : toLocalDatetimeString(new Date()),
      exitDate: initialData?.exitDate ? toLocalDatetimeString(initialData.exitDate) : undefined,
      strategy: initialData?.strategy || "",
      setup: initialData?.setup || "",
      preTradeNotes: initialData?.preTradeNotes || "",
      duringTradeNotes: initialData?.duringTradeNotes || "",
      postTradeNotes: initialData?.postTradeNotes || "",
      emotionalState: initialData?.emotionalState || "",
      tradingViewLink: initialData?.tradingViewLink || "",
      chartImages: initialData?.chartImagePath 
        ? (initialData.chartImagePath.startsWith('[') ? JSON.parse(initialData.chartImagePath) : [initialData.chartImagePath])
        : [],
      tradeType: (initialData?.tradeType || defaultTradeType || "LIVE") as 'LIVE' | 'BACKTEST'
    }
  })

  const [calculatedPnl, setCalculatedPnl] = useState<number | null>(initialData?.pnl ?? null)
  const [calculatedRr, setCalculatedRr] = useState<number | null>(initialData?.realizedRr ?? null)

  const tradeType = watch("tradeType")
  const direction = watch("direction")
  const entryPrice = watch("entryPrice")
  const exitPrice = watch("exitPrice")
  const stopLoss = watch("stopLoss")
  const size = watch("size")
  const fees = watch("fees")
  const emotionalState = watch("emotionalState")
  const assetClass = watch("assetClass")
  const chartImages = watch("chartImages")
  const preTradeNotes = watch("preTradeNotes")
  const duringTradeNotes = watch("duringTradeNotes")
  const postTradeNotes = watch("postTradeNotes")

  const valuesRef = useRef(getValues())
  const isDirtyRef = useRef(isDirty)
  const isSubmittingRef = useRef(isSubmitting)
  const modeRef = useRef(mode)

  useEffect(() => {
    valuesRef.current = getValues()
    isDirtyRef.current = isDirty
    isSubmittingRef.current = isSubmitting
  }, [watch(), isDirty, isSubmitting, getValues])

  useEffect(() => {
    return () => {
      // Auto-save on unmount if dirty, in edit mode, and not already submitting normally
      if (modeRef.current === 'edit' && isDirtyRef.current && !isSubmittingRef.current && onAutoSave) {
        onAutoSave(valuesRef.current)
      }
    }
  }, [onAutoSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!isSubmitting) {
          handleSubmit(onSubmit, onError)()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSubmit, onSubmit, isSubmitting])

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
      setValue("pnl", pnl)
    } else {
      setCalculatedPnl(null)
      setValue("pnl", null)
    }

    // Realized R:R Calculation
    if (entryPrice > 0 && exitPrice !== undefined && exitPrice !== null && exitPrice > 0 && stopLoss !== undefined && stopLoss !== null && stopLoss > 0) {
      let risk = 0
      let reward = 0
      if (direction === "LONG") {
        risk = entryPrice - stopLoss
        reward = exitPrice - entryPrice
      } else {
        risk = stopLoss - entryPrice
        reward = entryPrice - exitPrice
      }

      if (risk > 0) {
        const rr = Number((reward / risk).toFixed(2))
        setCalculatedRr(rr)
        setValue("realizedRr", rr)
      } else {
        setCalculatedRr(null)
        setValue("realizedRr", null)
      }
    } else {
      setCalculatedRr(null)
      setValue("realizedRr", null)
    }
  }, [entryPrice, exitPrice, stopLoss, size, direction, fees, setValue])

  const onError = (formErrors: any) => {
    toast.error("Please fill in all required fields correctly.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
      {/* Trade Environment Selector (Live vs Backtesting) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-muted/40 border rounded-xl">
        <div>
          <Label className="text-sm font-semibold">Trade Environment</Label>
          <p className="text-xs text-muted-foreground">
            Classify whether this trade was executed in live conditions or simulated during backtesting.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-background border rounded-lg">
          <button
            type="button"
            onClick={() => setValue("tradeType", "LIVE", { shouldDirty: true })}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
              (tradeType || 'LIVE') === "LIVE"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Live Trade
          </button>
          <button
            type="button"
            onClick={() => setValue("tradeType", "BACKTEST", { shouldDirty: true })}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
              tradeType === "BACKTEST"
                ? "bg-purple-600 text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-200" />
            Backtest
          </button>
        </div>
      </div>

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
          <Label htmlFor="stopLoss">Stop Loss (SL)</Label>
          <Input 
            id="stopLoss" 
            type="number" 
            step="any" 
            placeholder="e.g. 29300.00" 
            {...register("stopLoss", { setValueAs: v => v === "" || v === undefined || v === null ? undefined : parseFloat(v) })} 
          />
        </div>

        <div className="space-y-2">
          <Label>Realized Risk/Reward (R:R)</Label>
          <div className={`p-2 border rounded-md font-semibold ${calculatedRr !== null ? (calculatedRr > 0 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : calculatedRr < 0 ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : 'text-muted-foreground bg-muted') : 'text-muted-foreground bg-muted'}`}>
            {calculatedRr !== null 
              ? `${calculatedRr > 0 ? '+' : ''}${calculatedRr.toFixed(2)}R (1 : ${Math.abs(calculatedRr).toFixed(2)})` 
              : "Enter SL & Exit to calculate R:R"}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fees">Fees</Label>
          <Input id="fees" type="number" step="any" {...register("fees", { setValueAs: v => v === "" ? 0 : parseFloat(v) })} />
        </div>

        <div className="space-y-2">
          <Label>Estimated P&L</Label>
          <div className={`p-2 border rounded-md font-semibold ${calculatedPnl !== null ? (calculatedPnl > 0 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : calculatedPnl < 0 ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : 'text-muted-foreground bg-muted') : 'text-muted-foreground bg-muted'}`}>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="preTradeNotes">Pre-Trade Notes (Notion Style)</Label>
            <VoiceRecorder onTranscript={(text) => setValue("preTradeNotes", (getValues("preTradeNotes") ? getValues("preTradeNotes") + " " : "") + text, { shouldDirty: true })} />
          </div>
          <NotionEditor 
            id="preTradeNotes" 
            value={preTradeNotes || ""} 
            onChange={(val) => setValue("preTradeNotes", val, { shouldDirty: true })} 
            placeholder="What was your thesis? Write in Notion style (# H1, ## H2, **bold**, --- line dividers, checklists)" 
            rows={4} 
            minHeight="120px" 
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="duringTradeNotes">During-Trade Notes (Notion Style)</Label>
            <VoiceRecorder onTranscript={(text) => setValue("duringTradeNotes", (getValues("duringTradeNotes") ? getValues("duringTradeNotes") + " " : "") + text, { shouldDirty: true })} />
          </div>
          <NotionEditor 
            id="duringTradeNotes" 
            value={duringTradeNotes || ""} 
            onChange={(val) => setValue("duringTradeNotes", val, { shouldDirty: true })} 
            placeholder="What are you thinking while the trade is open?" 
            rows={4} 
            minHeight="120px" 
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="postTradeNotes">Post-Trade Notes (Notion Style)</Label>
            <VoiceRecorder onTranscript={(text) => setValue("postTradeNotes", (getValues("postTradeNotes") ? getValues("postTradeNotes") + " " : "") + text, { shouldDirty: true })} />
          </div>
          <NotionEditor 
            id="postTradeNotes" 
            value={postTradeNotes || ""} 
            onChange={(val) => setValue("postTradeNotes", val, { shouldDirty: true })} 
            placeholder="What went well? What could be improved?" 
            rows={4} 
            minHeight="120px" 
          />
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
        <Button type="submit" disabled={isSubmitting} title="Press Ctrl+S to save">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === 'create' ? 'Create Trade' : 'Save Changes'}
          <kbd className="ml-2 hidden sm:inline-flex items-center text-[10px] bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded font-mono font-medium">
            Ctrl+S
          </kbd>
        </Button>
      </div>
    </form>
  )
}
