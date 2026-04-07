import { useQuery } from '@tanstack/react-query'
import { api } from '../api/axios'
import type { KpiPeriod, KpiResponse } from '../types'

export function useKpi(period: KpiPeriod) {
  return useQuery<KpiResponse>({
    queryKey: ['kpi', period],
    queryFn: () =>
      api.get<KpiResponse>(`/api/v1/admin/kpi?period=${period}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
