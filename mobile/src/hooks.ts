import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./navigation";

export const useStackNavigation = () => useNavigation<NativeStackNavigationProp<RootStackParamList>>();

export const useStackRoute = <K extends keyof RootStackParamList>() => useRoute<RouteProp<RootStackParamList, K>>();
