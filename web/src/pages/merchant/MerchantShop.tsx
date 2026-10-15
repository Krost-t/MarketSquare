import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { formatPrice, type Shop } from "@marketsquare/shared";
import { api, errorMessage } from "../../lib/api.ts";
import { ME_QUERY_KEY } from "../../lib/auth.tsx";
import { AddressFields, emptyAddress, type AddressValue } from "../../components/AddressFields.tsx";
import { ErrorBox, Field, Spinner, Stars, SuccessBox } from "../../components/ui.tsx";
import { MY_SHOP_QUERY_KEY, useMyShop } from "./useMyShop.ts";

export function MerchantShopPage() {
    const { data: shop, isLoading } = useMyShop();

    if (isLoading) return <Spinner />;

    if (!shop) {
        return (
            <div className="max-w-2xl">
                <h2 className="mb-2 font-display text-2xl font-semibold">Ouvrez votre boutique</h2>
                <p className="mb-6 text-stone-600">Présentez votre commerce : vos clients pourront ensuite commander en ligne.</p>
                <ShopForm />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <Stats shop={shop} />
            <div className="max-w-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-2xl font-semibold">Informations</h2>
                    <Link to={`/shops/${shop.id}`} className="btn-ghost"><ExternalLink className="size-4" aria-hidden /> Voir ma vitrine</Link>
                </div>
                <ShopForm shop={shop} />
            </div>
        </div>
    );
}

function Stats({ shop }: { shop: Shop }) {
    const { data } = useQuery({ queryKey: ["shop-orders", "stats"], queryFn: () => api.orders.shopOrders({ limit: 100 }) });

    const orders = data?.data ?? [];
    const active = orders.filter((o) => !["CANCELLED", "RETURNED"].includes(o.status));
    const revenue = active.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const toProcess = orders.filter((o) => ["PENDING", "PAID", "PREPARING"].includes(o.status)).length;

    const tiles = [
        { label: "Commandes", value: String(data?.pagination.total ?? 0) },
        { label: "À traiter", value: String(toProcess) },
        { label: "Chiffre d’affaires", value: formatPrice(revenue) },
        { label: "Produits en ligne", value: String(shop._count?.products ?? 0) },
    ];

    return (
        <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl font-semibold">{shop.name}</h2>
                <Stars value={shop.averageRating} count={shop.reviewCount} />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {tiles.map((tile) => (
                    <div key={tile.label} className="card p-5">
                        <p className="text-sm text-stone-500">{tile.label}</p>
                        <p className="mt-1 text-2xl font-semibold">{tile.value}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ShopForm({ shop }: { shop?: Shop }) {
    const queryClient = useQueryClient();
    const [name, setName] = useState(shop?.name ?? "");
    const [description, setDescription] = useState(shop?.description ?? "");
    const [imageUrl, setImageUrl] = useState(shop?.imageUrl ?? "");
    const [address, setAddress] = useState<AddressValue>(
        shop?.address
            ? {
                  housingType: shop.address.housingType,
                  streetAddress: shop.address.streetAddress,
                  postalCode: shop.address.postalCode,
                  addressLocality: shop.address.addressLocality,
                  addressRegion: shop.address.addressRegion,
                  addressCountry: shop.address.addressCountry,
              }
            : { ...emptyAddress, housingType: "OFFICE" },
    );

    const mutation = useMutation({
        mutationFn: () => {
            const input = { name, description: description || null, imageUrl: imageUrl || null, address };
            return shop ? api.shops.update(shop.id, input) : api.shops.create(input);
        },
        onSuccess: (saved) => {
            queryClient.setQueryData(MY_SHOP_QUERY_KEY, saved);
            queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["shops"] });
        },
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <form onSubmit={onSubmit} className="card space-y-5 p-6">
            <Field label="Nom de la boutique">
                <input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Description">
                <textarea className="input min-h-24" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field label="Image (URL)">
                <input className="input" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </Field>
            <fieldset className="space-y-3">
                <legend className="font-medium">Adresse de retrait</legend>
                <AddressFields value={address} onChange={setAddress} showHousing={false} />
            </fieldset>
            {mutation.error && <ErrorBox>{errorMessage(mutation.error)}</ErrorBox>}
            {mutation.isSuccess && shop && <SuccessBox>Boutique mise à jour.</SuccessBox>}
            <button className="btn-primary" disabled={mutation.isPending}>{shop ? "Enregistrer" : "Créer ma boutique"}</button>
        </form>
    );
}
