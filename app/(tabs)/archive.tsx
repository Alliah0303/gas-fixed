// app/(tabs)/archive.tsx
import { useCallback, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { View, Text } from "@/components/Themed";
import { useFocusEffect } from "expo-router";
import { getArchive } from "@/lib/archiveStore";

type Row = { id: string; date: string; time: string; value: number };

export default function ArchiveScreen() {
  const [rows, setRows] = useState<Row[]>([]);

  useFocusEffect(
    useCallback(() => {
      setRows(getArchive());
    }, [])
  );

  return (
    <View style={{ flex: 1, paddingTop: 20}}>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id + i.time}
        ListHeaderComponent={() => (
          <View style={[styles.row, styles.head]}>
            <Text style={[styles.cell, styles.cellDate]}>Date</Text>
            <Text style={[styles.cell, styles.cellTime]}>Time</Text>
            <Text style={[styles.cell, styles.cellRead]}>Reading</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, styles.cellDate]}>{item.date}</Text>
            <Text style={[styles.cell, styles.cellTime]}>{item.time}</Text>
            <Text style={[styles.cell, styles.cellRead]}>{item.value}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: "rgba(0,0,0,0.04)" },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  cell: { fontSize: 16 },
  cellDate: { width: 120 },
  cellTime: { width: 90 },
  cellRead: { flex: 1 },
});
