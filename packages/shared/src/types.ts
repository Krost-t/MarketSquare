
export type Role = "USER" | "MERCHANT" | "ADMIN";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type AddressType = "SHIPPING" | "BILLING" | "BOTH" | "SHOP";
export type HousingType = "HOUSE" | "APARTMENT" | "STUDIO" | "OFFICE" | "OTHER";
export type OrderStatus = "PENDING" | "PAID" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
export type PaymentMethod = "CARD" | "PAYPAL" | "BANK_TRANSFER" | "ON_SITE";
export type DeliveryMethod = "PICKUP" | "DELIVERY";
export type MealSlot = "LUNCH" | "DINNER";
export type PlaceCategory =
    | "bakery"
    | "butcher"
    | "greengrocer"
    | "cheese"
    | "seafood"
    | "grocery"
    | "supermarket"
    | "wine"
    | "market"
    | "books"
    | "florist";

export type DecimalString = string;
export type ISODate = string;

export interface User {
    id: string;
    email: string;
    username: string;
    lastname: string;
    firstname: string;
    dateOfBirth: ISODate;
    gender: Gender;
    phone: string;
    role: Role;
    avatarUrl: string | null;
    createdAt: ISODate;
    updatedAt: ISODate;
    shop?: { id: string; name: string } | null;
}

export interface Address {
    id: string;
    type: AddressType;
    housingType: HousingType;
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
    latitude: number | null;
    longitude: number | null;
    userId: string | null;
    shopId: string | null;
    createdAt: ISODate;
    updatedAt: ISODate;
}

export interface Shop {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: PlaceCategory | null;
    osmId: string | null;
    averageRating: DecimalString;
    reviewCount: number;
    merchantId: string;
    createdAt: ISODate;
    updatedAt: ISODate;
    address?: Address | null;
    merchant?: { id: string; username: string; firstname: string };
    _count?: { products: number };
}

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: DecimalString;
    stock: number;
    imageUrl: string | null;
    isActive: boolean;
    averageRating: DecimalString;
    reviewCount: number;
    shopId: string;
    createdAt: ISODate;
    updatedAt: ISODate;
    shop?: Pick<Shop, "id" | "name"> & Partial<Shop>;
    isFavorite?: boolean;
}

export interface Review {
    id: string;
    rating: DecimalString;
    comment: string | null;
    authorId: string;
    productId: string | null;
    shopId: string | null;
    createdAt: ISODate;
    updatedAt: ISODate;
    author?: { id: string; username: string; avatarUrl?: string | null; email?: string };
    product?: { id: string; name: string } | null;
    shop?: { id: string; name: string } | null;
}

export interface CartItem {
    id: string;
    quantity: number;
    cartId: string;
    productId: string;
    product: Product;
}

export interface Cart {
    id: string;
    customerId: string;
    items: CartItem[];
    total: DecimalString;
    itemCount: number;
}

export interface OrderItem {
    id: string;
    quantity: number;
    unitPrice: DecimalString;
    productName: string;
    orderId: string;
    productId: string | null;
    product: { id: string; imageUrl: string | null } | null;
}

export interface Order {
    id: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    deliveryMethod: DeliveryMethod;
    totalAmount: DecimalString;
    shippingStreet: string | null;
    shippingPostalCode: string | null;
    shippingLocality: string | null;
    shippingRegion: string | null;
    shippingCountry: string | null;
    customerId: string;
    shopId: string | null;
    createdAt: ISODate;
    updatedAt: ISODate;
    items: OrderItem[];
    shop: { id: string; name: string; address?: Address | null } | null;
    customer?: { id: string; username: string; firstname: string; lastname: string; phone: string; email?: string };
}

export interface Favorite {
    id: string;
    userId: string;
    productId: string;
    createdAt: ISODate;
    product: Product;
}

export interface AdminStats {
    users: number;
    merchants: number;
    shops: number;
    products: number;
    orders: number;
    reviews: number;
    revenue: DecimalString;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface Paginated<T> {
    status: string;
    data: T[];
    pagination: Pagination;
}


export interface RegisterInput {
    lastname: string;
    firstname: string;
    gender: Gender;
    dateOfBirth: string;
    phone: string;
    email: string;
    password: string;
    role?: "USER" | "MERCHANT";
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export type UpdateProfileInput = Partial<Pick<User, "lastname" | "firstname" | "username" | "gender" | "phone" | "avatarUrl">> & {
    dateOfBirth?: string;
};

export interface AddressInput {
    type?: Exclude<AddressType, "SHOP">;
    housingType?: HousingType;
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
}

export interface ShopInput {
    name: string;
    category?: PlaceCategory | null;
    osmId?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    address?: Omit<AddressInput, "type">;
}

export interface ProductInput {
    name: string;
    description?: string | null;
    price: number;
    stock: number;
    imageUrl?: string | null;
    isActive?: boolean;
}

export interface ReviewInput {
    rating: number;
    comment?: string | null;
    productId?: string;
    shopId?: string;
}

export interface CheckoutInput {
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
    addressId?: string;
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "rating";

export interface ProductQuery {
    page?: number;
    limit?: number;
    search?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sort?: ProductSort;
}

export interface ShopQuery {
    page?: number;
    limit?: number;
    search?: string;
    postalCode?: string;
    locality?: string;
    region?: string;
}

export interface GeoPoint {
    label: string;
    lat: number;
    lon: number;
    postcode: string | null;
    city: string | null;
}

export interface Place {
    id: string;
    name: string;
    category: PlaceCategory;
    lat: number;
    lon: number;
    distance: number;
    address: string | null;
    openingHours: string | null;
    phone: string | null;
    website: string | null;
    source: "osm";
}

export type PartnerShop = Shop & { distance: number; address: Address };

export interface NearbyResult {
    partners: PartnerShop[];
    places: Place[];
}

export interface MealSummary {
    id: string;
    name: string;
    thumbnail: string;
    category: string | null;
    area: string | null;
}

export interface Ingredient {
    name: string;
    original: string;
    measure: string | null;
    image: string;
    category: PlaceCategory;
}

export interface Meal extends MealSummary {
    instructions: string;
    youtube: string | null;
    source: string | null;
    ingredients: Ingredient[];
}

export interface MealCategory {
    name: string;
    thumbnail: string;
}

export interface MealPlanEntry {
    id: string;
    date: ISODate;
    slot: MealSlot;
    mealId: string;
    name: string;
    thumbnail: string | null;
}

export interface ShoppingItem {
    id: string;
    label: string;
    quantity: string | null;
    checked: boolean;
    source: string | null;
    category: PlaceCategory;
    createdAt: ISODate;
}

export interface ShoppingPlanGroup {
    category: PlaceCategory;
    items: ShoppingItem[];
    places: Place[];
    partnerProducts: { itemId: string; product: Product; shop: { id: string; name: string; distance: number } }[];
}

export interface ShoppingPlan {
    origin: { lat: number; lon: number };
    groups: ShoppingPlanGroup[];
    partners: { id: string; name: string; category: PlaceCategory | null; distance: number; lat: number; lon: number }[];
}

export interface FoodProduct {
    barcode: string;
    name: string;
    brand: string | null;
    quantity: string | null;
    imageUrl: string | null;
}
