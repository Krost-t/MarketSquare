import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatPrice, type Product, type ProductInput } from "@marketsquare/shared";
import { api, errorMessage } from "../../lib/api.ts";
import { EmptyState, ErrorBox, Field, Pagination, Spinner, Thumb } from "../../components/ui.tsx";
import { useMyShop } from "./useMyShop.ts";

const emptyProduct: ProductInput = { name: "", description: "", price: 0, stock: 0, imageUrl: "", isActive: true };

export function MerchantProductsPage() {
    const { data: shop, isLoading: shopLoading } = useMyShop();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState<Product | "new" | null>(null);

    const products = useQuery({
        queryKey: ["shop-products", shop?.id, page],
        queryFn: () => api.shops.products(shop!.id, { page, limit: 20 }),
        enabled: Boolean(shop),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["shop-products"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
    };

    const remove = useMutation({ mutationFn: (id: string) => api.products.remove(id), onSuccess: invalidate });
    const toggle = useMutation({
        mutationFn: (product: Product) => api.products.update(product.id, { isActive: !product.isActive }),
        onSuccess: invalidate,
    });

    if (shopLoading) return <Spinner />;
    if (!shop) {
        return (
            <EmptyState title="Créez d’abord votre boutique">
                <Link to="/merchant" className="font-medium text-brand-700 hover:underline">Ouvrir ma boutique</Link>
            </EmptyState>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold">Catalogue</h2>
                {!editing && <button className="btn-primary" onClick={() => setEditing("new")}><Plus className="size-4" aria-hidden /> Nouveau produit</button>}
            </div>

            {editing && (
                <ProductForm
                    product={editing === "new" ? undefined : editing}
                    onDone={() => {
                        setEditing(null);
                        invalidate();
                    }}
                />
            )}

            {(remove.error || toggle.error) && <ErrorBox>{errorMessage(remove.error ?? toggle.error)}</ErrorBox>}

            {products.isLoading ? (
                <Spinner />
            ) : products.data?.data.length ? (
                <div className="card overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                            <tr>
                                <th className="px-4 py-3 font-medium">Produit</th>
                                <th className="px-4 py-3 font-medium">Prix</th>
                                <th className="px-4 py-3 font-medium">Stock</th>
                                <th className="px-4 py-3 font-medium">En ligne</th>
                                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                            {products.data.data.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Thumb src={product.imageUrl} alt={product.name} className="size-10 rounded-lg" />
                                            <Link to={`/products/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{formatPrice(product.price)}</td>
                                    <td className={`px-4 py-3 ${product.stock === 0 ? "font-medium text-red-700" : ""}`}>{product.stock}</td>
                                    <td className="px-4 py-3">
                                        <button role="switch" aria-checked={product.isActive} aria-label={`Mettre ${product.name} en ligne`}
                                            onClick={() => toggle.mutate(product)}
                                            className={`relative h-6 w-11 rounded-full transition ${product.isActive ? "bg-brand-600" : "bg-stone-300"}`}>
                                            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${product.isActive ? "left-5.5" : "left-0.5"}`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-2 text-stone-500 hover:text-stone-900" aria-label={`Modifier ${product.name}`}
                                                onClick={() => setEditing(product)}>
                                                <Pencil className="size-4" />
                                            </button>
                                            <button className="p-2 text-stone-500 hover:text-red-600" aria-label={`Supprimer ${product.name}`}
                                                onClick={() => remove.mutate(product.id)}>
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                !editing && <EmptyState title="Aucun produit">Ajoutez votre premier produit pour le rendre visible des clients.</EmptyState>
            )}
            <Pagination pagination={products.data?.pagination} onChange={setPage} />
        </div>
    );
}

function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
    const [form, setForm] = useState<ProductInput>(
        product
            ? {
                  name: product.name,
                  description: product.description ?? "",
                  price: Number(product.price),
                  stock: product.stock,
                  imageUrl: product.imageUrl ?? "",
                  isActive: product.isActive,
              }
            : emptyProduct,
    );

    const mutation = useMutation({
        mutationFn: () => {
            const input = { ...form, description: form.description || null, imageUrl: form.imageUrl || null };
            return product ? api.products.update(product.id, input) : api.products.create(input);
        },
        onSuccess: onDone,
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
            <h3 className="font-display text-lg font-semibold">{product ? `Modifier « ${product.name} »` : "Nouveau produit"}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field label="Nom">
                        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                </div>
                <Field label="Prix (€)">
                    <input className="input" type="number" required min={0.01} step="0.01" value={form.price || ""}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </Field>
                <Field label="Stock">
                    <input className="input" type="number" required min={0} step={1} value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                </Field>
                <div className="sm:col-span-2">
                    <Field label="Description">
                        <textarea className="input min-h-20" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </Field>
                </div>
                <div className="sm:col-span-2">
                    <Field label="Image (URL)">
                        <input className="input" type="url" value={form.imageUrl ?? ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                    </Field>
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-brand-700" checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Visible dans le catalogue
            </label>
            {mutation.error && <ErrorBox>{errorMessage(mutation.error)}</ErrorBox>}
            <div className="flex gap-2">
                <button className="btn-primary" disabled={mutation.isPending}>Enregistrer</button>
                <button type="button" className="btn-ghost" onClick={onDone}>Annuler</button>
            </div>
        </form>
    );
}
