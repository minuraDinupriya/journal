"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TradeFormData, CsvParseResult } from '@/types/trade';
import { parseTradesCsv } from '@/lib/parsers/csv-engine';

export function useCsvImport() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<TradeFormData[]>([]);
  const [parseResult, setParseResult] = useState<CsvParseResult<TradeFormData> | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);

  const parseFile = useCallback(async () => {
    if (!file) return;
    
    setIsParsing(true);
    try {
      const text = await file.text();
      const result = await parseTradesCsv(text);
      setParseResult(result);
      setPreview(result.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse CSV file');
    } finally {
      setIsParsing(false);
    }
  }, [file]);

  const importTrades = useCallback(async (targetTradeType: 'LIVE' | 'BACKTEST' = 'LIVE') => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/trades/import?tradeType=${targetTradeType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import trades');
      }

      const result = await response.json();
      setImportResult(result);
      toast.success(`Successfully imported ${result.imported || 0} trades`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import trades');
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setPreview([]);
    setParseResult(null);
    setIsUploading(false);
    setIsParsing(false);
    setImportResult(null);
  }, []);

  return {
    file,
    setFile,
    preview,
    parseResult,
    isUploading,
    isParsing,
    importResult,
    parseFile,
    importTrades,
    reset
  };
}
