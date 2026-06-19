export interface ShopSummary {
  id: string;
  name: string;
  work: string;
  plan: string;
  stats: {
    total: number;
    alerts: number;
    members: number;
  };
}
