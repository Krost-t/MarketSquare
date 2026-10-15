import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "./api";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotifications(): Promise<void> {
    if (Platform.OS === "web" || !Device.isDevice) return;

    try {
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("orders", {
                name: "Commandes",
                importance: Notifications.AndroidImportance.HIGH,
            });
        }

        const { status: existing } = await Notifications.getPermissionsAsync();
        const status = existing === "granted" ? existing : (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted") return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) return;

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        await api.user.setPushToken(token);
    } catch (error) {
        console.warn("Push notifications unavailable:", error);
    }
}

export async function unregisterPushNotifications(): Promise<void> {
    try {
        await api.user.setPushToken(null);
    } catch {
        return;
    }
}
