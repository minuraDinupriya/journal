import Papa from 'papaparse';
import { TradeFormData, CsvParseResult } from '@/types/trade';

export function parseNtAmount(value: string): number {
  if (!value) return 0;
  let cleanValue = value.replace(/\$/g, '').replace(/,/g, '').trim();
  if (cleanValue.startsWith('(') && cleanValue.endsWith(')')) {
    cleanValue = '-' + cleanValue.substring(1, cleanValue.length - 1);
  }
  return parseFloat(cleanValue);
}

export function parseNtDateTime(value: string): Date {
  if (!value) return new Date();
  const [datePart, timePart, ampm] = value.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  let [hours, minutes, seconds] = timePart.split(':').map(Number);
  
  if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

export function parseNinjaTraderCsv(csvContent: string): CsvParseResult<TradeFormData> {
  const result: CsvParseResult<TradeFormData> = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
  };

  try {
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      result.warnings.push(...parsed.errors.map(e => e.message));
    }

    const data: TradeFormData[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row: any = parsed.data[i];
      try {
        if (!row['Instrument'] || !row['Entry time']) continue;

        let direction: 'LONG' | 'SHORT' = 'LONG';
        const marketPos = (row['Market pos.'] || '').toLowerCase();
        if (marketPos === 'short') direction = 'SHORT';
        else if (marketPos === 'long') direction = 'LONG';
        
        const instrument = row['Instrument'] || '';
        const asset = instrument.split(' ')[0];
        
        let assetClass: 'STOCKS' | 'CRYPTO' | 'FOREX' | 'FUTURES' | 'OPTIONS' | 'OTHER' = 'FUTURES';
        if (asset.length > 3 && !['ES', 'NQ', 'CL', 'GC'].includes(asset)) {
          assetClass = 'STOCKS';
        }

        const tradeData: TradeFormData = {
          asset,
          assetClass: (assetClass as string) === 'OTHER' ? 'FUTURES' : assetClass,
          direction,
          entryDate: parseNtDateTime(row['Entry time']).toISOString(),
          exitDate: row['Exit time'] ? parseNtDateTime(row['Exit time']).toISOString() : null,
          entryPrice: parseFloat(row['Entry price'] || '0'),
          exitPrice: row['Exit price'] ? parseFloat(row['Exit price']) : null,
          size: parseFloat(row['Qty'] || '0'),
          pnl: row['Profit'] ? parseNtAmount(row['Profit']) : null,
          fees: row['Commission'] ? Math.abs(parseNtAmount(row['Commission'])) : 0,
          source: 'NINJATRADER',
          strategy: row['Strategy'] || null,
          setup: instrument !== asset ? instrument : null,
          preTradeNotes: row['Trade #'] ? `Trade #${row['Trade #']}` : null,
          postTradeNotes: null,
          emotionalState: null,
          chartImagePath: null,
          tradingViewLink: null,
        };

        data.push(tradeData);
      } catch (err: any) {
        result.warnings.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    result.data = data;
    result.success = data.length > 0;
  } catch (err: any) {
    result.errors.push(err.message || 'Failed to parse NinjaTrader CSV');
  }

  return result;
}
