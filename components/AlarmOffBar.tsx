// components/AlarmOffBar.tsx
import { Pressable, StyleSheet } from "react-native";
import { View, Text } from "@/components/Themed";

export default function AlarmOffBar({
  visible,
  onTurnOff,
  loading,
}: {
  visible: boolean;
  onTurnOff: () => void;
  loading?: boolean;
}) {
  if (!visible) return null;
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.btn} onPress={onTurnOff} disabled={!!loading}>
        <Text style={styles.text}>{loading ? "Turning off…" : "Turn alarm off"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  btn: {
    minWidth: 220,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: "#D72638",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  text: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
