import { useQuery } from '@tanstack/react-query'
import { fetchAnalytics } from '@/lib/api'

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
