import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";

export type OrderInput = {
  customer_id: string;
  items: { product_id: number; quantity: number }[];
};

type OrderListParams = {
  page: number;
  perPage: number;
  from: string;
  to: string;
  customerId: string;
};

export function useOrders(params: OrderListParams, enabled = true) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () =>
      api<Order[]>("/orders", {
        query: {
          page: params.page,
          per_page: params.perPage,
          from: params.from,
          to: params.to,
          customer_id: params.customerId,
        },
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => api<Order>(`/orders/${id}`),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OrderInput) =>
      api<Order>("/orders", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}