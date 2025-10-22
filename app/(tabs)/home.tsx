// app/(tabs)/home.tsx
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Components
import GasGauge from "@/components/GasGauge";

// Utils & API
import { GAS_THRESHOLD } from "@/lib/constants";
import { getAlarmStatus, getLatest, sendResetCommand } from "@/lib/serverApi";

// Assets
const bg = require("../../assets/images/bg.jpg");

// Constants
const POLL_MS = 1000;
const NOTIFICATION_COOLDOWN_MS = 30000; // 30 seconds

export default function Home() {
  // State
  const [g1, setG1] = useState(0);
  const [g2, setG2] = useState(0);
  const [g3, setG3] = useState(0);
  const [alarmOn, setAlarmOn] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Refs
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const lastNotificationSent = useRef<number>(0);

  // Effects
  useEffect(() => {
    mounted.current = true;

    // Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }
    };
    requestPermissions();

    const poll = async () => {
      try {
        const [latest, status] = await Promise.all([getLatest(), getAlarmStatus()]);
        if (!mounted.current) return;
        
        const newG1 = latest.gas1 || 0;
        const newG2 = latest.gas2 || 0;
        const newG3 = latest.gas3 || 0;
        const maxVal = Math.max(newG1, newG2, newG3);
        
        setG1(newG1);
        setG2(newG2);
        setG3(newG3);
        setAlarmOn(!!status.alarmOn);

        // Send notification if threshold exceeded and not sent recently (prevent spam)
        if (maxVal >= GAS_THRESHOLD && Date.now() - lastNotificationSent.current > NOTIFICATION_COOLDOWN_MS) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🚨 Gas Alert!',
              body: `Gas level ${maxVal} exceeds threshold of ${GAS_THRESHOLD}. Sensor readings: S1:${newG1}, S2:${newG2}, S3:${newG3}`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Send immediately
          });
          lastNotificationSent.current = Date.now();
        }
      } catch (e) {
        if (__DEV__) console.warn("poll error", e);
      }
    };

    // Initial fetch then interval
    poll();
    pollRef.current = setInterval(poll, POLL_MS);

    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, []);

  // Event Handlers
  const handleReset = async () => {
    setResetLoading(true);
    try {
      const success = await sendResetCommand();
      if (success) {
        // Give the board a moment to act on /resetFlag/reset + /maxGas
        await new Promise((r) => setTimeout(r, 2000));
        const [latest, status] = await Promise.all([getLatest(), getAlarmStatus()]);
        if (mounted.current) {
          setG1(latest.gas1 || 0);
          setG2(latest.gas2 || 0);
          setG3(latest.gas3 || 0);
          setAlarmOn(!!status.alarmOn);
        }
      }
    } catch (error) {
      console.error("Reset command failed:", error);
    } finally {
      setResetLoading(false);
    }
  };

  // Computed Values
  const maxVal = Math.max(g1, g2, g3);

  // Render
  return (
    <ImageBackground source={bg} style={styles.bg} imageStyle={styles.bgImage} resizeMode="cover">
      <View style={styles.container}>
        {/* Top Section: Gas Sensors */}
        <View style={styles.topSection}>
          <View style={styles.sensorsContainer}>
            <GasGauge label="Sensor 1" value={g1} max={1000} />
            <GasGauge label="Sensor 2" value={g2} max={1000} />
            <GasGauge label="Sensor 3" value={g3} max={1000} />
          </View>
        </View>

        {/* Bottom Section: Status and Controls */}
        <View style={styles.bottomSection}>
          <View style={styles.statusBox}>
            <Text style={[styles.statusText, alarmOn ? styles.danger : styles.ok]}>
              {alarmOn ? `ALARM: ${maxVal} ≥ ${GAS_THRESHOLD}` : ""}
            </Text>
          </View>

          <View style={styles.turnOffContainer}>
            <Pressable
              style={[styles.turnOffButton, resetLoading && styles.turnOffButtonLoading]}
              onPress={handleReset}
              disabled={resetLoading}
            >
              <Text style={styles.turnOffButtonText}>
                {resetLoading ? "Turning off…" : "Turn Off"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

// Styles
const styles = StyleSheet.create({
  // Background
  bg: { 
    flex: 1 
  },
  bgImage: { 
    opacity: 0.85 
  },

  // Layout
  container: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 40,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },

  // Top Section
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  sensorsContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
    paddingVertical: 20,
  },

  // Bottom Section
  bottomSection: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingTop: 20,
  },

  // Status
  statusBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 14,
  },
  statusText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 16 
  },
  ok: { 
    color: "#9BE38A" 
  },
  danger: { 
    color: "#FFD966" 
  },

  // Turn Off Button
  turnOffContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 10,
  },
  turnOffButton: {
    minWidth: 160,
    maxWidth: 350,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: "#D72638",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  turnOffButtonLoading: {
    backgroundColor: "#A0A0A0",
  },
  turnOffButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});