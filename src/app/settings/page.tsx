"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Check, X, Key, Trash2, Download, Scale, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useRiskStore } from "@/stores/risk-store";

function RiskSettingsCard() {
  const { targetRisk, isNormalizedMode, setTargetRisk, setNormalizedMode } = useRiskStore();
  const [val, setVal] = useState(targetRisk.toString());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVal(targetRisk.toString());
  }, [targetRisk]);

  if (!mounted) return null;

  const handleSave = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setTargetRisk(num);
      toast.success(`Target risk updated to $${num.toLocaleString()}`);
    } else {
      toast.error("Please enter a valid positive dollar amount");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" /> Risk & Position Sizing ($R Normalization)
        </CardTitle>
        <CardDescription>
          Scale your portfolio statistics to a fixed dollar risk (e.g. $10,000 per trade). This eliminates distortions caused by scaling up your position size over time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="targetRiskInput">Target Risk per Trade (1R)</Label>
          <div className="flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="targetRiskInput"
                type="number"
                min="1"
                step="any"
                className="pl-7"
                value={val}
                onChange={(e) => setVal(e.target.value)}
              />
            </div>
            <Button onClick={handleSave} variant="secondary">
              Save
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[500, 1000, 2500, 5000, 10000, 25000].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant={targetRisk === amount ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setTargetRisk(amount);
                  setVal(amount.toString());
                  toast.success(`Target risk set to $${amount.toLocaleString()}`);
                }}
              >
                ${amount >= 1000 ? `${amount / 1000}k` : amount}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <Label>Default View Mode</Label>
          <RadioGroup
            value={isNormalizedMode ? "normalized" : "actual"}
            onValueChange={(v) => {
              setNormalizedMode(v === "normalized");
              toast.success(v === "normalized" ? "Normalized Risk view enabled" : "Actual Cash P&L view enabled");
            }}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="actual" id="view-actual" />
              <Label htmlFor="view-actual" className="cursor-pointer">
                <span className="font-semibold block">Actual Broker P&L</span>
                <span className="text-xs text-muted-foreground">Display actual cash gains and losses recorded at the time of execution.</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="normalized" id="view-normalized" />
              <Label htmlFor="view-normalized" className="cursor-pointer">
                <span className="font-semibold block">Normalized Fixed Risk ($R) Mode</span>
                <span className="text-xs text-muted-foreground">Re-scale all trades to your target risk ($10,000 = 1R) for uniform historical comparison.</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key_status');
    if (stored === 'set') setHasKey(true);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey) {
      toast.error("Please enter an API key");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: apiKey }),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      toast.success("API Key saved successfully");
      setHasKey(true);
      setApiKey("");
      localStorage.setItem('gemini_api_key_status', 'set');
    } catch (error) {
      toast.error("Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    toast.info("Exporting data...");
    window.open('/api/trades?format=csv', '_blank');
  };

  const handleClearData = async () => {
    const confirm = window.confirm("WARNING: This will delete ALL trades, journal entries, and AI messages. This cannot be undone. Are you sure?");
    if (!confirm) return;
    
    try {
      toast.loading("Clearing data...", { id: 'clearing' });
      const res = await fetch('/api/settings/clear-data', { method: 'POST' });
      if (!res.ok) throw new Error("Failed to clear data");
      
      toast.success("All data has been cleared", { id: 'clearing' });
      window.location.href = '/';
    } catch (error) {
      toast.error("Failed to clear data", { id: 'clearing' });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your app configuration and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> AI Configuration
          </CardTitle>
          <CardDescription>
            Configure your Gemini API key to use the AI Trading Coach.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            Status: 
            {hasKey ? (
              <span className="text-green-500 flex items-center text-sm font-medium"><Check className="h-4 w-4 mr-1" /> Configured</span>
            ) : (
              <span className="text-red-500 flex items-center text-sm font-medium"><X className="h-4 w-4 mr-1" /> Not Configured</span>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  placeholder={hasKey ? "••••••••••••••••••••••••" : "Enter your Google Gemini API Key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleSaveApiKey} disabled={isSaving || !apiKey}>
                {isSaving ? "Saving..." : "Save Key"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Don't have a key? You can get a free one from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Google AI Studio
            </a>.
          </p>
        </CardContent>
      </Card>

      {/* Risk & Position Sizing ($R Normalization) */}
      <RiskSettingsCard />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the application looks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue={theme} onValueChange={setTheme} className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="light" id="theme-light" />
              <Label htmlFor="theme-light">Light Theme</Label>
            </div>
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label htmlFor="theme-dark">Dark Theme</Label>
            </div>
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="system" id="theme-system" />
              <Label htmlFor="theme-system">System Default</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export your data or clear it completely.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" /> Export All Trades (CSV)
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleClearData}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground py-8">
        <p className="font-medium text-foreground">TradeJournal</p>
        <p>Version 0.1.0</p>
        <p className="mt-2">Built with Next.js, Prisma, and Recharts</p>
        <p className="mt-2">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            View on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
