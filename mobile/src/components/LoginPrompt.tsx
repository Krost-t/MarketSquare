import type { ReactNode } from "react";
import { useStackNavigation } from "../hooks";
import { Button, Empty } from "./ui";

export function LoginPrompt({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
    const navigation = useStackNavigation();
    return (
        <Empty icon={icon} title={title}>
            {text}
            <Button title="Se connecter" onPress={() => navigation.navigate("Login")} />
        </Empty>
    );
}
