"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function Header() {
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard"
    if (pathname.startsWith("/trades/import")) return "Import Trades"
    if (pathname.startsWith("/trades")) return "Trades"
    if (pathname.startsWith("/journal")) return "Journal"
    if (pathname.startsWith("/ai-coach")) return "AI Coach"
    if (pathname.startsWith("/settings")) return "Settings"
    return "TradeJournal"
  }

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex text-sm text-muted-foreground mr-4 space-x-4">
          <div>Today's P&L: <span className="text-emerald-500 font-medium">+$450.00</span></div>
          <div>Win Rate: <span className="font-medium text-foreground">68%</span></div>
        </div>
        
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
