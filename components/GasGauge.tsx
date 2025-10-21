// components/GasGauge.tsx
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}
function num(n: any, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export default function GasGauge({
  label,
  value,
  max = 1000,
  size = 180,
  strokeWidth = 14,
}: {
  label: string;
  value: number | undefined | null;
  max?: number;
  size?: number;
  strokeWidth?: number;
}) {
  const _size = num(size, 160);
  const _sw = num(strokeWidth, 14);
  const radius = Math.max((_size - _sw) / 2, 1);
  const circumference = 2 * Math.PI * radius;

  const v = num(value, 0);
  const m = Math.max(num(max, 1000), 1);
  const pct = clamp(v / m, 0, 1);

  // Never pass NaN/Infinity into SVG
  const dashArray = `${circumference} ${circumference}`;
  const dashOffset = num(circumference * (1 - pct), 0);

  return (
    <View style={styles.wrap}>
      <View style={{ width: _size, height: _size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={_size} height={_size} viewBox={`0 0 ${_size} ${_size}`}>
          <Circle
            cx={_size / 2}
            cy={_size / 2}
            r={radius}
            stroke="rgba(64,148,255,0.18)"
            strokeWidth={_sw}
            fill="none"
          />
          <Circle
            cx={_size / 2}
            cy={_size / 2}
            r={radius}
            stroke="#4094FF"
            strokeWidth={_sw}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${_size / 2} ${_size / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{Number.isFinite(v) ? Math.round(v) : 0}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  label: { color: "#ffffff", opacity: 0.9, marginBottom: 2, fontSize: 13 },
  value: { color: "#ffffff", fontSize: 28, fontWeight: "800" },
});

