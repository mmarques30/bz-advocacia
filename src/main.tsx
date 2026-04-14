import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Phase 2.3 — React Query defaults tuned for the BZ Advocacia workload.
// Most data (leads, processes, financial records) changes at human
// cadence, not second-by-second, so we:
//   - keep data "fresh" for 60s to avoid refetch storms on nav,
//   - disable refetch-on-window-focus (the app was refetching every
//     tab switch, hammering Supabase with duplicate queries),
//   - retry queries once on error (network blips) but do not retry
//     mutations (to avoid double writes).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
