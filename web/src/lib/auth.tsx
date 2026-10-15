import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, type RegisterInput, type User } from "@marketsquare/shared";
import { api } from "./api.ts";

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (input: RegisterInput) => Promise<User>;
    logout: () => Promise<void>;
    refresh: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const ME_QUERY_KEY = ["me"];

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery({
        queryKey: ME_QUERY_KEY,
        queryFn: async () => {
            try {
                return await api.user.profile();
            } catch (error) {
                if (error instanceof ApiError && error.status === 401) return null;
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });

    const value: AuthContextValue = {
        user: user ?? null,
        isLoading,
        login: async (email, password) => {
            await api.auth.login(email, password);
            const me = await api.user.profile();
            queryClient.clear();
            queryClient.setQueryData(ME_QUERY_KEY, me);
            return me;
        },
        register: async (input) => {
            await api.auth.register(input);
            const me = await api.user.profile();
            queryClient.clear();
            queryClient.setQueryData(ME_QUERY_KEY, me);
            return me;
        },
        logout: async () => {
            await api.auth.logout();
            queryClient.clear();
            queryClient.setQueryData(ME_QUERY_KEY, null);
        },
        refresh,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
    return context;
}
