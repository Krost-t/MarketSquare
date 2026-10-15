import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@marketsquare/shared";
import { api } from "../../lib/api.ts";

export const MY_SHOP_QUERY_KEY = ["my-shop"];

export function useMyShop() {
    return useQuery({
        queryKey: MY_SHOP_QUERY_KEY,
        queryFn: async () => {
            try {
                return await api.shops.mine();
            } catch (error) {
                if (error instanceof ApiError && error.status === 404) return null;
                throw error;
            }
        },
    });
}
