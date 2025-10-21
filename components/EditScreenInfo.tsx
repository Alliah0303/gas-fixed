import { StyleSheet } from "react-native";
import { View, Text } from "@/components/Themed";

export default function EditScreenInfo({ path }: { path?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Edit this screen: {path}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  text: { opacity: 0.7 },
});
