"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface DayData {
  date: string
  pnl: number
  tradeCount: number
  winRate: number
}

interface CalendarData {
  year: number
  month: number
  days: DayData[]
  totalPnl: number
  tradingDays: number
}

interface WeekSummary {
  weekNumber: number
  pnl: number
  tradingDays: number
}

function formatPnl(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1000) {
    return `$${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 2)}K`
  }
  return `$${abs.toFixed(abs % 1 === 0 ? 0 : 2)}`
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function TradeCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/calendar?year=${year}&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setCalendarData(data)
      }
    } catch (error) {
      console.error("Failed to fetch calendar data", error)
    } finally {
      setIsLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const goToThisMonth = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // Build lookup from date string to day data
  const dayLookup: Record<number, DayData> = {}
  if (calendarData) {
    for (const day of calendarData.days) {
      const d = new Date(day.date).getDate()
      dayLookup[d] = day
    }
  }

  // Build weeks array (rows of 7)
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  // Fill in leading nulls
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill trailing nulls
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  // Ensure 6 weeks for consistent layout
  while (weeks.length < 6) {
    weeks.push([null, null, null, null, null, null, null])
  }

  // Calculate weekly summaries
  const weekSummaries: WeekSummary[] = weeks.map((week, idx) => {
    let pnl = 0
    let tradingDays = 0
    for (const day of week) {
      if (day && dayLookup[day]) {
        pnl += dayLookup[day].pnl
        tradingDays++
      }
    }
    return { weekNumber: idx + 1, pnl, tradingDays }
  })

  const totalPnl = calendarData?.totalPnl || 0
  const tradingDays = calendarData?.tradingDays || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold min-w-[180px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToThisMonth}>
            This month
          </Button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Monthly stats:</span>
          <span className={cn(
            "font-semibold px-2 py-0.5 rounded text-sm",
            totalPnl > 0 ? "bg-emerald-500/20 text-emerald-400" : totalPnl < 0 ? "bg-red-500/20 text-red-400" : "text-muted-foreground"
          )}>
            {totalPnl >= 0 ? '' : '-'}{formatPnl(totalPnl)}
          </span>
          <span className="text-purple-400 font-medium">{tradingDays} days</span>
        </div>
      </div>

      {/* Calendar + Weekly Summaries */}
      <div className="flex gap-4">
        {/* Calendar Grid */}
        <div className="flex-1">
          <Card className="overflow-hidden border-border/50">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border/50">
              {DAY_NAMES.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-3 border-r border-border/30 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 border-b border-border/30 last:border-b-0">
                {week.map((day, dayIdx) => {
                  const data = day ? dayLookup[day] : null
                  const isProfit = data && data.pnl > 0
                  const isLoss = data && data.pnl < 0
                  const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()

                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        "relative min-h-[100px] p-2 border-r border-border/30 last:border-r-0 transition-colors",
                        data && isProfit && "bg-emerald-900/40",
                        data && isLoss && "bg-red-900/40",
                        !day && "bg-muted/10",
                        isToday && "ring-1 ring-inset ring-primary/50"
                      )}
                    >
                      {day && (
                        <>
                          <div className="text-xs text-muted-foreground mb-1">{day}</div>
                          {data ? (
                            <div className="space-y-0.5">
                              <div className={cn(
                                "text-lg font-bold leading-tight",
                                isProfit ? "text-emerald-400" : "text-red-400"
                              )}>
                                {isLoss ? '-' : ''}{formatPnl(data.pnl)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {data.tradeCount} trade{data.tradeCount !== 1 ? 's' : ''}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {data.winRate.toFixed(data.winRate % 1 === 0 ? 0 : 1)}%
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </Card>
        </div>

        {/* Weekly Summaries */}
        <div className="w-36 space-y-2 shrink-0">
          {weekSummaries.map(week => (
            <Card key={week.weekNumber} className="p-3 text-center border-border/50">
              <div className="text-xs text-muted-foreground mb-1">Week {week.weekNumber}</div>
              <div className={cn(
                "text-lg font-bold",
                week.pnl > 0 ? "text-emerald-400" : week.pnl < 0 ? "text-red-400" : "text-muted-foreground"
              )}>
                {week.pnl < 0 ? '-' : ''}{formatPnl(week.pnl)}
              </div>
              <div className="text-xs text-purple-400">
                {week.tradingDays} day{week.tradingDays !== 1 ? 's' : ''}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
