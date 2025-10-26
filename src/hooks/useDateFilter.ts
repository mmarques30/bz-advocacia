import { useState } from 'react';
import { subDays } from 'date-fns';
import { DashboardFilters } from '@/types/dashboard';

export function useDateFilter() {
  const [filters, setFilters] = useState<DashboardFilters>({
    periodo: '30d',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  const setPreset = (preset: '7d' | '30d' | '90d') => {
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    setFilters({
      ...filters,
      periodo: preset,
      startDate: subDays(new Date(), days),
      endDate: new Date(),
    });
  };

  const setCustomRange = (startDate: Date, endDate: Date) => {
    setFilters({
      ...filters,
      periodo: 'custom',
      startDate,
      endDate,
    });
  };

  const setTipoProcesso = (tipo?: string) => {
    setFilters({ ...filters, tipoProcesso: tipo });
  };

  const setOrigem = (origem?: string) => {
    setFilters({ ...filters, origem });
  };

  const clearFilters = () => {
    setFilters({
      periodo: '30d',
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
    });
  };

  return {
    filters,
    setPreset,
    setCustomRange,
    setTipoProcesso,
    setOrigem,
    clearFilters,
  };
}
