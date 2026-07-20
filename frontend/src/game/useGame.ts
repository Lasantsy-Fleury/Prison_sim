import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { qk } from '../api/queryKeys';
import { DashboardData } from '../api/types';
import { Building, Guard } from './types';

/** Agrège tout l'état du jeu via React Query. */
export function useGame() {
  const dashboard = useQuery<DashboardData>({
    queryKey: qk.dashboard,
    queryFn: async () => (await api.get('/stats/dashboard')).data,
  });

  const buildings = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: async () => (await api.get('/buildings')).data,
  });

  const guards = useQuery<Guard[]>({
    queryKey: ['guards'],
    queryFn: async () => (await api.get('/guards')).data,
  });

  const inmates = useQuery({
    queryKey: qk.inmates,
    queryFn: async () => (await api.get('/inmates?status=ALL')).data,
  });

  const events = useQuery({
    queryKey: ['game-events'],
    queryFn: async () =>
      (await api.get('/events?page=1&limit=40')).data,
    refetchInterval: 4000,
  });

  return {
    dashboard,
    buildings,
    guards,
    inmates,
    events,
    isLoading:
      dashboard.isLoading ||
      buildings.isLoading ||
      guards.isLoading ||
      inmates.isLoading,
  };
}
