import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RegisterInput, User } from "@marketsquare/shared";
import { api, setUnauthorizedHandler } from "./api";
import { tokenStorage } from "./storage";
import { registerForPushNotifications, unregisterPushNotifications } from "./notifications";

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const reset = useCallback(async () => {
        await tokenStorage.clear();
        queryClient.clear();
        setUser(null);
    }, [queryClient]);

    useEffect(() => {
        setUnauthorizedHandler(() => void reset());
        (async () => {
            try {
                if (await tokenStorage.get()) {
                    setUser(await api.user.profile());
                    void registerForPushNotifications();
                }
            } catch {
                await tokenStorage.clear();
            } finally {
                setIsLoading(false);
            }
        })();
        return () => setUnauthorizedHandler(null);
    }, [reset]);

    const startSession = async (token: string) => {
        await tokenStorage.set(token);
        queryClient.clear();
        setUser(await api.user.profile());
        void registerForPushNotifications();
    };

    const value: AuthContextValue = {
        user,
        isLoading,
        login: async (email, password) => {
            const { token } = await api.auth.login(email, password);
            await startSession(token);
        },
        register: async (input) => {
            const { token } = await api.auth.register(input);
            await startSession(token);
        },
        refreshUser: async () => {
            setUser(await api.user.profile());
        },
        logout: async () => {
            await unregisterPushNotifications();
            await api.auth.logout().catch(() => undefined);
            await reset();
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
    return context;
}
