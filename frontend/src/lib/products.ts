import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export type ProductSort = "name" | "price" | "stock" | "-name" | "-price" | "-stock";

type ProductListParams = {
  page: number;
  perPage: number;
  search: string;
  sort: ProductSort;
};

export type ProductInput = {
  product_code?: string;
  product_name: string;
  stock: number;
  price: number;
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () =>
      api<Product[]>("/products", {
        query: {
          page: params.page,
          per_page: params.perPage,
          search: params.search,
          sort: params.sort,
        },
      }),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => api<Product>(`/products/${id}`),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      api<Product>("/products", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      api<Product>(`/products/${id}`, { method: "PUT", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<null>(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}