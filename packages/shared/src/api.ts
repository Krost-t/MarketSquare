import type {
    Address,
    AddressInput,
    FoodProduct,
    GeoPoint,
    Meal,
    MealCategory,
    MealPlanEntry,
    MealSlot,
    MealSummary,
    NearbyResult,
    PlaceCategory,
    ShoppingItem,
    ShoppingPlan,
    AdminStats,
    AuthResponse,
    Cart,
    CheckoutInput,
    Favorite,
    Order,
    OrderStatus,
    Paginated,
    Product,
    ProductInput,
    ProductQuery,
    RegisterInput,
    Review,
    ReviewInput,
    Role,
    Shop,
    ShopInput,
    ShopQuery,
    UpdateProfileInput,
    User,
} from "./types";

export class ApiError extends Error {
    readonly status: number;
    readonly errors: { path: string; message: string }[];

    constructor(status: number, message: string, errors: { path: string; message: string }[] = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
}

export interface ApiClientOptions {
    baseUrl: string;
    getToken?: () => string | null | undefined | Promise<string | null | undefined>;
    onUnauthorized?: () => void;
}

type Query = Record<string, string | number | boolean | undefined | null>;

const toQueryString = (query?: Query): string => {
    if (!query) return "";
    const parts = Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    return parts.length ? `?${parts.join("&")}` : "";
};

interface Data<T> {
    status: string;
    data: T;
    message?: string;
}

export const createApiClient = ({ baseUrl, getToken, onUnauthorized }: ApiClientOptions) => {
    const request = async <T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> => {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (body !== undefined) headers["Content-Type"] = "application/json";

        const token = getToken ? await getToken() : null;
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}${toQueryString(query)}`, {
            method,
            headers,
            credentials: "include",
            ...(body !== undefined && { body: JSON.stringify(body) }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401) onUnauthorized?.();
            throw new ApiError(response.status, payload.message ?? response.statusText, payload.errors);
        }
        return payload as T;
    };

    const get = <T>(path: string, query?: Query) => request<T>("GET", path, undefined, query);
    const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {});
    const put = <T>(path: string, body: unknown) => request<T>("PUT", path, body);
    const patch = <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {});
    const del = <T>(path: string) => request<T>("DELETE", path);

    const data = async <T>(promise: Promise<Data<T>>): Promise<T> => (await promise).data;

    return {
        auth: {
            register: (input: RegisterInput) => post<AuthResponse>("/auth/register", input),
            login: (email: string, password: string) => post<AuthResponse>("/auth/login", { email, password }),
            logout: () => post<{ message: string }>("/auth/logout"),
            forgotPassword: (email: string) =>
                post<{ message: string; userId?: string; token?: string }>("/auth/forgot-password", { email }),
            resetPassword: (userId: string, token: string, password: string) =>
                post<{ message: string }>("/auth/reset-password", { userId, token, password }),
        },

        user: {
            profile: () => data(get<Data<User>>("/user/user-profile")),
            updateProfile: (input: UpdateProfileInput) => data(put<Data<User>>("/user/update-profile", input)),
            changePassword: (currentPassword: string, newPassword: string) =>
                patch<{ message: string }>("/user/change-password", { currentPassword, newPassword }),
            deleteAccount: () => del<{ message: string }>("/user/delete-profile"),
            setPushToken: (pushToken: string | null) => patch<{ message: string }>("/user/push-token", { pushToken }),
            favorites: () => data(get<Data<Favorite[]>>("/user/favorites")),
            addFavorite: (productId: string) => post<unknown>(`/user/favorites/${productId}`),
            removeFavorite: (productId: string) => del<unknown>(`/user/favorites/${productId}`),
        },

        addresses: {
            list: () => data(get<Data<Address[]>>("/addresses")),
            create: (input: AddressInput) => data(post<Data<Address>>("/addresses", input)),
            update: (id: string, input: Partial<AddressInput>) => data(patch<Data<Address>>(`/addresses/${id}`, input)),
            remove: (id: string) => del<unknown>(`/addresses/${id}`),
        },

        shops: {
            list: (query?: ShopQuery) => get<Paginated<Shop>>("/shops", { ...query }),
            get: (id: string) => data(get<Data<Shop>>(`/shops/${id}`)),
            products: (id: string, query?: { page?: number; limit?: number }) =>
                get<Paginated<Product>>(`/shops/${id}/products`, { ...query }),
            reviews: (id: string, query?: { page?: number; limit?: number }) =>
                get<Paginated<Review>>(`/shops/${id}/reviews`, { ...query }),
            mine: () => data(get<Data<Shop>>("/shops/mine")),
            create: (input: ShopInput) => data(post<Data<Shop>>("/shops", input)),
            update: (id: string, input: Partial<ShopInput>) => data(patch<Data<Shop>>(`/shops/${id}`, input)),
            remove: (id: string) => del<unknown>(`/shops/${id}`),
        },

        products: {
            list: (query?: ProductQuery) => get<Paginated<Product>>("/products", { ...query }),
            get: (id: string) => data(get<Data<Product>>(`/products/${id}`)),
            reviews: (id: string, query?: { page?: number; limit?: number }) =>
                get<Paginated<Review>>(`/products/${id}/reviews`, { ...query }),
            create: (input: ProductInput) => data(post<Data<Product>>("/products", input)),
            update: (id: string, input: Partial<ProductInput>) => data(patch<Data<Product>>(`/products/${id}`, input)),
            remove: (id: string) => del<unknown>(`/products/${id}`),
            lookupBarcode: (barcode: string) => data(get<Data<FoodProduct>>(`/products/lookup/${barcode}`)),
        },

        places: {
            nearby: (lat: number, lon: number, options?: { radius?: number; category?: PlaceCategory; partnersOnly?: true }) =>
                data(get<Data<NearbyResult>>("/places/nearby", { lat, lon, ...options })),
            geocode: (q: string) => data(get<Data<GeoPoint[]>>("/places/geocode", { q })),
            reverse: (lat: number, lon: number) => data(get<Data<GeoPoint | null>>("/places/reverse", { lat, lon })),
        },

        meals: {
            search: (q: string) => data(get<Data<MealSummary[]>>("/meals/search", { q })),
            random: (count = 8) => data(get<Data<MealSummary[]>>("/meals/random", { count })),
            categories: () => data(get<Data<MealCategory[]>>("/meals/categories")),
            byCategory: (name: string) => data(get<Data<MealSummary[]>>(`/meals/category/${encodeURIComponent(name)}`)),
            get: (id: string) => data(get<Data<Meal>>(`/meals/${id}`)),
        },

        shoppingList: {
            list: () => data(get<Data<ShoppingItem[]>>("/shopping-list")),
            add: (items: { label: string; quantity?: string | null }[]) =>
                data(post<Data<ShoppingItem[]>>("/shopping-list", { items })),
            update: (id: string, input: { label?: string; quantity?: string | null; checked?: boolean }) =>
                data(patch<Data<ShoppingItem>>(`/shopping-list/${id}`, input)),
            remove: (id: string) => del<unknown>(`/shopping-list/${id}`),
            clearChecked: () => del<unknown>("/shopping-list/checked"),
            plan: (lat: number, lon: number, radius?: number) =>
                data(post<Data<ShoppingPlan>>("/shopping-list/plan", { lat, lon, ...(radius && { radius }) })),
        },

        mealPlan: {
            list: (from: string, to: string) => data(get<Data<MealPlanEntry[]>>("/meal-plan", { from, to })),
            set: (date: string, slot: MealSlot, mealId: string) => data(put<Data<MealPlanEntry>>("/meal-plan", { date, slot, mealId })),
            remove: (id: string) => del<unknown>(`/meal-plan/${id}`),
            toShoppingList: (from: string, to: string) =>
                post<{ message: string; data: { added: number; skipped: number } }>("/meal-plan/shopping-list", { from, to }),
        },

        reviews: {
            create: (input: ReviewInput) => data(post<Data<Review>>("/reviews", input)),
            update: (id: string, input: { rating?: number; comment?: string | null }) =>
                data(patch<Data<Review>>(`/reviews/${id}`, input)),
            remove: (id: string) => del<unknown>(`/reviews/${id}`),
        },

        cart: {
            get: () => data(get<Data<Cart>>("/cart")),
            add: (productId: string, quantity = 1) => data(post<Data<Cart>>("/cart/items", { productId, quantity })),
            update: (itemId: string, quantity: number) => data(patch<Data<Cart>>(`/cart/items/${itemId}`, { quantity })),
            remove: (itemId: string) => data(del<Data<Cart>>(`/cart/items/${itemId}`)),
            clear: () => data(del<Data<Cart>>("/cart")),
        },

        orders: {
            list: (query?: { page?: number; limit?: number; status?: OrderStatus }) => get<Paginated<Order>>("/orders", { ...query }),
            get: (id: string) => data(get<Data<Order>>(`/orders/${id}`)),
            checkout: (input: CheckoutInput) => data(post<Data<Order[]>>("/orders/checkout", input)),
            cancel: (id: string) => data(patch<Data<Order>>(`/orders/${id}/cancel`)),
            shopOrders: (query?: { page?: number; limit?: number; status?: OrderStatus }) =>
                get<Paginated<Order>>("/orders/shop/mine", { ...query }),
            updateStatus: (id: string, status: OrderStatus) => data(patch<Data<Order>>(`/orders/${id}/status`, { status })),
        },

        admin: {
            dashboard: () => data(get<Data<AdminStats>>("/admin/dashboard")),
            users: (query?: { page?: number; limit?: number; search?: string; role?: Role }) =>
                get<Paginated<User>>("/admin/users-list", { ...query }),
            user: (id: string) => data(get<Data<User>>(`/admin/user/${id}`)),
            createUser: (input: RegisterInput & { role?: Role }) => data(post<Data<User>>("/admin/create-user", input)),
            updateUser: (id: string, input: UpdateProfileInput & { email?: string }) =>
                data(put<Data<User>>(`/admin/update-user/${id}`, input)),
            updateRole: (id: string, role: Role) => data(patch<Data<User>>(`/admin/update-user/${id}/role`, { role })),
            deleteUser: (id: string) => del<unknown>(`/admin/delete-user/${id}`),
            reviews: (query?: { page?: number; limit?: number; maxRating?: number; target?: "product" | "shop" }) =>
                get<Paginated<Review>>("/admin/reviews-list", { ...query }),
            deleteReview: (id: string) => del<unknown>(`/admin/delete-review/${id}`),
            shops: (query?: { page?: number; limit?: number; search?: string }) =>
                get<Paginated<Shop & { merchant: { id: string; username: string; email: string }; _count: { products: number; orders: number; reviews: number } }>>("/admin/shops-list", { ...query }),
            deleteShop: (id: string) => del<unknown>(`/admin/delete-shop/${id}`),
            orders: (query?: { page?: number; limit?: number }) => get<Paginated<Order>>("/admin/orders-list", { ...query }),
        },
    };
};

export type ApiClient = ReturnType<typeof createApiClient>;
