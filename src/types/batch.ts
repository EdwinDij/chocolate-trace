export enum BatchStatus {
  STOCK = "stock",
  OUVERT = "ouvert",
  PERIME = "perime",
  NON_CONFORME = "non_conforme",
  EPUISE = "epuise",
}

export interface Batch {
  id: string;
  reference: string;
  product_id: string;
  week_receiving: string;
  week_opening: string | null;
  quantity: number;
  status: string;
  last_status: string | null;
  shop_id: string;
  created_at: string;
  expiration_date: string | null;
  withdrawal_date: string | null;
  products: {
    name: string;
    week_lifetime: number | null;
    category: string | null;
  };
}