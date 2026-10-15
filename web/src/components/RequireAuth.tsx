import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import type { Role } from "@marketsquare/shared";
import { useAuth } from "../lib/auth.tsx";
import { EmptyState, Spinner } from "./ui.tsx";

export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <Spinner />;

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (roles && !roles.includes(user.role)) {
        return (
            <EmptyState title="Accès refusé">
                Cette page est réservée aux comptes {roles.join(" / ").toLowerCase()}.
            </EmptyState>
        );
    }

    return <>{children}</>;
}
