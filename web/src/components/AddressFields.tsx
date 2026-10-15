import type { AddressInput, HousingType } from "@marketsquare/shared";
import { Field } from "./ui.tsx";

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

export function AddressFields({ value, onChange, showHousing = true }: {
    value: AddressValue;
    onChange: (value: AddressValue) => void;
    showHousing?: boolean;
}) {
    const set = (key: keyof AddressValue, v: string) => onChange({ ...value, [key]: v });

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <Field label="Adresse">
                    <input className="input" required autoComplete="street-address" placeholder="12 rue des Lilas"
                        value={value.streetAddress} onChange={(e) => set("streetAddress", e.target.value)} />
                </Field>
            </div>
            <Field label="Code postal">
                <input className="input" required autoComplete="postal-code" value={value.postalCode}
                    onChange={(e) => set("postalCode", e.target.value)} />
            </Field>
            <Field label="Ville">
                <input className="input" required autoComplete="address-level2" value={value.addressLocality}
                    onChange={(e) => set("addressLocality", e.target.value)} />
            </Field>
            <Field label="Département / région">
                <input className="input" required autoComplete="address-level1" value={value.addressRegion}
                    onChange={(e) => set("addressRegion", e.target.value)} />
            </Field>
            <Field label="Pays (code ISO)">
                <input className="input uppercase" required maxLength={2} minLength={2} value={value.addressCountry}
                    onChange={(e) => set("addressCountry", e.target.value.toUpperCase())} />
            </Field>
            {showHousing && (
                <Field label="Type de logement">
                    <select className="input" value={value.housingType} onChange={(e) => set("housingType", e.target.value)}>
                        {(Object.keys(HOUSING_LABELS) as HousingType[]).map((type) => (
                            <option key={type} value={type}>{HOUSING_LABELS[type]}</option>
                        ))}
                    </select>
                </Field>
            )}
        </div>
    );
}
