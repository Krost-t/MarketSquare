import { Text, View } from "react-native";
import type { AddressInput, HousingType } from "@marketsquare/shared";
import { ChipRow, Chip, Input } from "./ui";
import { ui } from "../theme";

export type AddressValue = Omit<AddressInput, "type">;

export const emptyAddress: AddressValue = {
    housingType: "HOUSE",
    streetAddress: "",
    postalCode: "",
    addressLocality: "",
    addressRegion: "",
    addressCountry: "FR",
};

const HOUSING_LABELS: Record<HousingType, string> = {
    HOUSE: "Maison",
    APARTMENT: "Appartement",
    STUDIO: "Studio",
    OFFICE: "Bureau / local",
    OTHER: "Autre",
};

export function AddressFields({ value, onChange, showHousing = true }: { value: AddressValue; onChange: (value: AddressValue) => void; showHousing?: boolean }) {
    const set = (key: keyof AddressValue) => (v: string) => onChange({ ...value, [key]: v });

    return (
        <View style={{ gap: 12 }}>
            <Input label="Adresse" placeholder="12 rue des Lilas" autoComplete="street-address" value={value.streetAddress} onChangeText={set("streetAddress")} />
            <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <Input label="Code postal" keyboardType="number-pad" autoComplete="postal-code" value={value.postalCode} onChangeText={set("postalCode")} />
                </View>
                <View style={{ flex: 1.4 }}>
                    <Input label="Ville" value={value.addressLocality} onChangeText={set("addressLocality")} />
                </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1.4 }}>
                    <Input label="Département / région" value={value.addressRegion} onChangeText={set("addressRegion")} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Pays (ISO)" autoCapitalize="characters" maxLength={2} value={value.addressCountry} onChangeText={(v) => set("addressCountry")(v.toUpperCase())} />
                </View>
            </View>
            {showHousing && (
                <View>
                    <Text style={ui.label}>Type de logement</Text>
                    <ChipRow>
                        {(Object.keys(HOUSING_LABELS) as HousingType[]).map((type) => (
                            <Chip key={type} label={HOUSING_LABELS[type]} active={value.housingType === type} onPress={() => onChange({ ...value, housingType: type })} />
                        ))}
                    </ChipRow>
                </View>
            )}
        </View>
    );
}
