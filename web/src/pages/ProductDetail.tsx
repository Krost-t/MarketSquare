import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, Minus, Plus, ShoppingBasket } from "lucide-react";
import { formatPrice } from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";
import { useCartMutation } from "../lib/cart.ts";
import { Reviews } from "../components/Reviews.tsx";
import { ErrorBox, Spinner, Stars, SuccessBox, Thumb } from "../components/ui.tsx";

export function ProductDetailPage() {
    const { id = "" } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ["product", id, user?.id],
        queryFn: () => api.products.get(id),
    });

    const addToCart = useCartMutation(() => api.cart.add(id, quantity));

    const toggleFavorite = useMutation({
        mutationFn: () => (product?.isFavorite ? api.user.removeFavorite(id) : api.user.addFavorite(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
        },
    });

    if (isLoading) return <Spinner />;
    if (error || !product) return <ErrorBox>{errorMessage(error) || "Produit introuvable"}</ErrorBox>;

    const outOfStock = product.stock <= 0;
    const isOwner = user?.id === product.shop?.merchantId;

    const onAdd = () => {
        if (!user) {
            navigate("/login", { state: { from: `/products/${id}` } });
            return;
        }
        setAdded(false);
        addToCart.mutate(undefined, { onSuccess: () => setAdded(true) });
    };

    return (
        <div className="space-y-16">
            <div className="grid gap-10 lg:grid-cols-2">
                <Thumb src={product.imageUrl} alt={product.name} className="aspect-square w-full rounded-2xl" />

                <div className="flex flex-col gap-5">
                    {product.shop && (
                        <Link to={`/shops/${product.shop.id}`} className="text-sm font-medium uppercase tracking-wide text-brand-700 hover:underline">
                            {product.shop.name}
                        </Link>
                    )}
                    <h1 className="font-display text-4xl font-semibold">{product.name}</h1>
                    <Stars value={product.averageRating} count={product.reviewCount} size="md" />
                    <p className="text-3xl font-semibold">{formatPrice(product.price)}</p>
                    {product.description && <p className="text-stone-700">{product.description}</p>}

                    <p className={`text-sm font-medium ${outOfStock ? "text-red-700" : "text-brand-700"}`}>
                        {outOfStock ? "Épuisé" : product.stock <= 5 ? `Plus que ${product.stock} en stock` : "En stock"}
                    </p>
                    {!product.isActive && <p className="text-sm text-amber-700">Produit désactivé (visible uniquement par vous)</p>}

                    {!isOwner && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center rounded-lg border border-stone-300 bg-white">
                                <button className="p-2.5 disabled:opacity-40" aria-label="Diminuer la quantité"
                                    disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}>
                                    <Minus className="size-4" />
                                </button>
                                <span className="w-10 text-center font-medium" aria-live="polite">{quantity}</span>
                                <button className="p-2.5 disabled:opacity-40" aria-label="Augmenter la quantité"
                                    disabled={quantity >= product.stock} onClick={() => setQuantity(quantity + 1)}>
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            <button className="btn-primary" disabled={outOfStock || addToCart.isPending} onClick={onAdd}>
                                <ShoppingBasket className="size-4" aria-hidden /> Ajouter au panier
                            </button>
                            {user && (
                                <button className="btn-ghost" onClick={() => toggleFavorite.mutate()} aria-pressed={product.isFavorite}
                                    aria-label={product.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
                                    <Heart className={`size-4 ${product.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                                </button>
                            )}
                        </div>
                    )}
                    {addToCart.error && <ErrorBox>{errorMessage(addToCart.error)}</ErrorBox>}
                    {added && (
                        <SuccessBox>
                            Ajouté au panier. <Link to="/cart" className="font-medium underline">Voir le panier</Link>
                        </SuccessBox>
                    )}

                    {product.shop?.address && (
                        <div className="card mt-2 p-4 text-sm text-stone-600">
                            <p className="flex items-center gap-2 font-medium text-stone-800">
                                <MapPin className="size-4 text-brand-700" aria-hidden /> Retrait possible en boutique
                            </p>
                            <p className="mt-1">
                                {product.shop.address.streetAddress}, {product.shop.address.postalCode} {product.shop.address.addressLocality}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Reviews target={{ productId: id }} ownerId={product.shop?.merchantId} />
        </div>
    );
}
