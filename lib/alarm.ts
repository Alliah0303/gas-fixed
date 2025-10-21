// client/lib/alarm.ts
// Fetch from Firebase RTDB *based on your current firmware* (no /latest, /status, /readings).

import { GAS_THRESHOLD, DB_ROOT as DB } from "./constants";

export type AlarmStatus = { alarmOn: boolean };
export type LatestTriple = { gas1: number; gas2: number; gas3: number; ts?: number };
export type Reading = { id: string; date: string; time: string; value: number };

// ---- Safe JSON fetch that never throws on empty bodies ----
async function getJSON<T>(url: string): Promise<T | null> {
  const r = await fetch(url);
  const text = await r.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// Format a unix timestamp *in seconds* into local date & time strings.
function fmtFromUnixSeconds(tsSec: number) {
  const d = new Date(tsSec * 1000);
  const date = d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replaceAll("/", "-");
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  return { date, time };
}

// Fallback if a reading has no timestamp: use "now"
function fmtNow() {
  const d = new Date();
  const date = d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replaceAll("/", "-");
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  return { date, time };
}

// ---- Public API used by screens ----

// With current firmware, there's no /status. We infer alarmOn from /maxGas > threshold.
// If /status ever appears in DB, we'll use it preferentially.
export async function getAlarmStatus(): Promise<AlarmStatus> {
  const fromStatus = await getJSON<{ alarmOn?: boolean }>(`${DB}/status.json`);
  if (typeof fromStatus?.alarmOn === "boolean") {
    return { alarmOn: !!fromStatus.alarmOn };
  }

  // Fallback: infer from /maxGas
  const maxGas = await getJSON<number>(`${DB}/maxGas.json`);
  return { alarmOn: Number(maxGas ?? 0) > GAS_THRESHOLD };
}

// With current firmware, there's no /latest. We assemble it from /gas1,/gas2,/gas3 and synthesize ts=now.
export async function getLatest(): Promise<LatestTriple> {
  const [g1, g2, g3] = await Promise.all([
    getJSON<number>(`${DB}/gas1.json`),
    getJSON<number>(`${DB}/gas2.json`),
    getJSON<number>(`${DB}/gas3.json`),
  ]);

  return {
    gas1: Number(g1 ?? 0),
    gas2: Number(g2 ?? 0),
    gas3: Number(g3 ?? 0),
    ts: Math.floor(Date.now() / 1000),
  };
}

// Send reset command directly to Firebase (match firmware: /resetFlag/reset)
export async function sendResetCommand(): Promise<boolean> {
  try {
    // 1) Pulse reset flag the firmware is polling
    const r1 = await fetch(`${DB}/resetFlag/reset.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "true",
    });
    if (!r1.ok) throw new Error(`resetFlag write failed: ${r1.status}`);

    // 2) Make UI consistent and allow firmware to short-circuit alarm conditions
    await Promise.all([
      fetch(`${DB}/status/alarmOn.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "false",
      }),
      fetch(`${DB}/maxGas.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "0",
      }),
    ]);

    // (Optional) You can clear the flag later if you add a second call; not required for your current firmware.
    return true;
  } catch (error) {
    console.error("Firebase reset command error:", error);
    return false;
  }
}

// Optimized Firebase readings with proper indexing and error handling
export async function getReadings(limit = 50): Promise<Reading[]> {
  try {
    const strategies = [
      `${DB}/readings.json?orderBy="ts"&limitToLast=${limit}`,
      `${DB}/readings.json?orderBy="timestamp"&limitToLast=${limit}`,
      `${DB}/readings.json?limitToLast=${limit}`,
      `${DB}/readings.json`,
    ];

    for (const url of strategies) {
      try {
        const raw = await getJSON<Record<string, any>>(url);
        if (raw && Object.keys(raw).length > 0) {
          const rows = Object.values(raw)
            .map((rec: any, idx: number) => {
              const ts: number | null =
                typeof rec?.ts === "number" ? rec.ts :
                typeof rec?.timestamp === "number" ? rec.timestamp : null;

              const value = Math.max(
                Number(rec?.gas1 ?? 0),
                Number(rec?.gas2 ?? 0),
                Number(rec?.gas3 ?? 0)
              );
              const { date, time } = ts ? fmtFromUnixSeconds(ts) : fmtNow();
              return {
                id: ts ? String(ts) : `row-${idx}`,
                date,
                time,
                value,
                _order: ts ?? Number.MAX_SAFE_INTEGER - idx,
              } as Reading & { _order: number };
            })
            .sort((a, b) => b._order - a._order)
            .map(({ _order, ...r }) => r)
            .slice(0, limit);

          return rows;
        }
      } catch {
        continue;
      }
    }

    // Fallback: synthesize readings from current gas sensor data
    const latest = await getLatest();
    const value = Math.max(latest.gas1, latest.gas2, latest.gas3);
    const { date, time } = latest.ts ? fmtFromUnixSeconds(latest.ts) : fmtNow();

    return [
      {
        id: latest.ts ? String(latest.ts) : "synthetic-0",
        date,
        time,
        value,
      },
    ];
  } catch (error) {
    console.error("❌ Firebase readings error:", error);
    return [];
  }
}
