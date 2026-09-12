"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CsvImportWizard } from "@/components/trades/csv-import-wizard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ImportTradesPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Import Trades</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CsvImportWizard />
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Export Instructions</CardTitle>
              <CardDescription>How to get your CSV file</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mt5">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mt5">MetaTrader 5</TabsTrigger>
                  <TabsTrigger value="nt8">NinjaTrader</TabsTrigger>
                </TabsList>
                <TabsContent value="mt5" className="space-y-4 pt-4 text-sm">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Open MT5 and go to the <strong>Toolbox</strong> window (Ctrl+T)</li>
                    <li>Click on the <strong>History</strong> tab</li>
                    <li>Right-click anywhere in the history tab</li>
                    <li>Select <strong>Report</strong> &gt; <strong>Open XML</strong> (or Excel)</li>
                    <li>Save the file and upload it here</li>
                  </ol>
                  <div className="text-xs text-muted-foreground mt-4 bg-muted p-3 rounded-md">
                    Note: We automatically extract positions, ignoring deposits/withdrawals.
                  </div>
                </TabsContent>
                <TabsContent value="nt8" className="space-y-4 pt-4 text-sm">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Open NinjaTrader 8</li>
                    <li>Go to <strong>New</strong> &gt; <strong>Trade Performance</strong></li>
                    <li>Generate the report for your desired date range</li>
                    <li>Right-click on the <strong>Trades</strong> tab</li>
                    <li>Select <strong>Export</strong> and choose CSV format</li>
                    <li>Upload the generated CSV file here</li>
                  </ol>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
