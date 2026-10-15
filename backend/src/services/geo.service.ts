import { cached, fetchJson, firstSuccessful } from "./http.service.ts";

interface GeoPoint {
    label: string;
    lat: number;
    lon: number;
    postcode: string | null;
    city: string | null;
}

interface GeoplateformeResponse {
    features: {
        geometry: { coordinates: [number, number] };
        properties: { label: string; postcode?: string; city?: string };
    }[];
}

interface NominatimPlace {
    lat: string;
    lon: string;
    display_name: string;
    address?: { postcode?: string; city?: string; town?: string; village?: string };
}

const GEOPLATEFORME_URL = "https://data.geopf.fr/geocodage";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const DAY = 24 * 60 * 60 * 1000;

const fromGeoplateforme = (data: GeoplateformeResponse): GeoPoint[] =>
    data.features.map((feature) => ({
        label: feature.properties.label,
        lon: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
        postcode: feature.properties.postcode ?? null,
        city: feature.properties.city ?? null,
    }));

const fromNominatim = (places: NominatimPlace[]): GeoPoint[] =>
    places.map((place) => ({
        label: place.display_name,
        lat: Number(place.lat),
        lon: Number(place.lon),
        postcode: place.address?.postcode ?? null,
        city: place.address?.city ?? place.address?.town ?? place.address?.village ?? null,
    }));

const geocode = (query: string, limit = 5): Promise<GeoPoint[]> =>
    cached(`geocode:${query.toLowerCase()}:${limit}`, DAY, () =>
        firstSuccessful([
            async () => {
                const data = await fetchJson<GeoplateformeResponse>(
                    `${GEOPLATEFORME_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
                );
                if (!data.features.length) throw new Error("no result");
                return fromGeoplateforme(data);
            },
            async () =>
                fromNominatim(
                    await fetchJson<NominatimPlace[]>(
                        `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=${limit}`,
                    ),
                ),
        ]),
    );

const reverseGeocode = (lat: number, lon: number): Promise<GeoPoint | null> =>
    cached(`reverse:${lat.toFixed(4)}:${lon.toFixed(4)}`, DAY, () =>
        firstSuccessful([
            async () => {
                const data = await fetchJson<GeoplateformeResponse>(`${GEOPLATEFORME_URL}/reverse?lat=${lat}&lon=${lon}&limit=1`);
                const [point] = fromGeoplateforme(data);
                if (!point) throw new Error("no result");
                return point;
            },
            async () => {
                const place = await fetchJson<NominatimPlace>(
                    `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`,
                );
                return fromNominatim([place])[0] ?? null;
            },
        ]),
    );

const geocodeAddress = async (address: {
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
}): Promise<{ latitude: number; longitude: number } | null> => {
    try {
        const [point] = await geocode(`${address.streetAddress} ${address.postalCode} ${address.addressLocality}`, 1);
        return point ? { latitude: point.lat, longitude: point.lon } : null;
    } catch {
        return null;
    }
};

const EARTH_RADIUS_M = 6371000;

const distanceInMeters = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h)));
};

export { geocode, reverseGeocode, geocodeAddress, distanceInMeters };
export type { GeoPoint };
