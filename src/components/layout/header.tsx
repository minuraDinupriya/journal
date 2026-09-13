"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useTradeStore } from "@/stores/trade-store"

export function Header() {
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()
  const { trades } = useTradeStore()
  
  // Hydration safety since dates/times can cause mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard"
    if (pathname.startsWith("/calendar")) return "Calendar"
    if (pathname.startsWith("/trades/import")) return "Import Trades"
    if (pathname.startsWith("/trades")) return "Trades"
    if (pathname.startsWith("/journal")) return "Journal"
    if (pathname.startsWith("/ai-coach")) return "AI Coach"
    if (pathname.startsWith("/settings")) return "Settings"
    return "TradeJournal"
  }

  // Calculate Today's P&L
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todaysTrades = trades.filter(t => {
    const date = new Date(t.exitDate || t.entryDate)
    return date >= today
  })

  const todaysPnl = todaysTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)

  // Calculate Win Rate
  const completedTrades = trades.filter(t => t.pnl !== null && t.pnl !== undefined)
  const winningTrades = completedTrades.filter(t => (t.pnl || 0) > 0)
  const winRate = completedTrades.length > 0 
    ? (winningTrades.length / completedTrades.length) * 100 
    : 0

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      
      <div className="flex items-center gap-4">
        {mounted && (
          <div className="hidden md:flex text-sm text-muted-foreground mr-4 space-x-4">
            <div>
              Today's P&L:{" "}
              <span className={`font-medium ${todaysPnl > 0 ? 'text-emerald-500' : todaysPnl < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {todaysPnl > 0 ? '+' : ''}{todaysPnl < 0 ? '-' : ''}${Math.abs(todaysPnl).toFixed(2)}
              </span>
            </div>
            <div>
              Win Rate: <span className="font-medium text-foreground">{winRate.toFixed(0)}%</span>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}
