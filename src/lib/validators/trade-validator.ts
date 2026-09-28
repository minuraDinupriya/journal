import { z } from 'zod';

export const tradeFormSchema = z.object({
  asset: z.string().optional().default(""),
  assetClass: z.string().optional().default("FOREX"),
  direction: z.enum(['LONG', 'SHORT']),
  entryPrice: z.number().nonnegative().optional().default(0),
  exitPrice: z.number().nonnegative().nullable().optional(),
  stopLoss: z.number().nonnegative().nullable().optional(),
  realizedRr: z.number().nullable().optional(),
  size: z.number().nonnegative().optional().default(0),
  fees: z.number().nonnegative().default(0),
  entryDate: z.union([z.string(), z.date()]),
  exitDate: z.union([z.string(), z.date()]).nullable().optional(),
  pnl: z.number().nullable().optional(),
  strategy: z.string().nullable().optional(),
  setup: z.string().nullable().optional(),
  preTradeNotes: z.string().nullable().optional(),
  duringTradeNotes: z.string().nullable().optional(),
  postTradeNotes: z.string().nullable().optional(),
  emotionalState: z.string().nullable().optional(),
  chartImages: z.array(z.string()).optional(),
  tradingViewLink: z.union([z.literal(""), z.string().url()]).nullable().optional(),
  source: z.string().default('MANUAL'),
  tradeType: z.enum(['LIVE', 'BACKTEST']).default('LIVE'),
  isReviewed: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const csvTradeSchema = z.object({
  asset: z.string().min(1),
  assetClass: z.string().min(1),
  direction: z.string().transform(v => v.toUpperCase()),
  entryPrice: z.coerce.number().positive(),
  exitPrice: z.coerce.number().positive().nullable().optional(),
  size: z.coerce.number().positive(),
  fees: z.coerce.number().nonnegative().default(0),
  entryDate: z.string(),
  exitDate: z.string().nullable().optional(),
  pnl: z.coerce.number().nullable().optional(),
  tradeType: z.enum(['LIVE', 'BACKTEST']).optional().default('LIVE'),
});

export const journalEntrySchema = z.object({
  date: z.union([z.string(), z.date()]),
  content: z.string().min(1, "Content cannot be empty"),
  mood: z.number().min(1).max(5).default(3),
  images: z.array(z.string()).optional(),
});

export const tradeFilterSchema = z.object({
  assetClass: z.string().optional(),
  strategy: z.string().optional(),
  emotionalState: z.string().optional(),
  dateFrom: z.union([z.string(), z.date()]).optional(),
  dateTo: z.union([z.string(), z.date()]).optional(),
  direction: z.string().optional(),
  source: z.string().optional(),
  tradeType: z.string().optional(),
});

export type TradeFormData = z.infer<typeof tradeFormSchema>;
export type CsvTrade = z.infer<typeof csvTradeSchema>;
export type JournalFormData = z.infer<typeof journalEntrySchema>;
export type TradeFilter = z.infer<typeof tradeFilterSchema>;
