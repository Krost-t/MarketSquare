import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import { useGeo } from "../lib/geo";
import { Button, ErrorText } from "./ui";
import { colors, ui } from "../theme";

const STATUS_MESSAGES = {
    denied: "Localisation refusée. Autorisez-la dans les réglages ou saisissez une adresse.",
    error: "Impossible de vous localiser. Saisissez une adresse.",
} as const;

export function LocationPicker({ onDone }: { onDone?: () => void }) {
    const { status, locate, setPosition } = useGeo();
    const [query, setQuery] = useState("");
    const [term, setTerm] = useState("");

    const { data, isFetching, error } = useQuery({
        queryKey: ["geocode", term],
        queryFn: () => api.places.geocode(term),
        enabled: term.length >= 3,
        staleTime: 60 * 60 * 1000,
    });

    const locateMe = async () => {
        await locate();
        onDone?.();
    };

    return (
        <View style={{ gap: 10 }}>
            <Button title={status === "locating" ? "Localisation…" : "Utiliser ma position"} onPress={() => void locateMe()} disabled={status === "locating"} />
            {(status === "denied" || status === "error") && <Text style={ui.muted}>{STATUS_MESSAGES[status]}</Text>}
            <Text style={[ui.muted, { textAlign: "center" }]}>ou</Text>
            <View style={ui.row}>
                <TextInput
                    style={[ui.input, { flex: 1 }]}
                    placeholder="Adresse, ville ou code postal"
                    placeholderTextColor={colors.muted}
                    accessibilityLabel="Adresse"
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={() => setTerm(query.trim())}
                    returnKeyType="search"
                />
                <Button title="OK" variant="ghost" onPress={() => setTerm(query.trim())} />
            </View>
            {isFetching && <Text style={ui.muted}>Recherche…</Text>}
            <ErrorText message={error ? errorMessage(error) : null} />
            {term.length >= 3 && !isFetching && data?.length === 0 && <Text style={ui.muted}>Aucune adresse trouvée.</Text>}
            {data?.map((point) => (
                <Pressable
                    key={`${point.lat},${point.lon}`}
                    accessibilityRole="button"
                    style={[ui.card, { paddingVertical: 10 }]}
                    onPress={() => {
                        setPosition({ lat: point.lat, lon: point.lon, label: point.label });
                        setTerm("");
                        setQuery("");
                        onDone?.();
                    }}
                >
                    <Text style={ui.body}>{point.label}</Text>
                </Pressable>
            ))}
        </View>
    );
}
