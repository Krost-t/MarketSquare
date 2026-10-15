const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const isExpoPushToken = (token: string): boolean =>
    token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");

const sendPushNotification = async (
    pushToken: string | null | undefined,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
): Promise<void> => {
    if (!pushToken || !isExpoPushToken(pushToken) || process.env.NODE_ENV === "test") {
        return;
    }

    try {
        await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ to: pushToken, title, body, data, sound: "default" }),
        });
    } catch (error) {
        console.error("Push notification failed:", error);
    }
};

export { sendPushNotification };
