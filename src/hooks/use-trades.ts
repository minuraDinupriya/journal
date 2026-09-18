"use client";

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTradeStore } from '@/stores/trade-store';
import { TradeFormData } from '@/types/trade';
import { TradeFilter } from '@/types/metrics';

export function useTrades() {
  const { 
    trades, 
    isLoading, 
    error, 
    filters,
    setTrades, 
    setLoading, 
    setError,
    addTrade,
    removeTrade,
    updateTradeInStore,
    setFilters,
    resetFilters
  } = useTradeStore();

  const fetchTrades = useCallback(async (customFilters?: TradeFilter) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = customFilters || filters;
      const queryParams = new URLSearchParams();
      
      if (activeFilters.assetClass) queryParams.append('assetClass', activeFilters.assetClass);
      if (activeFilters.strategy) queryParams.append('strategy', activeFilters.strategy);
      if (activeFilters.emotionalState) queryParams.append('emotionalState', activeFilters.emotionalState);
      if (activeFilters.direction) queryParams.append('direction', activeFilters.direction);
      if (activeFilters.source) queryParams.append('source', activeFilters.source);
      if (activeFilters.dateFrom) queryParams.append('dateFrom', activeFilters.dateFrom);
      if (activeFilters.dateTo) queryParams.append('dateTo', activeFilters.dateTo);

      const response = await fetch(`/api/trades?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      
      const data = await response.json();
      setTrades(data);
    } catch (err: any) {
      const message = err.message || 'An error occurred while fetching trades';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters, setTrades, setLoading, setError]);

  const createTrade = useCallback(async (data: TradeFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create trade');
      }

      const newTrade = await response.json();
      addTrade(newTrade);
      toast.success('Trade created successfully');
      return newTrade;
    } catch (err: any) {
      const message = err.message || 'An error occurred while creating the trade';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addTrade, setLoading, setError]);

  const deleteTrade = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/trades/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trade');
      }

      removeTrade(id);
      toast.success('Trade deleted successfully');
    } catch (err: any) {
      const message = err.message || 'An error occurred while deleting the trade';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeTrade, setLoading, setError]);

  const updateTrade = useCallback(async (id: string, data: Partial<TradeFormData>, background: boolean = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/trades/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update trade');
      }

      const updatedTrade = await response.json();
      updateTradeInStore(id, updatedTrade);
      // Optional: don't show toast for background updates if we don't want to spam the user,
      // but the user didn't complain about the toast. Let's keep it or remove it?
      if (!background) toast.success('Trade updated successfully');
      return updatedTrade;
    } catch (err: any) {
      const message = err.message || 'An error occurred while updating the trade';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      if (!background) setLoading(false);
    }
  }, [updateTradeInStore, setLoading, setError]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { 
    trades, 
    isLoading, 
    error, 
    fetchTrades, 
    createTrade, 
    deleteTrade, 
    updateTrade, 
    filters, 
    setFilters, 
    resetFilters 
  };
}
