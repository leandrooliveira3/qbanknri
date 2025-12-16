import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,   // 🔥 essencial para offline
      cacheTime: Infinity,   // 🔥 não descarta ao fechar o app
      retry: 1,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  },
});
