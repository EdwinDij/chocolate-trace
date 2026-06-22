export interface Product {
  id: string;
  name: string;
  category: string | null;
  week_lifetime: number | null;
  expiration_date: string | null;
  barcode: string | null;
  created_at: string;
}
