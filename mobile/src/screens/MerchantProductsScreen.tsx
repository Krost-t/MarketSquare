import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice, type Product, type ProductInput } from "@marketsquare/shared";
import { Package, PencilSimple, Plus, Trash } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useMyShop } from "../lib/myShop";
import { useStackNavigation } from "../hooks";
import { Button, Empty, ErrorText, Input, Loading, Thumb } from "../components/ui";
import { colors, fonts, ui } from "../theme";

const emptyProduct: ProductInput = { name: "", description: "", price: 0, stock: 0, imageUrl: "", isActive: true };

function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
    const [form, setForm] = useState<ProductInput>(
        product
            ? { name: product.name, description: product.description ?? "", price: Number(product.price), stock: product.stock, imageUrl: product.imageUrl ?? "", isActive: product.isActive }
            : emptyProduct,
    );
    const [price, setPrice] = useState(product ? String(product.price) : "");
    const [stock, setStock] = useState(product ? String(product.stock) : "0");

    const mutation = useMutation({
        mutationFn: () => {
            const input = {
                ...form,
                price: Number(price.replace(",", ".")),
                stock: Number(stock),
                description: form.description || null,
                imageUrl: form.imageUrl || null,
            };
            return product ? api.products.update(product.id, input) : api.products.create(input);
        },
        onSuccess: onDone,
    });

    return (
        <View style={[ui.card, { gap: 12 }]}>
            <Text style={[ui.title, { fontSize: 18 }]}>{product ? `Modifier « ${product.name} »` : "Nouveau produit"}</Text>
            <Input label="Nom" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
            <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><Input label="Prix (€)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} /></View>
                <View style={{ flex: 1 }}><Input label="Stock" keyboardType="number-pad" value={stock} onChangeText={setStock} /></View>
            </View>
            <Input label="Description" multiline value={form.description ?? ""} onChangeText={(description) => setForm({ ...form, description })} />
            <Input label="Image (URL)" autoCapitalize="none" keyboardType="url" value={form.imageUrl ?? ""} onChangeText={(imageUrl) => setForm({ ...form, imageUrl })} />
            <View style={[ui.row, { justifyContent: "space-between" }]}>
                <Text style={ui.body}>Visible dans le catalogue</Text>
                <Switch value={form.isActive} onValueChange={(isActive) => setForm({ ...form, isActive })} trackColor={{ true: colors.text, false: colors.border }} thumbColor="#fff" />
            </View>
            <ErrorText message={mutation.error ? errorMessage(mutation.error) : null} />
            <View style={ui.row}>
                <View style={{ flex: 1 }}><Button title="Enregistrer" disabled={mutation.isPending || !form.name || !price} onPress={() => mutation.mutate()} /></View>
                <Button title="Annuler" variant="ghost" onPress={onDone} />
            </View>
        </View>
    );
}

export function MerchantProductsScreen() {
    const navigation = useStackNavigation();
    const queryClient = useQueryClient();
    const { data: shop, isLoading: shopLoading } = useMyShop();
    const [editing, setEditing] = useState<Product | "new" | null>(null);

    const products = useQuery({
        queryKey: ["shop-products", shop?.id, "merchant"],
        queryFn: () => api.shops.products(shop!.id, { limit: 100 }),
        enabled: Boolean(shop),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["shop-products"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
    };
    const remove = useMutation({ mutationFn: (id: string) => api.products.remove(id), onSuccess: invalidate });
    const toggle = useMutation({ mutationFn: (product: Product) => api.products.update(product.id, { isActive: !product.isActive }), onSuccess: invalidate });

    if (shopLoading) return <Loading />;
    if (!shop) {
        return (
            <Empty title="Créez d’abord votre boutique">
                <Button title="Ouvrir ma boutique" onPress={() => navigation.navigate("MerchantShop")} />
            </Empty>
        );
    }

    return (
        <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={[ui.content, { gap: 14 }]} keyboardShouldPersistTaps="handled">
                {editing ? (
                    <ProductForm
                        product={editing === "new" ? undefined : editing}
                        onDone={() => {
                            setEditing(null);
                            invalidate();
                        }}
                    />
                ) : (
                    <Button title="Nouveau produit" icon={<Plus size={16} color="#fff" />} onPress={() => setEditing("new")} />
                )}

                <ErrorText message={remove.error || toggle.error ? errorMessage(remove.error ?? toggle.error) : null} />

                {products.isLoading ? (
                    <Loading />
                ) : products.data?.data.length ? (
                    <View style={[ui.card, { padding: 0, overflow: "hidden" }]}>
                        {products.data.data.map((product, index) => (
                            <View key={product.id} style={[ui.row, { padding: 12, gap: 12 }, index > 0 && { borderTopWidth: 1, borderColor: colors.borderSoft }]}>
                                <Thumb uri={product.imageUrl} size={44} contain />
                                <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate("Product", { id: product.id, name: product.name })}>
                                    <Text style={{ fontFamily: fonts.medium, color: colors.text }} numberOfLines={1}>{product.name}</Text>
                                    <Text style={[ui.muted, { fontSize: 12 }, product.stock === 0 && { color: colors.danger }]}>
                                        {formatPrice(product.price)} · stock {product.stock}
                                    </Text>
                                </Pressable>
                                <Switch
                                    value={product.isActive}
                                    onValueChange={() => toggle.mutate(product)}
                                    trackColor={{ true: colors.text, false: colors.border }}
                                    thumbColor="#fff"
                                    accessibilityLabel={`Mettre ${product.name} en ligne`}
                                />
                                <Pressable accessibilityRole="button" accessibilityLabel={`Modifier ${product.name}`} onPress={() => setEditing(product)} hitSlop={6}>
                                    <PencilSimple size={18} color={colors.muted} />
                                </Pressable>
                                <Pressable accessibilityRole="button" accessibilityLabel={`Supprimer ${product.name}`} onPress={() => remove.mutate(product.id)} hitSlop={6}>
                                    <Trash size={18} color={colors.faint} />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                ) : (
                    !editing && <Empty icon={<Package size={36} color={colors.text} />} title="Aucun produit">Ajoutez votre premier produit pour le rendre visible des clients.</Empty>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
