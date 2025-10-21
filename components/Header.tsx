import { StyleSheet, Pressable } from "react-native";
import { View, Text } from "@/components/Themed";
import { useRouter } from "expo-router";

export default function Header({ title, onCirclePress }: { title: string; onCirclePress?: () => void }) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={{ fontSize: 18 }}>←</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onCirclePress} style={styles.circle} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: "rgba(54, 78, 109, 0.35)", paddingTop: 18, paddingBottom: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontWeight: "700" },
  circle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#1E90FF" },
});
