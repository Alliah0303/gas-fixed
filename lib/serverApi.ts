// Firebase API client for direct Firebase Realtime Database access
// This file provides Firebase integration without requiring a separate server

export type Reading = { 
  id: string; 
  date: string; 
  time: string; 
  value: number;
  gas1: number;
  gas2: number;
  gas3: number;
  max: number;
};
export type LatestTriple = { gas1: number; gas2: number; gas3: number; ts?: number };
export type AlarmStatus = { alarmOn: boolean };

// Get alarm status from Firebase
export async function getAlarmStatus(): Promise<AlarmStatus> {
  try {
    const DB_ROOT = "https://gas-detection-bd536-default-rtdb.firebaseio.com";
    
    // Try to get status from Firebase
    const statusResponse = await fetch(`${DB_ROOT}/status.json`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      if (typeof status?.alarmOn === "boolean") {
        return { alarmOn: !!status.alarmOn };
      }
    }
    
    // Fallback: infer from maxGas
    const maxGasResponse = await fetch(`${DB_ROOT}/maxGas.json`);
    if (maxGasResponse.ok) {
      const maxGas = await maxGasResponse.json();
      return { alarmOn: Number(maxGas ?? 0) > 250 }; // Using GAS_THRESHOLD
    }
    
    return { alarmOn: false };
  } catch (error) {
    console.error('Firebase alarm status error:', error);
    return { alarmOn: false };
  }
}

// Get latest readings from Firebase
export async function getLatest(): Promise<LatestTriple> {
  try {
    const DB_ROOT = "https://gas-detection-bd536-default-rtdb.firebaseio.com";
    
    const [g1Response, g2Response, g3Response] = await Promise.all([
      fetch(`${DB_ROOT}/gas1.json`),
      fetch(`${DB_ROOT}/gas2.json`),
      fetch(`${DB_ROOT}/gas3.json`)
    ]);
    
    const g1 = g1Response.ok ? await g1Response.json() : 0;
    const g2 = g2Response.ok ? await g2Response.json() : 0;
    const g3 = g3Response.ok ? await g3Response.json() : 0;
    
    const result = {
      gas1: Number(g1 ?? 0),
      gas2: Number(g2 ?? 0),
      gas3: Number(g3 ?? 0),
      ts: Math.floor(Date.now() / 1000),
    };
    
    console.log("🔍 getLatest() returning:", result);
    return result;
  } catch (error) {
    console.error('Firebase latest readings error:', error);
    return { gas1: 0, gas2: 0, gas3: 0, ts: undefined };
  }
}

