import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchIncidents, fetchIncidentById, triageIncident } from '@/lib/api'
import type { FilterState, TriageUpdate } from '@/types'

export function useIncidents(filters: FilterState = {}, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['incidents', filters, page, pageSize],
    queryFn: () => fetchIncidents(filters, page, pageSize),
    refetchInterval: 15_000,
    retry: 1,
  })
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetchIncidentById(id),
    enabled: !!id,
  })
}

export function useTriage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: TriageUpdate }) =>
      triageIncident(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
    },
  })
}
