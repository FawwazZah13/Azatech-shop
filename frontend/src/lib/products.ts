import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export type ProductSort = "name" | "price" | "stock" | "-name" | "-price" | "-stock";

type ProductListParams = {
  page: number;
  perPage: number;
  search: string;
  sort: ProductSort;
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