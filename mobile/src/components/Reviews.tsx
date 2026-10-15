import { useState } from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useStackNavigation } from "../hooks";
import { Button, ErrorText, Input, LinkText, Rating, StarInput } from "./ui";
import { colors, fonts, ui } from "../theme";

export function Reviews({ target, ownerId }: { target: { productId: string } | { shopId: string }; ownerId?: string }) {
    const { user } = useAuth();
    const navigation = useStackNavigation();
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const isProduct = "productId" in target;
    const targetId = isProduct ? target.productId : target.shopId;

    const { data } = useQuery({
        queryKey: ["reviews", targetId],
        queryFn: () => (isProduct ? api.products.reviews(targetId, { limit: 20 }) : api.shops.reviews(targetId, { limit: 20 })),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["reviews", targetId] });
        queryClient.invalidateQueries({ queryKey: [isProduct ? "product" : "shop", targetId] });
    };

    const create = useMutation({
        mutationFn: () => api.reviews.create({ ...target, rating, comment: comment || null }),
        onSuccess: () => {
            setComment("");
            invalidate();
        },
    });
    const remove = useMutation({ mutationFn: (id: string) => api.reviews.remove(id), onSuccess: invalidate });

    const alreadyReviewed = data?.data.some((review) => review.authorId === user?.id);
    const canReview = user && user.id !== ownerId && !alreadyReviewed;

    return (
        <View style={{ gap: 12 }}>
            <Text style={[ui.title, { fontSize: 20 }]}>Avis</Text>

            {canReview && (
                <View style={[ui.card, { gap: 10 }]}>
                    <Text style={{ fontFamily: fonts.medium, color: colors.text }}>Votre avis</Text>
                    <StarInput value={rating} onChange={setRating} />
                    <Input label="Commentaire" placeholder="Partagez votre expérience (facultatif)" value={comment} onChangeText={setComment} multiline maxLength={2000} />
                    <ErrorText message={create.error ? errorMessage(create.error) : null} />
                    <Button title="Publier" disabled={create.isPending} onPress={() => create.mutate()} />
                </View>
            )}
            {!user && (
                <Text style={ui.muted}>
                    <LinkText onPress={() => navigation.navigate("Login")}>Connectez-vous</LinkText> pour laisser un avis.
                </Text>
            )}

            {data?.data.length ? (
                data.data.map((review) => (
                    <View key={review.id} style={{ gap: 4, paddingVertical: 12, borderTopWidth: 1, borderColor: colors.borderSoft }}>
                        <View style={[ui.row, { justifyContent: "space-between" }]}>
                            <View style={ui.row}>
                                <Text style={{ fontFamily: fonts.medium, color: colors.text }}>{review.author?.username}</Text>
                                <Rating value={review.rating} />
                            </View>
                            <Text style={[ui.muted, { fontSize: 12 }]}>{formatDate(review.createdAt)}</Text>
                        </View>
                        {review.comment ? <Text style={ui.body}>{review.comment}</Text> : null}
                        {review.authorId === user?.id && (
                            <Text accessibilityRole="button" style={{ color: colors.danger, fontSize: 12, fontFamily: fonts.medium }} onPress={() => remove.mutate(review.id)}>
                                Supprimer mon avis
                            </Text>
                        )}
                    </View>
                ))
            ) : (
                <Text style={ui.muted}>Aucun avis pour le moment.</Text>
            )}
        </View>
    );
}
