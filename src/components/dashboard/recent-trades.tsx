"use client";

import { Trade } from "@/types/trade";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface RecentTradesProps {
  trades: Trade[];
  isLoading: boolean;
}

export function RecentTrades({ trades, isLoading }: RecentTradesProps) {
  const sortedTrades = [...trades].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sortedTrades.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
            <p className="mb-4">No recent trades found.</p>
            <Link href="/trades/new">
              <Button variant="outline">Add a Trade</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Emotion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => (
                  <TableRow key={trade.id} className="cursor-pointer group relative">
                    <TableCell>
                      <Link href={`/trades/${trade.id}`} className="absolute inset-0" />
                      {format(new Date(trade.entryDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{trade.asset}</TableCell>
                    <TableCell>
                      <Badge variant={trade.direction === "LONG" ? "default" : "destructive"} className={cn(
                        trade.direction === "LONG" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20",
                        "border-transparent"
                      )}>
                        {trade.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>{trade.exitPrice?.toFixed(2) || "-"}</TableCell>
                    <TableCell className={cn(
                      "font-medium",
                      trade.pnl && trade.pnl > 0 ? "text-green-500" : trade.pnl && trade.pnl < 0 ? "text-red-500" : ""
                    )}>
                      {trade.pnl ? formatCurrency(trade.pnl) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{trade.strategy || "-"}</Badge>
                    </TableCell>
                    <TableCell className="flex items-center justify-between">
                      <span>{trade.emotionalState || "-"}</span>
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
