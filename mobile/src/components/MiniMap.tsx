import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import type { PlaceCategory } from "@marketsquare/shared";
import { categoryLabel } from "./ShopCard";
import { colors, radius } from "../theme";

export interface MapPoint {
    id: string;
    lat: number;
    lon: number;
    name: string;
    category: PlaceCategory | null;
    partner?: boolean;
}

export function MiniMap({ center, points, height = 260 }: { center: { lat: number; lon: number }; points: MapPoint[]; height?: number }) {
    return (
        <View style={{ height, borderRadius: radius.panel, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
            <MapView
                style={StyleSheet.absoluteFill}
                initialRegion={{ latitude: center.lat, longitude: center.lon, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
                mapType={Platform.OS === "android" ? "none" : "standard"}
                showsUserLocation
            >
                <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
                {points.map((point) => (
                    <Marker
                        key={point.id}
                        coordinate={{ latitude: point.lat, longitude: point.lon }}
                        title={point.name}
                        description={categoryLabel(point.category)}
                        pinColor={point.partner ? colors.accent : colors.text}
                    />
                ))}
            </MapView>
            <Text style={styles.attribution}>© OpenStreetMap</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    attribution: { position: "absolute", right: 6, bottom: 4, fontSize: 10, color: colors.muted, backgroundColor: "rgba(255,255,255,0.8)", paddingHorizontal: 4 },
});