// Send reset command that ESP32 can actually receive
export async function sendResetCommand(): Promise<boolean> {
  try {
    const DB_ROOT = "https://gas-detection-bd536-default-rtdb.firebaseio.com";
    
    console.log('🔄 RESET: Sending reset command to Firebase for ESP32...');
    
    // ESP32 monitors these Firebase paths, so send commands there
    const resetPromises = [
      // Strategy 1: Set alarm status to false (ESP32 can monitor this)
      fetch(`${DB_ROOT}/status.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alarmOn: false })
      }),
      
      // Strategy 2: Set maxGas to 0 to trigger reset (ESP32 monitors maxGas)
      fetch(`${DB_ROOT}/maxGas.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(0)
      }),
      
      // Strategy 3: Add a reset flag that ESP32 can check
      fetch(`${DB_ROOT}/resetFlag.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timestamp: Date.now(),
          reset: true,
          trigger: true
        })
      })
    ];
    
    console.log('🔄 RESET: Sending multiple reset commands...');
    const results = await Promise.allSettled(resetPromises);
    
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.ok) {
        successCount++;
        console.log(`✅ RESET: Strategy ${index + 1} succeeded`);
      } else {
        console.warn(`⚠️ RESET: Strategy ${index + 1} failed:`, result);
      }
    });
    
    console.log(`🔄 RESET: ${successCount}/${results.length} Firebase reset commands sent`);
    
    // Wait for ESP32 to process the reset
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ RESET: Firebase reset commands completed');
    return successCount > 0;
  } catch (error) {
    console.error('❌ RESET: Firebase reset error:', error);
    return false;
  }
}

// Optimized Firebase readings with multiple strategies
export async function getReadings(limit = 50): Promise<Reading[]> {
  try {
    const DB_ROOT = "https://gas-detection-bd536-default-rtdb.firebaseio.com";
    
    // Multiple Firebase query strategies for better performance
    const strategies = [
      // Strategy 1: Optimized timestamp query with proper indexing
      `${DB_ROOT}/readings.json?orderBy="ts"&limitToLast=${limit}`,
      // Strategy 2: Alternative timestamp field
      `${DB_ROOT}/readings.json?orderBy="timestamp"&limitToLast=${limit}`,
      // Strategy 3: Simple readings without ordering (fallback)
      `${DB_ROOT}/readings.json?limitToLast=${limit}`,
      // Strategy 4: Basic readings endpoint
      `${DB_ROOT}/readings.json`
    ];

    for (const url of strategies) {
      try {
        const response = await fetch(url);
        
        if (response.ok) {
          const raw = await response.json();
          
          if (raw && Object.keys(raw).length > 0) {
            console.log(`✅ Firebase readings found using strategy: ${url.split('?')[1] || 'basic'}`);
            
            // Process Firebase readings data
            const readings = Object.values(raw).map((rec: any, idx: number) => {
              const ts = typeof rec?.ts === "number" ? rec.ts : 
                       typeof rec?.timestamp === "number" ? rec.timestamp : null;
              const gas1 = Number(rec?.gas1 ?? 0);
              const gas2 = Number(rec?.gas2 ?? 0);
              const gas3 = Number(rec?.gas3 ?? 0);
              const max = Math.max(gas1, gas2, gas3);
              const value = max; // Keep for backward compatibility
              const date = ts ? new Date(ts * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", "-") : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", "-");
              const time = ts ? new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
              
              return {
                id: ts ? String(ts) : `row-${idx}`,
                date,
                time,
                value,
                gas1,
                gas2,
                gas3,
                max,
              };
            });
            
            return readings.sort((a, b) => b.id.localeCompare(a.id)).slice(0, limit);
          }
        }
      } catch (strategyError) {
        console.warn(`⚠️ Firebase strategy failed: ${url.split('?')[1] || 'basic'}`, strategyError);
        continue; // Try next strategy
      }
    }

    // Fallback: synthesize from current gas readings
    console.log("📊 No Firebase readings found, synthesizing from current sensor data");
    const latest = await getLatest();
    console.log("🔍 Current sensor values:", { gas1: latest.gas1, gas2: latest.gas2, gas3: latest.gas3 });
    const gas1 = latest.gas1;
    const gas2 = latest.gas2;
    const gas3 = latest.gas3;
    const max = Math.max(gas1, gas2, gas3);
    const value = max; // Keep for backward compatibility
    console.log("📈 Max value calculated:", max);
    const now = new Date();
    const date = now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", "-");
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    
    const syntheticReading = {
      id: String(Date.now()),
      date,
      time,
      value,
      gas1,
      gas2,
      gas3,
      max,
    };
    console.log("🔄 Created synthetic reading:", syntheticReading);
    
    return [syntheticReading];
  } catch (error) {
    console.error('Firebase readings error:', error);
    return [];
  }
}

// Get all data at once (for initial page load)
export async function getSSRData(): Promise<{
  latest: LatestTriple;
  alarm: AlarmStatus;
  readings: Reading[];
} | null> {
  try {
    const [latest, alarm, readings] = await Promise.all([
      getLatest(),
      getAlarmStatus(),
      getReadings(50)
    ]);
    
    return { latest, alarm, readings };
  } catch (error) {
    console.error('SSR data error:', error);
    return null;
  }
}

