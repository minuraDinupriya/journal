"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Check, X, Key, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

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
