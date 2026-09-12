import Papa from 'papaparse';
import { TradeFormData, CsvParseResult } from '@/types/trade';

export function parseMt5Csv(csvContent: string): CsvParseResult<TradeFormData> {
  const result: CsvParseResult<TradeFormData> = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
  };

  try {
    let parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
    });

    // Check if headers look right, else try semicolon
    if (parsed.meta.fields && !parsed.meta.fields.includes('Time') && !parsed.meta.fields.includes('Symbol')) {
      parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
      });
    }

    if (parsed.errors.length > 0) {
      result.warnings.push(...parsed.errors.map(e => e.message));
    }

    const data: TradeFormData[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row: any = parsed.data[i];
      try {
        const typeStr = (row['Type'] || '').toLowerCase();
        if (typeStr === 'balance' || typeStr === 'credit') {
          continue;
        }

        const symbol = row['Symbol'] || '';
        const positionStr = row['Position'] || row['Ticket'] || '';
        
        let direction: 'LONG' | 'SHORT' = 'LONG';
        if (typeStr === 'sell') direction = 'SHORT';
        else if (typeStr === 'buy') direction = 'LONG';
        else {
          result.warnings.push(`Row ${i + 1}: Unknown type ${typeStr}`);
          continue;
        }

        // Date format: YYYY.MM.DD HH:MM:SS
        const parseMt5Date = (dateStr: string) => {
          if (!dateStr) return new Date();
          const parts = dateStr.split(' ');
          if (parts.length !== 2) return new Date();
          const dateParts = parts[0].split('.');
          const timeParts = parts[1].split(':');
          return new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2])
          );
        };

        const entryDate = parseMt5Date(row['Time']);
        const exitDate = row['Time (close)'] ? parseMt5Date(row['Time (close)']) : undefined;
        
        const commission = Math.abs(parseFloat(row['Commission'] || '0'));
        const swap = Math.abs(parseFloat(row['Swap'] || '0'));
        const fees = commission + swap;

        let assetClass: 'STOCKS' | 'CRYPTO' | 'FOREX' | 'FUTURES' | 'OPTIONS' | 'OTHER' = 'OTHER';
        const upperSymbol = symbol.toUpperCase();
        if (upperSymbol.length === 6 && !upperSymbol.includes('#')) {
          assetClass = 'FOREX';
        }
        if (upperSymbol.startsWith('X') && upperSymbol.length === 6) {
          assetClass = 'FOREX';
        }
        if (upperSymbol.includes('#') || upperSymbol.includes('.CASH')) {
          assetClass = 'STOCKS';
        }
        if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH')) {
          assetClass = 'CRYPTO';
        }
        if (upperSymbol === 'NQ' || upperSymbol === 'ES' || upperSymbol.includes('NQ') || upperSymbol.includes('ES')) {
          assetClass = 'FUTURES';
        }

        const tradeData: TradeFormData = {
          asset: symbol,
          assetClass: assetClass === 'OTHER' ? 'FOREX' : assetClass,
          direction,
          entryDate: entryDate.toISOString(),
          exitDate: exitDate ? exitDate.toISOString() : null,
          entryPrice: parseFloat(row['Price'] || row['Price (open)'] || '0'),
          exitPrice: row['Price (close)'] ? parseFloat(row['Price (close)']) : null,
          size: parseFloat(row['Volume'] || '0'),
          pnl: row['Profit'] ? parseFloat(row['Profit']) : null,
          fees,
          source: 'MT5',
          strategy: null,
          setup: positionStr ? `Ticket: ${positionStr}` : null,
          preTradeNotes: null,
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
    result.errors.push(err.message || 'Failed to parse MT5 CSV');
  }

  return result;
}
