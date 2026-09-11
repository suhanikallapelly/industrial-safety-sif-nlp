import { useMutation, useQueryClient } from '@tanstack/react-query'
import { predictSIF, uploadBulk } from '@/lib/api'
import type { PredictRequest } from '@/types'

export function usePredict() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: PredictRequest) => predictSIF(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useBulkUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: File | { file: File; textColumn?: string }) => {
      if (payload instanceof File) {
        return uploadBulk(payload)
      }
      return uploadBulk(payload.file, payload.textColumn)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}
