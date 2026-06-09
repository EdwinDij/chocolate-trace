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
  type_id: string;
  week_receiving: string;
  week_opening: string | null;
  quantity: number;
  status: string;
  last_status: string | null;
  created_at: string;
  chocolate_type: {
    name: string;
    week_lifetime: number;
    type: string;
  };
}
