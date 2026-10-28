export type Gender = "Pria" | "Wanita";

export type Product = {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: string; // backend mengirim decimal sebagai string, mis. "12000.00"
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string; // UUID
  customer_name: string;
  customer_address: string;
  gender: Gender;
  birth_date: string; // format "YYYY-MM-DD"
  phone: string | null;
  created_at: string;
  updated_at: string;
};