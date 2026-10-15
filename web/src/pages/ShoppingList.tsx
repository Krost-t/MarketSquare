import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ForkKnife, ListChecks, NavigationArrow, Plus, Trash } from "@phosphor-icons/react";
import {
    PLACE_CATEGORY_LABELS,
    directionsUrl,
    formatDistance,
    formatPrice,
    openingStatus,
    type PlaceCategory,
    type ShoppingItem,
} from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";
import { useGeo } from "../lib/geo.tsx";
import { useCartMutation } from "../lib/cart.ts";
import { CategoryIcon } from "../components/categories.tsx";
import { LocationPicker } from "../components/LocationPicker.tsx";
import { MapView, type MapPoint } from "../components/MapView.tsx";
import { EmptyState, ErrorBox, Skeleton, Thumb } from "../components/ui.tsx";

const LIST_KEY = ["shopping-list"];
const ORDER: PlaceCategory[] = ["greengrocer", "bakery", "butcher", "seafood", "cheese", "grocery", "wine"];

function ItemRow({ item }: { item: ShoppingItem }) {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: LIST_KEY });
    const toggle = useMutation({ mutationFn: () => api.shoppingList.update(item.id, { checked: !item.checked }), onSuccess: invalidate });
    const remove = useMutation({ mutationFn: () => api.shoppingList.remove(item.id), onSuccess: invalidate });

    return (
        <li className="group flex items-center gap-3 py-2">
            <button
                onClick={() => toggle.mutate()}
                role="checkbox"
                aria-checked={item.checked}
                aria-label={item.label}
                className={`grid size-5 shrink-0 place-items-center rounded-md border transition ${
                    item.checked ? "border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900" : "border-ink-300 hover:border-ink-500 dark:border-ink-600"
                }`}
            >
                {item.checked && <Check size={13} weight="bold" />}
            </button>
            <span className={`min-w-0 flex-1 text-[15px] ${item.checked ? "text-ink-400 line-through" : "text-ink-900 dark:text-white"}`}>
                {item.label}
                {item.source === "meal" && <ForkKnife size={13} className="ml-1.5 inline text-ink-400" aria-label="ajouté depuis un repas" />}
            </span>
            {item.quantity && <span className="num max-w-[9rem] truncate text-xs text-ink-500">{item.quantity}</span>}
            <button
                onClick={() => remove.mutate()}
                className="rounded p-1 text-ink-300 opacity-0 transition group-hover:opacity-100 hover:text-tomato-600 focus-visible:opacity-100"
                aria-label={`Supprimer ${item.label}`}
            >
                <Trash size={16} />
            </button>
        </li>
    );
}

