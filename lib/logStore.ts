// lib/logStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LogEntry = { 
  id: string; 
  date: string; 
  time: string; 
  value: number;
  gas1: number;
  gas2: number;
  gas3: number;
  max: number;
  timestamp: number; // Unix timestamp for sorting
};

const LOG_STORAGE_KEY = 'gas_detection_logs';
const MAX_LOG_ENTRIES = 100; // Keep last 100 entries

// Get all stored log entries
export async function getStoredLogs(): Promise<LogEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    if (stored) {
      const logs = JSON.parse(stored);
      // Sort by timestamp descending (newest first)
      return logs.sort((a: LogEntry, b: LogEntry) => b.timestamp - a.timestamp);
    }
    return [];
  } catch (error) {
    console.error('Error loading stored logs:', error);
    return [];
  }
}

// Save log entries to storage
export async function saveLogs(logs: LogEntry[]): Promise<void> {
  try {
    // Keep only the most recent entries
    const limitedLogs = logs.slice(0, MAX_LOG_ENTRIES);
    await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(limitedLogs));
  } catch (error) {
    console.error('Error saving logs:', error);
  }
}

// Add a new log entry
export async function addLogEntry(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
  try {
    const existingLogs = await getStoredLogs();
    const newEntry: LogEntry = {
      ...entry,
      timestamp: Date.now(),
    };
    
    // Add new entry to the beginning (newest first)
    const updatedLogs = [newEntry, ...existingLogs];
    await saveLogs(updatedLogs);
    
    console.log('✅ New log entry added:', newEntry);
  } catch (error) {
    console.error('Error adding log entry:', error);
  }
}

// Remove a log entry by ID
export async function removeLogEntry(id: string): Promise<void> {
  try {
    const existingLogs = await getStoredLogs();
    const updatedLogs = existingLogs.filter(log => log.id !== id);
    await saveLogs(updatedLogs);
    
    console.log('🗑️ Log entry removed:', id);
  } catch (error) {
    console.error('Error removing log entry:', error);
  }
}

// Clear all logs
export async function clearAllLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOG_STORAGE_KEY);
    console.log('🧹 All logs cleared');
  } catch (error) {
    console.error('Error clearing logs:', error);
  }
}

// Force add a new entry (for testing and immediate detection)
export async function forceAddEntry(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
  try {
    const newEntry: LogEntry = {
      ...entry,
      timestamp: Date.now(),
    };
    
    const existingLogs = await getStoredLogs();
    const updatedLogs = [newEntry, ...existingLogs];
    await saveLogs(updatedLogs);
    
    console.log('🔧 Force added log entry:', newEntry);
  } catch (error) {
    console.error('Error force adding log entry:', error);
  }
}

// Always add entry (bypasses all detection logic)
export async function alwaysAddEntry(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
  try {
    const newEntry: LogEntry = {
      ...entry,
      timestamp: Date.now(),
    };
    
    const existingLogs = await getStoredLogs();
    const updatedLogs = [newEntry, ...existingLogs];
    await saveLogs(updatedLogs);
    
    console.log('🚀 Always added log entry (bypass detection):', newEntry);
  } catch (error) {
    console.error('Error always adding log entry:', error);
  }
}

// Check if we should add a new log entry based on gas sensor value changes
export async function shouldAddNewEntry(currentGas1: number, currentGas2: number, currentGas3: number): Promise<boolean> {
  try {
    const logs = await getStoredLogs();
    if (logs.length === 0) {
      console.log("🆕 No stored logs, this is first entry");
      return true; // First entry
    }
    
    const lastEntry = logs[0]; // Most recent entry
    console.log("🔍 Comparing with last entry:", {
      last: { gas1: lastEntry.gas1, gas2: lastEntry.gas2, gas3: lastEntry.gas3 },
      current: { gas1: currentGas1, gas2: currentGas2, gas3: currentGas3 }
    });
    
    // Consider it new data if any sensor value changed (threshold: 0 - any change)
    const threshold = 0;
    const gas1Change = Math.abs(currentGas1 - lastEntry.gas1);
    const gas2Change = Math.abs(currentGas2 - lastEntry.gas2);
    const gas3Change = Math.abs(currentGas3 - lastEntry.gas3);
    
    const hasSignificantChange = 
      gas1Change >= threshold ||
      gas2Change >= threshold ||
      gas3Change >= threshold;
    
    console.log("📊 Detection-based change analysis:", {
      gas1Change,
      gas2Change,
      gas3Change,
      threshold,
      hasSignificantChange,
      reason: hasSignificantChange ? "Significant change detected" : "No significant change"
    });
    
    return hasSignificantChange;
  } catch (error) {
    console.error('Error checking for detection-based entry:', error);
    return true; // Default to adding new data on error
  }
}
