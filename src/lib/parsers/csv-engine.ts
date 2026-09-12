import { TradeFormData, CsvParseResult } from '@/types/trade';
import { parseMt5Csv } from './mt5-parser';
import { parseNinjaTraderCsv } from './ninjatrader-parser';

export function detectBrokerFormat(csvContent: string): 'MT5' | 'NINJATRADER' | 'UNKNOWN' {
  const firstLine = csvContent.split('\n')[0] || '';
  if (firstLine.includes('Symbol') && (firstLine.includes('Volume') || firstLine.includes('Type')) && firstLine.includes('Profit') && firstLine.includes('Swap')) {
    return 'MT5';
  }
  if (firstLine.includes('Instrument') && firstLine.includes('Market pos.') && firstLine.includes('Entry price')) {
    return 'NINJATRADER';
  }
  return 'UNKNOWN';
}

export function parseTradesCsv(csvContent: string, format?: 'MT5' | 'NINJATRADER'): CsvParseResult<TradeFormData> {
  const actualFormat = format || detectBrokerFormat(csvContent);
  
  if (actualFormat === 'MT5') {
    return parseMt5Csv(csvContent);
  } else if (actualFormat === 'NINJATRADER') {
    return parseNinjaTraderCsv(csvContent);
  }
  
  return {
    success: false,
    data: [],
    errors: ['Unknown CSV format. Please specify the broker or ensure the file is from a supported broker.'],
    warnings: [],
  };
}
