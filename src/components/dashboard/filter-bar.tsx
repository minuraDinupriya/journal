"use client";

import { Trade } from "@/types/trade";
import { TradeFilter } from "@/types/metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSET_CLASSES, EMOTIONAL_STATES } from "@/lib/constants";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";

interface FilterBarProps {
  onFilterChange: (filters: TradeFilter) => void;
  trades: Trade[];
}

export function FilterBar({ onFilterChange, trades }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<TradeFilter>({});

  const strategies = useMemo(() => {
    const strats = new Set<string>();
    trades.forEach(t => {
      if (t.strategy) {
        strats.add(t.strategy);
      }
    });
    return Array.from(strats);
  }, [trades]);

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  return (
    <Card className="p-4 flex flex-wrap gap-4 items-end">
      <div className="space-y-1.5">
        <Label htmlFor="assetClass" className="text-xs">Asset Class</Label>
        <Select 
          value={localFilters.assetClass || "all"} 
          onValueChange={(val) => setLocalFilters(prev => ({ ...prev, assetClass: val === "all" ? undefined : val as any }))}
        >
          <SelectTrigger id="assetClass" className="w-[140px] h-9">
            <SelectValue placeholder="All Assets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            {ASSET_CLASSES.map(ac => (
              <SelectItem key={ac.value} value={ac.value}>{ac.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="strategy" className="text-xs">Strategy</Label>
        <Select 
          value={localFilters.strategy || "all"} 
          onValueChange={(val) => setLocalFilters(prev => ({ ...prev, strategy: val === "all" ? undefined : val }))}
        >
          <SelectTrigger id="strategy" className="w-[140px] h-9">
            <SelectValue placeholder="All Strategies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strategies</SelectItem>
            {strategies.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="emotion" className="text-xs">Emotion</Label>
        <Select 
          value={localFilters.emotionalState || "all"} 
          onValueChange={(val) => setLocalFilters(prev => ({ ...prev, emotionalState: val === "all" ? undefined : val as any }))}
        >
          <SelectTrigger id="emotion" className="w-[140px] h-9">
            <SelectValue placeholder="All Emotions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emotions</SelectItem>
            {EMOTIONAL_STATES.map(es => (
              <SelectItem key={es.value} value={es.value}>{es.emoji} {es.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="direction" className="text-xs">Direction</Label>
        <Select 
          value={localFilters.direction || "all"} 
          onValueChange={(val) => setLocalFilters(prev => ({ ...prev, direction: val === "all" ? undefined : (val as "LONG" | "SHORT") }))}
        >
          <SelectTrigger id="direction" className="w-[120px] h-9">
            <SelectValue placeholder="All Dirs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dirs</SelectItem>
            <SelectItem value="LONG">LONG</SelectItem>
            <SelectItem value="SHORT">SHORT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="dateFrom" className="text-xs">From</Label>
        <Input 
          id="dateFrom" 
          type="date" 
          className="w-[140px] h-9"
          value={localFilters.dateFrom || ""}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="dateTo" className="text-xs">To</Label>
        <Input 
          id="dateTo" 
          type="date" 
          className="w-[140px] h-9"
          value={localFilters.dateTo || ""}
          onChange={(e) => setLocalFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
        />
      </div>

      <div className="flex gap-2 ml-auto">
        <Button variant="outline" size="sm" className="h-9" onClick={handleReset}>
          Reset
        </Button>
        <Button size="sm" className="h-9" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </Card>
  );
}
