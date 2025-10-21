// app/(tabs)/home.tsx
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  ImageBackground,
  View,
  Text,
  Pressable,
} from "react-native";
import GasGauge from "@/components/GasGauge";
import { getAlarmStatus, getLatest, sendResetCommand } from "@/lib/serverApi";
import { GAS_THRESHOLD } from "@/lib/constants";

const bg = require("../../assets/images/bg.jpg");
const POLL_MS = 1000;

export default function Home() {
  const [g1, setG1] = useState(0);
  const [g2, setG2] = useState(0);
  const [g3, setG3] = useState(0);
  const [alarmOn, setAlarmOn] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const poll = async () => {
      try {
        const [latest, status] = await Promise.all([getLatest(), getAlarmStatus()]);
        if (!mounted.current) return;
        setG1(latest.gas1 || 0);
        setG2(latest.gas2 || 0);
        setG3(latest.gas3 || 0);
        setAlarmOn(!!status.alarmOn);
      } catch (e) {
        if (__DEV__) console.warn("poll error", e);
      }
    };

    // initial fetch then interval
    poll();
    pollRef.current = setInterval(poll, POLL_MS);

    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, []);

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

  const maxVal = Math.max(g1, g2, g3);

  return (
    <ImageBackground source={bg} style={styles.bg} imageStyle={styles.bgImage} resizeMode="cover">
      <View style={styles.container}>
        {/* Top Section: Title and Sensors */}
        <View style={styles.topSection}>
          <View style={styles.col}>
            <GasGauge label="Sensor 1" value={g1} max={1000} />
            <GasGauge label="Sensor 2" value={g2} max={1000} />
            <GasGauge label="Sensor 3" value={g3} max={1000} />
          </View>
        </View>

        {/* Bottom Section: Status and Button */}
        <View style={styles.bottomSection}>
          <View style={styles.statusBox}>
            <Text style={[styles.statusText, alarmOn ? styles.danger : styles.ok]}>
              {alarmOn ? `ALARM: ${maxVal} ≥ ${GAS_THRESHOLD}` : ""}
            </Text>
          </View>

          {/* Always visible Turn Off button */}
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

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { opacity: 0.85 },

  container: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 40,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  bottomSection: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingTop: 20,
  },
  title: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
  },
  col: {
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
    paddingVertical: 20,
  },
  statusBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 14,
  },
  statusText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  ok: { color: "#9BE38A" },
  danger: { color: "#FFD966" },

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
