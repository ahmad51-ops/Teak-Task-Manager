import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s — avoids refetch storms when quickly navigating between pages
      retry: (failureCount, error) => {
        // Retrying a 401/403/404 just burns time — the request will
        // fail the same way every time. Only worth retrying transient
        // problems: network drops, timeouts, or a 5xx from the server.
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      // Deliberately no retry for POST/PATCH/DELETE — this is already
      // React Query's default, but stated explicitly: silently retrying
      // a failed "create task" or "delete project" risks duplicating a
      // side effect the user didn't ask for twice. Failed mutations
      // surface their error and let the user decide to retry manually.
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
