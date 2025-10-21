// app/(tabs)/log.tsx
import { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  FlatList,
  View as RNView,
  ActivityIndicator,
  ListRenderItem,
  Pressable,
  Alert,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { View, Text } from "@/components/Themed";
import { getReadings } from "@/lib/serverApi";
import { addToArchive } from "@/lib/archiveStore";
import { getStoredLogs, removeLogEntry, alwaysAddEntry, LogEntry } from "@/lib/logStore";

type Row = LogEntry;
const THRESHOLD = 300;

export default function LogScreen() {
  const router = useRouter();
  const tabBarH = useBottomTabBarHeight();
  const [rows, setRows] = useState<Row[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastGasValues, setLastGasValues] = useState({ gas1: 0, gas2: 0, gas3: 0 });

  const load = useCallback(async () => {
    setInitialLoading(true);
    console.log("🔄 Loading persistent logs...");
    
    try {
      // Load stored logs first
      const storedLogs = await getStoredLogs();
      console.log("📚 Loaded stored logs:", storedLogs.length, "items");
      
      // Filter to show ONLY high gas entries (red background entries)
      const highGasLogs = storedLogs.filter(log => log.max >= THRESHOLD);
      console.log("🚨 High gas logs only:", highGasLogs.length, "items");
      setRows(highGasLogs);
      
      // Get current Firebase data
      const firebaseData = await getReadings(1); // Just get latest reading
      console.log("🔥 Firebase data:", firebaseData);
      
      if (firebaseData.length > 0) {
        const currentReading = firebaseData[0];
        const currentGasValues = {
          gas1: currentReading.gas1,
          gas2: currentReading.gas2,
          gas3: currentReading.gas3
        };
        
        console.log("🔍 Current Firebase values:", currentGasValues);
        console.log("🔍 Last known values:", lastGasValues);
        
        // Only add entry if it's a high gas level (above threshold)
        const maxGas = Math.max(currentGasValues.gas1, currentGasValues.gas2, currentGasValues.gas3);
        const isHighGas = maxGas >= THRESHOLD;
        
        console.log("🔍 Max gas level:", maxGas, "Threshold:", THRESHOLD, "Is high gas:", isHighGas);
        
        if (isHighGas) {
          // Check if we already have a very recent high gas entry (within last 30 seconds)
          const hasVeryRecentEntry = storedLogs.some(log => {
            const logTime = log.timestamp;
            const timeDiff = Date.now() - logTime;
            return timeDiff < (30 * 1000) && log.max >= THRESHOLD; // Within 30 seconds and high gas
          });
          
          console.log("🔍 Has very recent high gas entry (within 30s):", hasVeryRecentEntry);
          
          if (!hasVeryRecentEntry) {
            console.log("🚨 HIGH GAS DETECTED: Adding new high gas log entry...");
            await alwaysAddEntry({
              id: String(Date.now()),
              date: currentReading.date,
              time: currentReading.time,
              value: currentReading.value,
              gas1: currentReading.gas1,
              gas2: currentReading.gas2,
              gas3: currentReading.gas3,
              max: currentReading.max,
            });
            
            // Reload and filter to show only high gas entries
            const updatedLogs = await getStoredLogs();
            const updatedHighGasLogs = updatedLogs.filter(log => log.max >= THRESHOLD);
            setRows(updatedHighGasLogs);
            console.log("✅ HIGH GAS: New high gas entry added, total high gas logs:", updatedHighGasLogs.length);
          } else {
            console.log("⏸️ Very recent high gas entry exists (within 30s), skipping to prevent spam");
          }
        } else {
          console.log("⏸️ Gas levels normal, no high gas detected - no entry added");
        }
        
        setLastGasValues(currentGasValues);
      }
    } catch (error) {
      console.error("❌ Error loading logs:", error);
    }
    
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll for high gas levels every 3 seconds (continuous detection)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        console.log("🔄 CONTINUOUS DETECTION: Checking Firebase for high gas levels...");
        
        const firebaseData = await getReadings(1);
        if (firebaseData.length > 0) {
          const currentReading = firebaseData[0];
          const currentGasValues = {
            gas1: currentReading.gas1,
            gas2: currentReading.gas2,
            gas3: currentReading.gas3
          };
          
          console.log("🔍 Current Firebase values:", currentGasValues);
          console.log("🔍 Last known values:", lastGasValues);
          
          // HIGH GAS DETECTION: Add entry if gas levels are HIGH (above threshold)
          const maxGas = Math.max(currentGasValues.gas1, currentGasValues.gas2, currentGasValues.gas3);
          const isHighGas = maxGas >= THRESHOLD;
          
          console.log("🔍 Max gas level:", maxGas, "Threshold:", THRESHOLD, "Is high gas:", isHighGas);
          
          if (isHighGas) {
            // Check if this is a new high gas detection (different from last known values)
            const hasChanged = 
              currentGasValues.gas1 !== lastGasValues.gas1 ||
              currentGasValues.gas2 !== lastGasValues.gas2 ||
              currentGasValues.gas3 !== lastGasValues.gas3;
            
            console.log("🔍 Gas values changed:", hasChanged);
            
            if (hasChanged || lastGasValues.gas1 === 0) { // First detection or values changed
              console.log("🚨 NEW HIGH GAS DETECTED: Adding new log entry...");
              await alwaysAddEntry({
                id: String(Date.now()),
                date: currentReading.date,
                time: currentReading.time,
                value: currentReading.value,
                gas1: currentReading.gas1,
                gas2: currentReading.gas2,
                gas3: currentReading.gas3,
                max: currentReading.max,
              });
              
              // Update the display - filter to show only high gas entries
              const updatedLogs = await getStoredLogs();
              const updatedHighGasLogs = updatedLogs.filter(log => log.max >= THRESHOLD);
              setRows(updatedHighGasLogs);
              setLastGasValues(currentGasValues);
              console.log("✅ NEW HIGH GAS: Entry added, total high gas logs:", updatedHighGasLogs.length);
            } else {
              console.log("⏸️ Same high gas values, no new detection");
            }
          } else {
            console.log("⏸️ Gas levels normal, no high gas detected");
            // Update last known values even for normal levels
            setLastGasValues(currentGasValues);
          }
        }
      } catch (error) {
        console.error("❌ Error in continuous detection polling:", error);
      }
    }, 3000); // Poll every 3 seconds (faster detection)

    return () => clearInterval(pollInterval);
  }, [lastGasValues]);


  const onLongPressRow = (item: Row) => {
    Alert.alert(
      "Choose action",
      `${item.date} • ${item.time}\nGas1: ${item.gas1}\nGas2: ${item.gas2}\nGas3: ${item.gas3}\nMax: ${item.max}`,
      [
        {
          text: "Archive",
          onPress: async () => {
            addToArchive(item);
            await removeLogEntry(item.id);
            const updatedLogs = await getStoredLogs();
            setRows(updatedLogs);
            router.push("/(tabs)/archive");
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeLogEntry(item.id);
            const updatedLogs = await getStoredLogs();
            setRows(updatedLogs);
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const Header = () => (
    <RNView style={styles.header}>
      <Text style={styles.title}>High Gas Alerts</Text>
      <Text style={styles.subtitle}>Continuous detection of high gas levels</Text>
    </RNView>
  );

  const EmptyBody = ({ message }: { message: string }) => (
    <RNView style={styles.empty}>
      <ActivityIndicator />
      <Text style={styles.emptyTitle}>{message}</Text>
      <Text style={styles.emptySub}>No high gas alerts yet. Only dangerous gas levels will appear here.</Text>
    </RNView>
  );

  const Item: ListRenderItem<Row> = ({ item }) => (
    <Pressable onLongPress={() => onLongPressRow(item)} delayLongPress={450}>
      <View style={[styles.card, item.max >= THRESHOLD && styles.cardHigh]}>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Date: </Text>
          {item.date}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Time: </Text>
          {item.time}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Reading: </Text>
        </Text>
        <Text style={styles.gasReading}>
          <Text style={styles.bold}>     Gas Sensor 1: </Text>
          {item.gas1}
        </Text>
        <Text style={styles.gasReading}>
          <Text style={styles.bold}>     Gas Sensor 2: </Text>
          {item.gas2}
        </Text>
        <Text style={styles.gasReading}>
          <Text style={styles.bold}>     Gas Sensor 3: </Text>
          {item.gas3}
        </Text>
        <Text style={styles.gasReading}>
          <Text style={styles.bold}>     Max Gas Detected: </Text>
          {item.max}
        </Text>
      </View>
    </Pressable>
  );

  if (initialLoading) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyBody message="Loading logs…" />
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
          ListEmptyComponent={<EmptyBody message="No logs yet" />}
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
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { opacity: 0.6 },
  testButton: {
    backgroundColor: "rgba(64,148,255,0.20)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  testButtonText: {
    color: "#4094ff",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 10 },
  emptyTitle: { marginTop: 8, fontWeight: "700" },
  emptySub: { textAlign: "center", opacity: 0.7, marginBottom: 8 },

  card: {
    height: 160,
    borderRadius: 12,
    backgroundColor: "rgba(64,148,255,0.20)",
    padding: 12,
    justifyContent: "space-between",
  },
  cardHigh: { backgroundColor: "rgba(215, 38, 56, 0.12)" },
  cardText: { fontSize: 14 },
  gasReading: { fontSize: 14, marginLeft: 8 },
  bold: { fontWeight: "700" },
});
