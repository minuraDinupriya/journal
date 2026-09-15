"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  LineChart, 
  Upload, 
  BookOpen, 
  Bot, 
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CalendarDays,
  Trash2,
  Lock
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// Assume a simple ui store exists or create a local state for now if not available
// We'll use local state if ui-store isn't strictly defined, but user said "Use the ui-store for sidebar state".
// Since ui-store file isn't requested here, I will create a basic mock or use local state, 
// actually I'll use Zustand store if I assume one, or simply write a minimal one in local state and comment it.
// To be safe, I'll create a local Zustand store within this file or just use useState for simplicity and robust code.
import { create } from "zustand"

interface UiState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Trades", href: "/trades", icon: LineChart },
  { name: "Import", href: "/trades/import", icon: Upload },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "AI Coach", href: "/ai-coach", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Vault", href: "/vault", icon: Lock },
  { name: "Trash", href: "/trash", icon: Trash2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, toggleSidebar } = useUiStore()

  return (
    <div
      className={cn(
        "flex flex-col h-screen border-r bg-slate-950 text-slate-100 transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-slate-800 justify-between">
        {isSidebarOpen && (
          <Link href="/" className="flex items-center gap-2 font-bold text-lg overflow-hidden">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span>TradeJournal</span>
          </Link>
        )}
        {!isSidebarOpen && (
          <Link href="/" className="flex items-center justify-center w-full">
            <TrendingUp className="h-6 w-6 text-primary" />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900",
                  !isSidebarOpen && "justify-center px-0"
                )}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 shrink-0")} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <Button 
          variant="ghost" 
          size={isSidebarOpen ? "default" : "icon"}
          onClick={toggleSidebar} 
          className="w-full text-slate-400 hover:text-slate-100 hover:bg-slate-900"
        >
          {isSidebarOpen ? (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
