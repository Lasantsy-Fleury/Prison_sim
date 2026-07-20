import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
  AdvanceResult,
  DecisionResult,
  DecisionType,
  EconomyBreakdown,
  BuildCatalogItem,
  CreateBuildingPayload,
} from '../api/types';
import { qk } from '../api/queryKeys';

export function useAdvanceDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: number) => {
      const { data } = await api.post<AdvanceResult>('/simulation/advance', { days });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function useApplyDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      type: DecisionType;
      inmateId?: number;
      block?: string;
      amount?: number;
    }) => {
      const { data } = await api.post<DecisionResult>('/decisions', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function useIncreaseSecurity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data } = await api.post<DecisionResult>('/decisions', {
        type: 'INCREASE_SECURITY',
        amount,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useUpgradeBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<DecisionResult>(`/buildings/${id}/upgrade`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings'] }),
  });
}

export function useExpandBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<DecisionResult>(`/buildings/${id}/expand`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['game-events'] });
    },
  });
}

export function useCreateBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBuildingPayload) => {
      const { data } = await api.post('/buildings', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['economy'] });
    },
  });
}

export function useMoveBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, x, y }: { id: number; x: number; y: number }) => {
      const { data } = await api.patch(`/buildings/${id}/position`, { x, y });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings'] }),
  });
}

export function useEconomy() {
  return useQuery<EconomyBreakdown>({
    queryKey: ['economy'],
    queryFn: async () => (await api.get('/economy')).data,
    refetchInterval: 5000,
  });
}

export function useBuildingCatalog() {
  return useQuery<BuildCatalogItem[]>({
    queryKey: ['building-catalog'],
    queryFn: async () => (await api.get('/buildings/catalog')).data,
    staleTime: Infinity,
  });
}

export function useCreateInmate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await api.post('/inmates', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useSeedInmates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (count: number) => {
      const { data } = await api.post('/inmates/seed', { count });
      return data;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useDeleteInmate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/inmates/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
