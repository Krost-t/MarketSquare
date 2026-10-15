import { NavigationContainer, DefaultTheme, type NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import type { MealSlot } from "@marketsquare/shared";
import { Basket, ForkKnife, House, ListChecks, MapTrifold, Storefront, User, type Icon } from "./components/icons";
import { useAuth } from "./lib/auth";
import { useCart } from "./lib/cart";
import { useStackNavigation } from "./hooks";
import { colors, fonts } from "./theme";
import { Loading } from "./components/ui";
import { HomeScreen } from "./screens/HomeScreen";
import { MapScreen } from "./screens/MapScreen";
import { ShoppingListScreen } from "./screens/ShoppingListScreen";
import { MealPlannerScreen } from "./screens/MealPlannerScreen";
import { MealPickerScreen } from "./screens/MealPickerScreen";
import { RecipeScreen } from "./screens/RecipeScreen";
import { ShopsScreen } from "./screens/ShopsScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { ProductsScreen } from "./screens/ProductsScreen";
import { ProductScreen } from "./screens/ProductScreen";
import { CartScreen } from "./screens/CartScreen";
import { OrdersScreen } from "./screens/OrdersScreen";
import { OrderScreen } from "./screens/OrderScreen";
import { FavoritesScreen } from "./screens/FavoritesScreen";
import { AccountScreen } from "./screens/AccountScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MerchantShopScreen } from "./screens/MerchantShopScreen";
import { MerchantProductsScreen } from "./screens/MerchantProductsScreen";
import { MerchantOrdersScreen } from "./screens/MerchantOrdersScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";

export type TabParamList = {
    Home: undefined;
    Map: undefined;
    List: undefined;
    Meals: undefined;
    Shops: undefined;
};

export type RootStackParamList = {
    Tabs: NavigatorScreenParams<TabParamList> | undefined;
    Shop: { id: string; name?: string };
    Products: undefined;
    Product: { id: string; name?: string };
    Cart: undefined;
    Orders: { created?: number } | undefined;
    Order: { id: string };
    Favorites: undefined;
    Account: undefined;
    Profile: undefined;
    MerchantShop: undefined;
    MerchantProducts: undefined;
    MerchantOrders: undefined;
    MealPicker: { date: string; slot: MealSlot };
    Recipe: { id: string; name?: string };
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, primary: colors.text, background: colors.paper, card: colors.card, text: colors.text, border: colors.border },
};

const tabIcon = (Glyph: Icon) => ({ color, focused }: { color: string; focused: boolean }) => (
    <Glyph size={22} color={color} weight={focused ? "fill" : "regular"} />
);

function HeaderActions() {
    const { user } = useAuth();
    const { data: cart } = useCart();
    const navigation = useStackNavigation();
    const count = cart?.itemCount ?? 0;

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginRight: 12 }}>
            {user && (
                <Pressable accessibilityRole="button" accessibilityLabel={`Panier, ${count} article(s)`} onPress={() => navigation.navigate("Cart")} hitSlop={8} style={{ padding: 6 }}>
                    <Basket size={22} color={colors.text} />
                    {count > 0 && (
                        <View style={{ position: "absolute", top: 0, right: -2, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }}>
                            <Text style={{ color: "#fff", fontSize: 10, fontFamily: fonts.bold }}>{count}</Text>
                        </View>
                    )}
                </Pressable>
            )}
            {user ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Mon compte" onPress={() => navigation.navigate("Account")} hitSlop={8} style={{ padding: 6 }}>
                    <User size={22} color={colors.text} />
                </Pressable>
            ) : (
                <Pressable
                    accessibilityRole="button"
                    onPress={() => navigation.navigate("Login")}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.text, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }}
                >
                    <User size={15} color="#fff" />
                    <Text style={{ color: "#fff", fontFamily: fonts.semibold, fontSize: 13 }}>Connexion</Text>
                </Pressable>
            )}
        </View>
    );
}

function Wordmark() {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.text, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.accent }} />
            </View>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: colors.text, letterSpacing: -0.3 }}>MarketSquare</Text>
        </View>
    );
}

function Tabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: colors.text,
                tabBarInactiveTintColor: colors.faint,
                tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
                headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 },
                headerShadowVisible: false,
                headerRight: () => <HeaderActions />,
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ headerTitle: () => <Wordmark />, tabBarLabel: "Accueil", tabBarIcon: tabIcon(House) }} />
            <Tab.Screen name="Map" component={MapScreen} options={{ title: "Autour de vous", tabBarLabel: "Carte", tabBarIcon: tabIcon(MapTrifold) }} />
            <Tab.Screen name="List" component={ShoppingListScreen} options={{ title: "Ma liste", tabBarIcon: tabIcon(ListChecks) }} />
            <Tab.Screen name="Meals" component={MealPlannerScreen} options={{ title: "Repas", tabBarIcon: tabIcon(ForkKnife) }} />
            <Tab.Screen name="Shops" component={ShopsScreen} options={{ title: "Boutiques", tabBarIcon: tabIcon(Storefront) }} />
        </Tab.Navigator>
    );
}

export function Navigation() {
    const { isLoading } = useAuth();
    if (isLoading) return <Loading />;

    return (
        <NavigationContainer theme={theme}>
            <Stack.Navigator
                screenOptions={{
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontFamily: fonts.semibold },
                    headerBackButtonDisplayMode: "minimal",
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: colors.paper },
                }}
            >
                <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
                <Stack.Screen name="Shop" component={ShopScreen} options={({ route }) => ({ title: route.params.name ?? "Boutique" })} />
                <Stack.Screen name="Products" component={ProductsScreen} options={{ title: "Produits" }} />
                <Stack.Screen name="Product" component={ProductScreen} options={({ route }) => ({ title: route.params.name ?? "Produit" })} />
                <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Mon panier" }} />
                <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "Mes commandes" }} />
                <Stack.Screen name="Order" component={OrderScreen} options={{ title: "Commande" }} />
                <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Mes favoris" }} />
                <Stack.Screen name="Account" component={AccountScreen} options={{ title: "Mon compte" }} />
                <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil" }} />
                <Stack.Screen name="MerchantShop" component={MerchantShopScreen} options={{ title: "Ma boutique" }} />
                <Stack.Screen name="MerchantProducts" component={MerchantProductsScreen} options={{ title: "Catalogue" }} />
                <Stack.Screen name="MerchantOrders" component={MerchantOrdersScreen} options={{ title: "Commandes reçues" }} />
                <Stack.Screen name="MealPicker" component={MealPickerScreen} options={{ title: "Choisir un plat", presentation: "modal" }} />
                <Stack.Screen name="Recipe" component={RecipeScreen} options={({ route }) => ({ title: route.params.name ?? "Recette" })} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Connexion" }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Créer un compte" }} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Mot de passe oublié" }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
