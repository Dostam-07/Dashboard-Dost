import { useMemo } from 'react';
import { useAppStore } from '../store';
import { filterComponentData } from '../utils/filterEngine';

export function useDashboardData() {
  const currentPayload = useAppStore((state) => state.currentPayload);
  const filterState = useAppStore((state) => state.filterState);
  const setFilterState = useAppStore((state) => state.setFilterState);
  const resetFilters = useAppStore((state) => state.resetFilters);

  // Compute a centralized record of filteredData arrays for all components reactively.
  const filteredData = useMemo(() => {
    if (!currentPayload) return {};
    const map: Record<string, any[]> = {};
    const filters = currentPayload.filters || [];
    currentPayload.components.forEach((comp) => {
      map[comp.id] = filterComponentData(comp, filters, filterState);
    });
    return map;
  }, [currentPayload, filterState]);

  return {
    currentPayload,
    filterState,
    setFilterState,
    resetFilters,
    filteredData,
  };
}
