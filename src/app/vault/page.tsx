"use client"

import { useState } from "react"
import { Lock, Unlock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VaultDashboard } from "@/components/vault/vault-dashboard"

export default function VaultPage() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "21293") {
      setIsUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setPassword("")
    }
  }

  if (isUnlocked) {
    return <VaultDashboard lockVault={() => setIsUnlocked(false)} />
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 space-y-6 max-w-md mx-auto">
      <div className="p-4 bg-primary/10 rounded-full">
        <Lock className="w-12 h-12 text-primary" />
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Restricted Area</h1>
        <p className="text-muted-foreground text-sm">
          Please enter the password to access your strategies and secret knowledge.
        </p>
      </div>

      <form onSubmit={handleUnlock} className="w-full space-y-4">
        <div className="space-y-2">
          <Input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs text-center">Incorrect password.</p>}
        </div>
        <Button type="submit" className="w-full">
          <Unlock className="w-4 h-4 mr-2" />
          Unlock Vault
        </Button>
      </form>
    </div>
  )
}
