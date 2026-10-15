import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate, type Paginated, type Review } from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";
import { ErrorBox, Pagination, StarInput, Stars } from "./ui.tsx";

interface ReviewsProps {
    target: { productId: string } | { shopId: string };
    ownerId?: string;
}

export function Reviews({ target, ownerId }: ReviewsProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const isProduct = "productId" in target;
    const targetId = isProduct ? target.productId : target.shopId;
    const queryKey = ["reviews", targetId, page];

    const { data } = useQuery<Paginated<Review>>({
        queryKey,
        queryFn: () => (isProduct ? api.products.reviews(targetId, { page, limit: 5 }) : api.shops.reviews(targetId, { page, limit: 5 })),
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

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        create.mutate();
    };

    return (
        <section className="space-y-6">
            <h2 className="font-display text-2xl font-semibold">Avis</h2>

            {canReview && (
                <form onSubmit={onSubmit} className="card space-y-3 p-5">
                    <p className="text-sm font-medium">Votre avis</p>
                    <StarInput value={rating} onChange={setRating} />
                    <textarea
                        className="input min-h-20"
                        placeholder="Partagez votre expérience (facultatif)"
                        aria-label="Commentaire"
                        maxLength={2000}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    {create.error && <ErrorBox>{errorMessage(create.error)}</ErrorBox>}
                    <button className="btn-primary" disabled={create.isPending}>Publier</button>
                </form>
            )}
            {!user && (
                <p className="text-sm text-stone-600">
                    <Link to="/login" className="font-medium text-brand-700 hover:underline">Connectez-vous</Link> pour laisser un avis.
                </p>
            )}

            {data?.data.length ? (
                <ul className="divide-y divide-stone-200">
                    {data.data.map((review) => (
                        <li key={review.id} className="py-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="font-medium">{review.author?.username}</span>
                                    <Stars value={review.rating} />
                                </div>
                                <span className="text-xs text-stone-500">{formatDate(review.createdAt)}</span>
                            </div>
                            {review.comment && <p className="mt-2 text-sm text-stone-700">{review.comment}</p>}
                            {review.authorId === user?.id && (
                                <button className="mt-2 text-xs text-red-700 hover:underline" onClick={() => remove.mutate(review.id)}>
                                    Supprimer mon avis
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-stone-500">Aucun avis pour le moment.</p>
            )}
            <Pagination pagination={data?.pagination} onChange={setPage} />
        </section>
    );
}
