// app/(tabs)/archive.tsx
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { View, Text } from "@/components/Themed";
import { useFocusEffect } from "expo-router";
import { db } from "../../firebaseConfig";
import { ref, get, remove } from "firebase/database";

type Row = { id: string; date: string; time: string; value: number };

export default function ArchiveScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const parseDateTime = (ts?: string): { date: string; time: string } => {
    if (!ts) return { date: "—", time: "—" };
    const [date, time] = ts.split("T");
    return { date: date || "—", time: (time || "—").replace("Z", "") };
  };

  const loadArchives = useCallback(async () => {
    try {
      setLoading(true);
      const snap = await get(ref(db, "/archives"));
      if (!snap.exists()) {
        setRows([]);
        setLoading(false);
        return;
      }
      const raw = snap.val() as Record<string, { timestamp?: string; value?: number }>;

      const items: Row[] = Object.entries(raw).map(([id, v]) => {
        const { date, time } = parseDateTime(v?.timestamp);
        return { id, date, time, value: Number(v?.value ?? 0) };
      });

      items.sort((a, b) => (a.id > b.id ? -1 : 1)); // newest first
      setRows(items);
    } catch (e) {
      console.error("Failed to load /archives:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  useFocusEffect(
    useCallback(() => {
      loadArchives();
    }, [loadArchives])
  );

  const confirmDelete = (item: Row) => {
    Alert.alert(
      "Delete archived entry?",
      `Date: ${item.date}\nTime: ${item.time}\nValue: ${item.value}\n\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(ref(db, `/archives/${item.id}`));
              setRows((prev) => prev.filter((r) => r.id !== item.id));
            } catch (e: any) {
              console.error("Failed to delete archive:", e);
              Alert.alert("Delete failed", String(e?.message ?? e));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const Header = () => (
    <View style={[styles.row, styles.head]}>
      <Text style={[styles.cell, styles.cellDate]}>Date</Text>
      <Text style={[styles.cell, styles.cellTime]}>Time</Text>
      <Text style={[styles.cell, styles.cellRead]}>Reading</Text>
      <Text style={[styles.cell, styles.cellAction]}> </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: 20, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, opacity: 0.7 }}>Loading archives…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 20 }}>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, styles.cellDate]}>{item.date}</Text>
            <Text style={[styles.cell, styles.cellTime]}>{item.time}</Text>
            <Text style={[styles.cell, styles.cellRead]}>{item.value}</Text>

            {/* Delete icon (no extra deps) */}
            <Pressable
              onPress={() => confirmDelete(item)}
              hitSlop={10}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.date} ${item.time}`}
            >
              <Text style={styles.icon}>❌</Text>
            </Pressable>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ padding: 16, alignItems: "center" }}>
            <Text style={{ opacity: 0.7 }}>No archived entries yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: "rgba(0,0,0,0.04)" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  cell: { fontSize: 16 },
  cellDate: { width: 120 },
  cellTime: { width: 90 },
  cellRead: { flex: 1 },
  cellAction: { width: 40, textAlign: "right" },

  iconBtn: { width: 40, alignItems: "flex-end" },
  icon: { fontSize: 18, lineHeight: 18 },
});
