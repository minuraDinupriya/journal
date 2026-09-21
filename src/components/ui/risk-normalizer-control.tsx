"use client";

import { useState, useEffect } from "react";
import { useRiskStore } from "@/stores/risk-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Scale, DollarSign, Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_PRESETS = [500, 1000, 2500, 5000, 10000, 25000];

export function RiskNormalizerControl({ className }: { className?: string }) {
  const { targetRisk, isNormalizedMode, setTargetRisk, setNormalizedMode, toggleNormalizedMode } = useRiskStore();
  const [inputValue, setInputValue] = useState(targetRisk.toString());
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInputValue(targetRisk.toString());
  }, [targetRisk]);

  if (!mounted) {
    return null; // Avoid hydration mismatch on initial render
  }

  const handleApplyRisk = (value: number) => {
    setTargetRisk(value);
    setInputValue(value.toString());
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(inputValue);
    if (!isNaN(num) && num > 0) {
      setTargetRisk(num);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5 p-1 bg-muted/60 border rounded-xl shadow-xs text-xs", className)}>
      {/* Mode Switcher */}
      <div className="flex items-center gap-1 p-0.5 bg-background border rounded-lg">
        <button
          type="button"
          onClick={() => setNormalizedMode(false)}
          className={cn(
            "px-2.5 py-1 font-medium rounded-md transition-all flex items-center gap-1",
            !isNormalizedMode
              ? "bg-muted text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="View raw actual cash deposited/lost on each trade"
        >
          <DollarSign className="w-3.5 h-3.5" />
          Actual
        </button>

        <button
          type="button"
          onClick={() => setNormalizedMode(true)}
          className={cn(
            "px-2.5 py-1 font-medium rounded-md transition-all flex items-center gap-1.5",
            isNormalizedMode
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Scale all trades to fixed risk per trade (R-Multiple Mode)"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Normalized</span>
        </button>
      </div>

      {/* Target Risk Pill with Popover Configurator */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 font-medium rounded-lg border transition-all hover:bg-background/80",
              isNormalizedMode 
                ? "bg-primary/15 text-primary border-primary/40 font-semibold"
                : "bg-background/50 text-muted-foreground border-border"
            )}
            title="Configure Target Risk per Trade (1R)"
          >
            <span>1R = ${targetRisk.toLocaleString()}</span>
            <SlidersHorizontal className="w-3 h-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 space-y-4" align="end">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-primary" /> Target Risk per Trade (1R)
            </h4>
            <p className="text-xs text-muted-foreground">
              Define the fixed cash amount you are willing to risk on every trade. All stats scale to this amount.
            </p>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="target-risk-input" className="text-xs">Custom Dollar Risk ($)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input
                  id="target-risk-input"
                  type="number"
                  min="1"
                  step="any"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="pl-6 h-8 text-sm"
                  placeholder="e.g. 10000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quick Presets</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {RISK_PRESETS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={targetRisk === amount ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-1"
                    onClick={() => handleApplyRisk(amount)}
                  >
                    ${amount >= 1000 ? `${amount / 1000}k` : amount}
                  </Button>
                ))}
              </div>
            </div>

            <Button type="submit" size="sm" className="w-full h-8 text-xs mt-2">
              <Check className="w-3.5 h-3.5 mr-1" /> Save Target Risk
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
