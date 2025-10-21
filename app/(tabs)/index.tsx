import { useEffect } from "react";
import { StyleSheet, Image, ActivityIndicator } from "react-native";
import { View, Text } from "@/components/Themed";
import { useRouter } from "expo-router";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/(tabs)/home"), 900);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")} // ← fixed path
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" />
      <Text style={styles.msg}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 },
  logo: { width: 180, height: 180, marginBottom: 8 },
  msg: { opacity: 0.7 },
});
