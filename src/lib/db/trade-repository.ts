import { prisma } from './prisma';
import type { Prisma, Trade } from '@prisma/client';

// Note: Ensure types exist at @/types/trade and @/types/metrics
// For simplicity, we are defining expected input types inline here if they are not yet created,
// but they should be replaced or augmented by the actual types if they differ.
export type TradeFormData = {
  asset: string;
  assetClass: string;
  direction: string;
  entryPrice: number;
  exitPrice?: number | null;
  size: number;
  fees?: number;
  entryDate: string | Date;
  exitDate?: string | Date | null;
  pnl?: number | null;
  strategy?: string | null;
  setup?: string | null;
  preTradeNotes?: string | null;
  postTradeNotes?: string | null;
  emotionalState?: string | null;
  chartImagePath?: string | null;
  tradingViewLink?: string | null;
  source?: string;
  tagIds?: string[];
};

export type TradeFilter = {
  assetClass?: string;
  strategy?: string;
  emotionalState?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  direction?: string;
  source?: string;
};

export async function createTrade(data: TradeFormData & { userId: string }) {
  try {
    const { tagIds, entryDate, exitDate, ...rest } = data;
    
    return await prisma.trade.create({
      data: {
        ...rest,
        direction: rest.direction.toUpperCase(),
        assetClass: rest.assetClass.toUpperCase(),
        entryDate: new Date(entryDate),
        exitDate: exitDate ? new Date(exitDate) : null,
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        } : undefined,
      },
      include: {
        tags: { include: { tag: true } }
      }
    });
  } catch (error) {
    console.error('Error creating trade:', error);
    throw new Error('Failed to create trade.');
  }
}

export async function getTrades(filters?: TradeFilter & { userId: string }) {
  try {
    const where: Prisma.TradeWhereInput = {};
    if (filters) {
      if (filters.userId) where.userId = filters.userId;
      if (filters.assetClass) where.assetClass = filters.assetClass.toUpperCase();
      if (filters.strategy) where.strategy = filters.strategy;
      if (filters.emotionalState) where.emotionalState = filters.emotionalState;
      if (filters.direction) where.direction = filters.direction.toUpperCase();
      if (filters.source) where.source = filters.source;
      
      if (filters.dateFrom || filters.dateTo) {
        where.entryDate = {};
        if (filters.dateFrom) where.entryDate.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.entryDate.lte = new Date(filters.dateTo);
      }
    }

    return await prisma.trade.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      include: {
        tags: { include: { tag: true } }
      }
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    throw new Error('Failed to fetch trades.');
  }
}

export async function getTradeById(id: string) {
  try {
    return await prisma.trade.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } }
      }
    });
  } catch (error) {
    console.error('Error fetching trade by ID:', error);
    throw new Error('Failed to fetch trade.');
  }
}

export async function updateTrade(id: string, data: Partial<TradeFormData>) {
  try {
    const { tagIds, entryDate, exitDate, ...rest } = data;
    const updateData: any = { ...rest };
    
    if (rest.direction) updateData.direction = rest.direction.toUpperCase();
    if (rest.assetClass) updateData.assetClass = rest.assetClass.toUpperCase();
    if (entryDate) updateData.entryDate = new Date(entryDate);
    if (exitDate !== undefined) updateData.exitDate = exitDate ? new Date(exitDate) : null;
    
    if (tagIds !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: tagIds.map(tagId => ({
          tag: { connect: { id: tagId } }
        }))
      };
    }

    return await prisma.trade.update({
      where: { id },
      data: updateData,
      include: {
        tags: { include: { tag: true } }
      }
    });
  } catch (error) {
    console.error('Error updating trade:', error);
    throw new Error('Failed to update trade.');
  }
}

export async function deleteTrade(id: string): Promise<void> {
  try {
    await prisma.trade.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting trade:', error);
    throw new Error('Failed to delete trade.');
  }
}

export async function bulkCreateTrades(trades: (TradeFormData & { userId: string })[]) {
  try {
    const results = await prisma.$transaction(async (tx) => {
      let created = 0;
      let errors: string[] = [];

      for (const [index, tradeData] of trades.entries()) {
        try {
          const { tagIds, entryDate, exitDate, ...rest } = tradeData;
          
          await tx.trade.create({
            data: {
              ...rest,
              direction: rest.direction.toUpperCase(),
              assetClass: rest.assetClass.toUpperCase(),
              entryDate: new Date(entryDate),
              exitDate: exitDate ? new Date(exitDate) : null,
              tags: tagIds && tagIds.length > 0 ? {
                create: tagIds.map(tagId => ({
                  tag: { connect: { id: tagId } }
                }))
              } : undefined,
            }
          });
          created++;
        } catch (err: any) {
          errors.push(`Row ${index + 1}: ${err.message || 'Failed to create'}`);
        }
      }
      return { created, errors };
    });
    
    return results;
  } catch (error: any) {
    console.error('Error in bulk create:', error);
    throw new Error(`Bulk creation failed: ${error.message}`);
  }
}
