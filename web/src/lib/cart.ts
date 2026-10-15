import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@marketsquare/shared";
import { api } from "./api.ts";
import { useAuth } from "./auth.tsx";

export const CART_QUERY_KEY = ["cart"];

export function useCart() {
    const { user } = useAuth();
    return useQuery({
        queryKey: CART_QUERY_KEY,
        queryFn: () => api.cart.get(),
        enabled: Boolean(user),
    });
}

export function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Cart>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
    });
}
