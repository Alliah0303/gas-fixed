// components/progressBar.tsx
import { View } from "@/components/Themed";
import { StyleSheet } from "react-native";

export default function ProgressBar({ progress = 0 }: { progress: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: 200, height: 10, borderRadius: 6, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.08)" },
  fill: { height: "100%", backgroundColor: "#1E90FF" },
});
