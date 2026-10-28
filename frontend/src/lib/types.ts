export type Product = {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: string; // backend mengirim decimal sebagai string, mis. "12000.00"
  created_at: string;
  updated_at: string;
};