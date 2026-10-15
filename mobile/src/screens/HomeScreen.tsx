import { ScrollView, Text, View } from "react-native";
import { Basket, ForkKnife, MapTrifold } from "../components/icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useStackNavigation } from "../hooks";
import { Button, Loading } from "../components/ui";
import { ShopCard } from "../components/ShopCard";
import { colors, ui, fonts } from "../theme";

const FEATURES = [
    { icon: MapTrifold, title: "Les commerces autour de vous", text: "Boulangeries, primeurs, fromagers, marchés : les vrais commerces de votre quartier, avec horaires et distance à pied." },
    { icon: ForkKnife, title: "Des repas aux courses", text: "Choisissez un repas : MarketSquare vous dit chez quel commerçant trouver chaque ingrédient." },
    { icon: Basket, title: "Commande et retrait", text: "Chez les commerçants partenaires, commandez en ligne puis passez récupérer vos produits, ou faites-vous livrer." },
];

export function HomeScreen() {
    const navigation = useStackNavigation();
    const { data: shops, isLoading } = useQuery({
        queryKey: ["shops", { home: true }],
        queryFn: () => api.shops.list({ limit: 3 }),
    });

    return (
        <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { gap: 20 }]}>
            <View style={{ gap: 10, paddingTop: 8 }}>
                <Text style={{ color: colors.accentDark, fontFamily: fonts.medium }}>Commerces de quartier</Text>
                <Text style={[ui.title, { fontSize: 30, lineHeight: 36 }]}>Vos courses chez les commerçants du coin.</Text>
                <Text style={[ui.body, { fontSize: 16, color: colors.muted }]}>
                    MarketSquare réunit les commerces de proximité sur une carte, vous dit où acheter les ingrédients de vos repas
                    et vous permet de commander chez ceux qui sont partenaires.
                </Text>
                <View style={{ gap: 8, marginTop: 6 }}>
                    <Button title="Voir les commerces autour de moi" variant="accent" onPress={() => navigation.navigate("Tabs", { screen: "Map" })} />
                    <Button title="Voir les boutiques" variant="ghost" onPress={() => navigation.navigate("Tabs", { screen: "Shops" })} />
                </View>
            </View>

            <View style={{ gap: 10 }}>
                <Text style={ui.subtitle}>Ce que vous pouvez faire</Text>
                {FEATURES.map(({ icon: Glyph, ...feature }) => (
                    <View key={feature.title} style={[ui.card, { gap: 6 }]}>
                        <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.text, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                            <Glyph size={22} color="#fff" />
                        </View>
                        <Text style={ui.subtitle}>{feature.title}</Text>
                        <Text style={ui.muted}>{feature.text}</Text>
                    </View>
                ))}
            </View>

            {(isLoading || Boolean(shops?.data.length)) && (
                <View style={{ gap: 10 }}>
                    <Text style={ui.subtitle}>Déjà sur MarketSquare</Text>
                    {isLoading ? <Loading /> : shops?.data.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
                </View>
            )}

            <View style={[ui.card, { gap: 8 }]}>
                <Text style={ui.subtitle}>Vous êtes commerçant ?</Text>
                <Text style={ui.muted}>Mettez vos produits en ligne, recevez des commandes en click & collect et apparaissez en tête de la carte de votre quartier.</Text>
                <Button title="Ouvrir ma boutique" onPress={() => navigation.navigate("Register")} />
            </View>
        </ScrollView>
    );
}
