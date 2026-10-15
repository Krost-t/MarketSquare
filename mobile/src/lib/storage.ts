import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "marketsquare_token";
let memoryToken: string | null = null;

export const tokenStorage = {
    async get(): Promise<string | null> {
        if (Platform.OS === "web") return memoryToken;
        return SecureStore.getItemAsync(TOKEN_KEY);
    },
    async set(token: string): Promise<void> {
        if (Platform.OS === "web") {
            memoryToken = token;
            return;
        }
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    },
    async clear(): Promise<void> {
        if (Platform.OS === "web") {
            memoryToken = null;
            return;
        }
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    },
};
