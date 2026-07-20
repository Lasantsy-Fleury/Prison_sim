export const qk = {
  prison: ['prison'] as const,
  inmates: ['inmates'] as const,
  inmate: (id: number) => ['inmate', id] as const,
  relations: (id: number) => ['relations', id] as const,
  events: (params: any) => ['events', params] as const,
  series: ['event-series'] as const,
  dashboard: ['dashboard'] as const,
  stats: ['stats'] as const,
};
