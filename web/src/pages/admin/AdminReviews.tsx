import { useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@marketsquare/shared";
import { api, errorMessage } from "../../lib/api.ts";
import { EmptyState, ErrorBox, Pagination, Spinner, Stars } from "../../components/ui.tsx";

export function AdminReviewsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [onlyNegative, setOnlyNegative] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "reviews", page, onlyNegative],
        queryFn: () => api.admin.reviews({ page, limit: 20, ...(onlyNegative && { maxRating: 2 }) }),
        placeholderData: keepPreviousData,
    });

    const remove = useMutation({
        mutationFn: (id: string) => api.admin.deleteReview(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }),
    });

    return (
        <div className="space-y-6">
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-brand-700" checked={onlyNegative}
                    onChange={(e) => {
                        setOnlyNegative(e.target.checked);
                        setPage(1);
                    }} />
                Uniquement les avis négatifs (2 étoiles ou moins)
            </label>
            {remove.error && <ErrorBox>{errorMessage(remove.error)}</ErrorBox>}

            {isLoading ? (
                <Spinner />
            ) : data?.data.length ? (
                <ul className="space-y-3">
                    {data.data.map((review) => (
                        <li key={review.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Stars value={review.rating} />
                                    <span className="text-sm font-medium">{review.author?.username}</span>
                                    <span className="text-xs text-stone-500">{formatDate(review.createdAt)}</span>
                                </div>
                                <p className="mt-1 text-sm text-stone-500">
                                    sur{" "}
                                    {review.product ? (
                                        <Link to={`/products/${review.product.id}`} className="text-brand-700 hover:underline">{review.product.name}</Link>
                                    ) : review.shop ? (
                                        <Link to={`/shops/${review.shop.id}`} className="text-brand-700 hover:underline">{review.shop.name}</Link>
                                    ) : "—"}
                                </p>
                                {review.comment && <p className="mt-2 text-sm text-stone-700">{review.comment}</p>}
                            </div>
                            <button className="btn-danger" disabled={remove.isPending} onClick={() => remove.mutate(review.id)}>Supprimer</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState title="Aucun avis à modérer" />
            )}
            <Pagination pagination={data?.pagination} onChange={setPage} />
        </div>
    );
}
