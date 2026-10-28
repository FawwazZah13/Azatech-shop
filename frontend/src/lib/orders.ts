import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";

export type OrderInput = {
  customer_id: string;
  items: { product_id: number; quantity: number }[];
};

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OrderInput) =>
      api<Order>("/orders", { method: "POST", body: input }),
    onSuccess: () => {
      // Order baru mengubah stok produk, daftar order, dan angka dashboard
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}