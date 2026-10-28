import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, tokenStorage } from "@/lib/api";

export type User = { id: number; name: string; email: string };

type LoginResponse = { token: string; token_type: string; user: User };

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api<LoginResponse>("/auth/login", { method: "POST", body: credentials }),
    onSuccess: (res) => tokenStorage.set(res.data.token),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api<null>("/auth/logout", { method: "POST" }),
    // onSettled jalan baik sukses maupun gagal: user tetap keluar di sisi browser
    onSettled: () => {
      tokenStorage.clear();
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}