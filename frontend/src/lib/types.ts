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

export type OrderItem = {
  id: number;
  product_id: number;
  product_code: string | null;
  product_name: string | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

export type Order = {
  id: number;
  order_number: string;
  order_date: string;
  total_amount: string;
  customer?: { id: string; customer_name: string };
  created_by?: { id: number; name: string };
  items?: OrderItem[];
};

export type DashboardSummary = {
  total_orders: number;
  total_sales: string;
  top_products: {
    id: number;
    product_code: string;
    product_name: string;
    total_sold: number;
  }[];
  low_stock_products: {
    id: number;
    product_code: string;
    product_name: string;
    stock: number;
  }[];
};