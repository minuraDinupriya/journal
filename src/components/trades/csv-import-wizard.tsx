"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useCsvImport } from "@/hooks/use-csv-import"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function CsvImportWizard() {
  const { parseCsv, importTrades, parsedTrades, isImporting } = useCsvImport()
  
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [file, setFile] = useState<File | null>(null)
  const [broker, setBroker] = useState<"mt5" | "nt8">("mt5")
  const [importResult, setImportResult] = useState<{ imported: number, errors: number } | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  })

  const handleParse = async () => {
    if (!file) return
    const success = await parseCsv(file, broker)
    if (success) setStep(2)
  }

  const handleImport = async () => {
    const result = await importTrades()
    setImportResult(result)
    setStep(3)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Trades via CSV</CardTitle>
        <CardDescription>
          {step === 1 && "Upload your trade history from your broker."}
          {step === 2 && "Review parsed trades before importing."}
          {step === 3 && "Import complete."}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px]">
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Broker Format</label>
              <Select value={broker} onValueChange={(v: "mt5" | "nt8") => setBroker(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select broker format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mt5">MetaTrader 5</SelectItem>
                  <SelectItem value="nt8">NinjaTrader 8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                file ? "bg-muted/50" : ""
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="font-medium">Drag & drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground">or click to select file</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">{parsedTrades.length} trades detected</p>
                <p className="text-sm text-muted-foreground">Please review the first few trades to ensure they were parsed correctly.</p>
              </div>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Dir</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Exit</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedTrades.slice(0, 10).map((trade, i) => (
                    <TableRow key={i}>
                      <TableCell>{trade.asset}</TableCell>
                      <TableCell>{trade.direction}</TableCell>
                      <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{trade.entryPrice}</TableCell>
                      <TableCell>{trade.exitPrice || '-'}</TableCell>
                      <TableCell>{trade.size}</TableCell>
                    </TableRow>
                  ))}
                  {parsedTrades.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                        + {parsedTrades.length - 10} more trades
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === 3 && importResult && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">Import Successful</h3>
            <p className="text-muted-foreground max-w-sm">
              Successfully imported {importResult.imported} trades.
              {importResult.errors > 0 && <span className="text-red-500 block mt-1"><AlertCircle className="w-4 h-4 inline mr-1"/> {importResult.errors} trades failed.</span>}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        {step === 1 && (
          <>
            <div />
            <Button onClick={handleParse} disabled={!file}>
              Continue
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import Trades
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            <Button variant="outline" onClick={() => { setStep(1); setFile(null); }}>
              Import More
            </Button>
            <Button asChild>
              <Link href="/trades">View Trades</Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
