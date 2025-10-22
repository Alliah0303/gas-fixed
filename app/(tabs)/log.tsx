// app/(tabs)/log.tsx
import { useEffect, useState } from "react";
import {
  StyleSheet,
  FlatList,
  View as RNView,
  ActivityIndicator,
  ListRenderItem,
  Pressable,            // ⬅️ added
  Alert,                // ⬅️ added
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { View, Text } from "@/components/Themed";
import { db } from "../../firebaseConfig";
import {
  ref,
  query as fbQuery,
  orderByKey,
  limitToLast,
  onChildAdded,
  off,
  update,
  type DataSnapshot,    // ⬅️ type-only import
} from "firebase/database";

type Row = {
  id: string;
  timestamp: string; // "YYYY-MM-DDTHH:mm:ss"
  value: number;     // gas value when threshold was exceeded
};

const MAX_ITEMS = 100;

export default function LogScreen() {
  const tabBarH = useBottomTabBarHeight();
  const [rows, setRows] = useState<Row[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const alarmsRef = ref(db, "/alarms");
    const q = fbQuery(alarmsRef, orderByKey(), limitToLast(MAX_ITEMS));

    const buffer: Row[] = [];
    const seen = new Set<string>();
    setInitialLoading(true);

    const handle = (snap: DataSnapshot) => {
      const id = snap.key ?? "";
      if (!id || seen.has(id)) return;

      const v = snap.val() as { timestamp?: string; value?: number } | null;
      seen.add(id);
      buffer.push({
        id,
        timestamp: String(v?.timestamp ?? ""),
        value: Number(v?.value ?? 0),
      });

      // newest first by key (epoch-based keys sort nicely)
      buffer.sort((a, b) => (a.id > b.id ? -1 : 1));
      setRows([...buffer]);
      setInitialLoading(false);
    };

    // Fires for existing items (old→new), then future inserts.
    onChildAdded(q, handle, (err) => {
      console.error("onChildAdded error:", err);
      setInitialLoading(false);
    });

    return () => {
      // detach using the SAME query used to attach
      off(q, "child_added", handle as any);
    };
  }, []);

  // Move to /archives/{id} and delete /alarms/{id}
  const archiveItem = async (item: Row) => {
    const root = ref(db);
    const updates: Record<string, any> = {};
    updates[`/archives/${item.id}`] = { timestamp: item.timestamp, value: item.value };
    updates[`/alarms/${item.id}`] = null; // delete
    await update(root, updates);
    setRows((prev) => prev.filter((r) => r.id !== item.id));
  };

  const confirmArchive = (item: Row) => {
    Alert.alert(
      "Archive entry?",
      `Timestamp: ${item.timestamp}\nValue: ${item.value}\n\nMove this entry to Archive?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Archive", onPress: () => archiveItem(item) },
      ],
      { cancelable: true }
    );
  };

  const Header = () => (
    <RNView style={styles.header}>
      <Text style={styles.title}>Alarm Logs</Text>
      <Text style={styles.subtitle}>
        Showing latest {Math.min(rows.length, MAX_ITEMS)} entr{rows.length === 1 ? "y" : "ies"}
      </Text>
    </RNView>
  );

  const EmptyBody = ({ message }: { message: string }) => (
    <RNView style={styles.empty}>
      <ActivityIndicator />
      <Text style={styles.emptyTitle}>{message}</Text>
      <Text style={styles.emptySub}>
        Entries appear here whenever the device pushes to <Text style={styles.bold}>/alarms</Text>.
      </Text>
    </RNView>
  );

  const Item: ListRenderItem<Row> = ({ item }) => (
    <Pressable onLongPress={() => confirmArchive(item)} delayLongPress={450}>
      <View style={[styles.card, styles.cardHigh]}>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Timestamp: </Text>
          {item.timestamp || "—"}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Value: </Text>
          {item.value}
        </Text>
        <Text style={styles.badge}>THRESHOLD EXCEEDED</Text>
      </View>
    </Pressable>
  );

  if (initialLoading) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyBody message="Connecting to /alarms…" />
      </View>
    );
  }

  if (!rows.length) {
    return (
      <View style={{ flex: 1, paddingTop: 20 }}>
        <FlatList
          data={[] as Row[]}
          keyExtractor={(_, i) => `empty-${i}`}
          renderItem={() => null}
          ListHeaderComponent={Header}
          ListEmptyComponent={<EmptyBody message="No alarm logs yet" />}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarH + 24 }]}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={rows}
        keyExtractor={(it) => it.id}
        renderItem={Item}
        ListHeaderComponent={Header}
        contentContainerStyle={[styles.listContent, { gap: 14, paddingBottom: tabBarH + 24 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { opacity: 0.6 },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 10 },
  emptyTitle: { marginTop: 8, fontWeight: "700" },
  emptySub: { textAlign: "center", opacity: 0.7, marginBottom: 8 },

  card: {
    minHeight: 90,
    borderRadius: 12,
    backgroundColor: "rgba(64,148,255,0.20)",
    padding: 12,
    justifyContent: "space-between",
  },
  cardHigh: { backgroundColor: "rgba(215, 38, 56, 0.12)" },
  cardText: { fontSize: 14 },
  bold: { fontWeight: "700" },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    overflow: "hidden",
    backgroundColor: "rgba(215, 38, 56, 0.2)",
  },
});
