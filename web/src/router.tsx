import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout.tsx";
import { RequireAuth } from "./components/RequireAuth.tsx";
import { HomePage } from "./pages/Home.tsx";
import { ExplorePage } from "./pages/Explore.tsx";
import { ShoppingListPage } from "./pages/ShoppingList.tsx";
import { MealPlannerPage } from "./pages/MealPlanner.tsx";
import { ShopsPage } from "./pages/Shops.tsx";
import { ShopDetailPage } from "./pages/ShopDetail.tsx";
import { ProductsPage } from "./pages/Products.tsx";
import { ProductDetailPage } from "./pages/ProductDetail.tsx";
import { LoginPage } from "./pages/auth/Login.tsx";
import { RegisterPage } from "./pages/auth/Register.tsx";
import { ForgotPasswordPage } from "./pages/auth/ForgotPassword.tsx";
import { ResetPasswordPage } from "./pages/auth/ResetPassword.tsx";
import { CartPage } from "./pages/Cart.tsx";
import { OrdersPage } from "./pages/Orders.tsx";
import { OrderDetailPage } from "./pages/OrderDetail.tsx";
import { FavoritesPage } from "./pages/Favorites.tsx";
import { AccountPage } from "./pages/Account.tsx";
import { MerchantLayout } from "./pages/merchant/MerchantLayout.tsx";
import { MerchantShopPage } from "./pages/merchant/MerchantShop.tsx";
import { MerchantProductsPage } from "./pages/merchant/MerchantProducts.tsx";
import { MerchantOrdersPage } from "./pages/merchant/MerchantOrders.tsx";
import { AdminLayout } from "./pages/admin/AdminLayout.tsx";
import { AdminDashboardPage } from "./pages/admin/AdminDashboard.tsx";
import { AdminUsersPage } from "./pages/admin/AdminUsers.tsx";
import { AdminShopsPage } from "./pages/admin/AdminShops.tsx";
import { AdminReviewsPage } from "./pages/admin/AdminReviews.tsx";
import { AdminOrdersPage } from "./pages/admin/AdminOrders.tsx";
import { NotFoundPage } from "./pages/NotFound.tsx";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: "carte", element: <ExplorePage /> },
            { path: "liste", element: <ShoppingListPage /> },
            { path: "repas", element: <MealPlannerPage /> },
            { path: "shops", element: <ShopsPage /> },
            { path: "shops/:id", element: <ShopDetailPage /> },
            { path: "products", element: <ProductsPage /> },
            { path: "products/:id", element: <ProductDetailPage /> },
            { path: "login", element: <LoginPage /> },
            { path: "register", element: <RegisterPage /> },
            { path: "forgot-password", element: <ForgotPasswordPage /> },
            { path: "reset-password", element: <ResetPasswordPage /> },

            { path: "cart", element: <RequireAuth><CartPage /></RequireAuth> },
            { path: "orders", element: <RequireAuth><OrdersPage /></RequireAuth> },
            { path: "orders/:id", element: <RequireAuth><OrderDetailPage /></RequireAuth> },
            { path: "favorites", element: <RequireAuth><FavoritesPage /></RequireAuth> },
            { path: "account", element: <RequireAuth><AccountPage /></RequireAuth> },

            {
                path: "merchant",
                element: <RequireAuth roles={["MERCHANT", "ADMIN"]}><MerchantLayout /></RequireAuth>,
                children: [
                    { index: true, element: <MerchantShopPage /> },
                    { path: "products", element: <MerchantProductsPage /> },
                    { path: "orders", element: <MerchantOrdersPage /> },
                ],
            },

            {
                path: "admin",
                element: <RequireAuth roles={["ADMIN"]}><AdminLayout /></RequireAuth>,
                children: [
                    { index: true, element: <AdminDashboardPage /> },
                    { path: "users", element: <AdminUsersPage /> },
                    { path: "shops", element: <AdminShopsPage /> },
                    { path: "reviews", element: <AdminReviewsPage /> },
                    { path: "orders", element: <AdminOrdersPage /> },
                ],
            },

            { path: "*", element: <NotFoundPage /> },
        ],
    },
]);
