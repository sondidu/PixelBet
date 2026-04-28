import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSimpleContract } from './useSimpleContract'

export function useName() {
  const contract = useSimpleContract()

  return useQuery({
    queryKey: ['name'],
    queryFn: () => contract!.getName(),
    enabled: !!contract,
  })
}

export function useSetName() {
  const contract = useSimpleContract()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const tx = await contract!.setName(name)
      await tx.wait()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['name'] })
    },
  })
}