function Plan({ items }: { items: ShoppingItem[] }) {
    const { position } = useGeo();
    const { user } = useAuth();
    const [added, setAdded] = useState<string | null>(null);
    const pending = items.filter((item) => !item.checked);
    const signature = pending.map((item) => item.id).join(",");

    const { data: plan, isLoading, error } = useQuery({
        queryKey: ["shopping-plan", signature, position?.lat, position?.lon],
        queryFn: () => api.shoppingList.plan(position!.lat, position!.lon),
        enabled: Boolean(position && pending.length),
        staleTime: 5 * 60 * 1000,
    });

    const addToCart = useCartMutation((productId: string) => api.cart.add(productId, 1));

    const points = useMemo<MapPoint[]>(() => {
        if (!plan) return [];
        const result = new Map<string, MapPoint>();
        plan.groups.forEach((group) => {
            const best = group.places[0];
            if (best) result.set(best.id, { id: best.id, lat: best.lat, lon: best.lon, name: best.name, category: best.category });
        });
        const partnerIds = new Set(plan.groups.flatMap((group) => group.partnerProducts.map((match) => match.shop.id)));
        plan.partners
            .filter((shop) => partnerIds.has(shop.id))
            .forEach((shop) => result.set(shop.id, { id: shop.id, lat: shop.lat, lon: shop.lon, name: shop.name, category: shop.category, partner: true }));
        return [...result.values()];
    }, [plan]);

    if (!position) {
        return (
            <div className="card p-5">
                <h2 className="text-lg font-semibold">Où faire vos courses ?</h2>
                <p className="mt-1 mb-4 text-sm text-ink-500">Indiquez votre position pour trouver les commerces les plus proches pour chaque article.</p>
                <LocationPicker />
            </div>
        );
    }
    if (pending.length === 0) {
        return <EmptyState title="Rien à acheter">Ajoutez des articles ou planifiez vos repas : nous vous dirons où les trouver.</EmptyState>;
    }

    return (
        <div className="space-y-6">
            <div className="h-72 overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 dark:border-ink-800">
                <MapView center={[position.lat, position.lon]} zoom={15} user={[position.lat, position.lon]} points={points} className="h-full w-full" />
            </div>
            {error && <ErrorBox>{errorMessage(error)}</ErrorBox>}
            {addToCart.error && <ErrorBox>{errorMessage(addToCart.error)}</ErrorBox>}
            {isLoading && <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}

            {plan?.groups.map((group) => {
                const [best, ...others] = group.places;
                const status = openingStatus(best?.openingHours);
                return (
                    <section key={group.category} className="border-t border-ink-200 pt-5 dark:border-ink-800">
                        <div className="flex items-center gap-2">
                            <CategoryIcon category={group.category} size={20} className="text-tomato-600" />
                            <h3 className="text-base font-semibold">{PLACE_CATEGORY_LABELS[group.category]}</h3>
                            <span className="text-sm text-ink-500">{group.items.map((item) => item.label).join(", ")}</span>
                        </div>

                        {best ? (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-ui)] bg-ink-100/70 px-4 py-3 dark:bg-ink-900">
                                <div>
                                    <p className="font-medium text-ink-900 dark:text-white">{best.name}</p>
                                    <p className="text-sm text-ink-500">
                                        <span className="num">{formatDistance(best.distance)}</span>
                                        {status?.isOpen === true && <span className="text-emerald-700 dark:text-emerald-400"> ouvert</span>}
                                        {status?.isOpen === false && <span> fermé maintenant</span>}
                                        {best.address && ` ${best.address}`}
                                    </p>
                                </div>
                                <a className="btn-ghost" href={directionsUrl(best, position)} target="_blank" rel="noreferrer">
                                    <NavigationArrow size={16} aria-hidden /> Y aller
                                </a>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-ink-500">Pas de commerce de ce type à proximité.</p>
                        )}
                        {others.length > 0 && (
                            <p className="mt-2 text-sm text-ink-500">
                                Aussi : {others.map((place) => `${place.name} (${formatDistance(place.distance)})`).join(", ")}
                            </p>
                        )}

                        {group.partnerProducts.length > 0 && (
                            <div className="mt-4">
                                <p className="mb-2 text-sm font-medium">À commander en ligne</p>
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {group.partnerProducts.map((match) => (
                                        <li key={`${match.itemId}-${match.product.id}`} className="flex items-center gap-3 rounded-[var(--radius-ui)] border border-ink-200 p-2 dark:border-ink-800">
                                            <Thumb src={match.product.imageUrl} alt={match.product.name} contain className="size-12 shrink-0 rounded-md" />
                                            <div className="min-w-0 flex-1">
                                                <Link to={`/products/${match.product.id}`} className="block truncate text-sm font-medium hover:underline">{match.product.name}</Link>
                                                <p className="truncate text-xs text-ink-500">{match.shop.name}, <span className="num">{formatDistance(match.shop.distance)}</span></p>
                                            </div>
                                            <span className="num text-sm font-semibold">{formatPrice(match.product.price)}</span>
                                            {user && (
                                                <button
                                                    className="btn-ghost px-2"
                                                    aria-label={`Ajouter ${match.product.name} au panier`}
                                                    disabled={addToCart.isPending}
                                                    onClick={() => addToCart.mutate(match.product.id, { onSuccess: () => setAdded(match.product.id) })}
                                                >
                                                    {added === match.product.id ? <Check size={16} weight="bold" /> : <Plus size={16} />}
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
}

export function ShoppingListPage() {
    const { user, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const [label, setLabel] = useState("");
    const [quantity, setQuantity] = useState("");

    const { data: items, isLoading } = useQuery({ queryKey: LIST_KEY, queryFn: () => api.shoppingList.list(), enabled: Boolean(user) });

    const add = useMutation({
        mutationFn: () => api.shoppingList.add([{ label: label.trim(), quantity: quantity.trim() || null }]),
        onSuccess: (list) => {
            queryClient.setQueryData(LIST_KEY, list);
            setLabel("");
            setQuantity("");
        },
    });
    const clearChecked = useMutation({
        mutationFn: () => api.shoppingList.clearChecked(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
    });

    const grouped = useMemo(() => {
        const groups = new Map<PlaceCategory, ShoppingItem[]>();
        (items ?? []).forEach((item) => groups.set(item.category, [...(groups.get(item.category) ?? []), item]));
        return [...groups.entries()].sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b));
    }, [items]);

    if (authLoading) return null;
    if (!user) {
        return (
            <EmptyState icon={<ListChecks size={32} />} title="Votre liste de courses">
                <Link to="/login" state={{ from: "/liste" }} className="font-medium text-ink-900 underline dark:text-white">Connectez-vous</Link> pour
                garder votre liste et savoir où acheter chaque article autour de vous.
            </EmptyState>
        );
    }

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (label.trim()) add.mutate();
    };
    const checkedCount = items?.filter((item) => item.checked).length ?? 0;

    return (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr]">
            <div>
                <div className="mb-5 flex items-baseline justify-between">
                    <h1 className="text-2xl font-semibold">Ma liste</h1>
                    <Link to="/repas" className="text-sm text-ink-500 hover:text-ink-900 hover:underline dark:hover:text-white">Depuis mes repas</Link>
                </div>

                <form onSubmit={onSubmit} className="flex gap-2">
                    <label className="sr-only" htmlFor="item-label">Article</label>
                    <input id="item-label" className="input flex-1" placeholder="Ex. tomates, pain, comté" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} />
                    <label className="sr-only" htmlFor="item-quantity">Quantité</label>
                    <input id="item-quantity" className="input w-24" placeholder="Qté" value={quantity} onChange={(e) => setQuantity(e.target.value)} maxLength={60} />
                    <button className="btn-primary px-3" aria-label="Ajouter" disabled={add.isPending || !label.trim()}>
                        <Plus size={18} weight="bold" />
                    </button>
                </form>
                {add.error && <div className="mt-3"><ErrorBox>{errorMessage(add.error)}</ErrorBox></div>}

                <div className="mt-6 space-y-6">
                    {isLoading && <Skeleton className="h-40" />}
                    {items?.length === 0 && <p className="text-sm text-ink-500">Votre liste est vide.</p>}
                    {grouped.map(([category, groupItems]) => (
                        <section key={category}>
                            <h2 className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-ink-500 uppercase">
                                <CategoryIcon category={category} size={14} />
                                {PLACE_CATEGORY_LABELS[category]}
                            </h2>
                            <ul className="divide-y divide-ink-100 dark:divide-ink-900">
                                {groupItems.map((item) => <ItemRow key={item.id} item={item} />)}
                            </ul>
                        </section>
                    ))}
                    {checkedCount > 0 && (
                        <button className="text-sm text-ink-500 underline hover:text-ink-900 dark:hover:text-white" onClick={() => clearChecked.mutate()}>
                            Retirer les <span className="num">{checkedCount}</span> articles cochés
                        </button>
                    )}
                </div>
            </div>

            <div>
                <h2 className="mb-5 text-2xl font-semibold">Où acheter</h2>
                <Plan items={items ?? []} />
            </div>
        </div>
    );
}
