"use client"

import { TradeCalendar } from "@/components/calendar/trade-calendar"

export default function CalendarPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <TradeCalendar />
    </div>
  )
}
