import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { colors } from "@/constants/colors";
import { BlurView } from 'expo-blur';
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

type Shop = {
  key: string; name: string; location: string; rating: number; image?: string; description?: string;
};

export default function ShopDetails() {
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const shop: Shop | null = payload ? JSON.parse(decodeURIComponent(payload)) : null;

  if (!shop) return <Text style={{ margin: 24 }}>Missing shop data.</Text>;

  return (
    <AdaptiveView style={{height: '100%'}}>
        <BlurView></BlurView>
        <ScrollView>
            {shop.image ? (
                <Image source={{ uri: shop.image }} style={{ height: 400 }} />
            ) : (
                <View style={{ height: 400, backgroundColor: colors.lightGrey}} />
            )}
            <AdaptiveText style={{ fontSize: 22, fontWeight: "700", marginLeft: 10, marginTop: 10, fontFamily: 'Poppins-Medium' }}>{shop.name}</AdaptiveText>
            <AdaptiveText style={{ marginTop: 4, marginLeft: 10, fontFamily: 'Poppins-Regular' }}>{shop.location}</AdaptiveText>
            <AdaptiveText style={{ marginTop: 4, marginLeft: 10, fontFamily: 'Poppins-Bold' }}>★ {shop.rating}</AdaptiveText>
            {shop.description ? <AdaptiveText style={{ marginTop: 12, fontFamily: 'Poppins-Regular' }}>{shop.description}</AdaptiveText> : null}
        </ScrollView>
    </AdaptiveView>
  );
}

const createStyles = ({ darkMode }: any) => {
    return StyleSheet.create({

    });
}