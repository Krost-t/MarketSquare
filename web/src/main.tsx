import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./lib/auth.tsx";
import { GeoProvider } from "./lib/geo.tsx";
import { router } from "./router.tsx";
import "./index.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 30 * 1000, refetchOnWindowFocus: false, retry: 1 },
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <GeoProvider>
                    <RouterProvider router={router} />
                </GeoProvider>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
