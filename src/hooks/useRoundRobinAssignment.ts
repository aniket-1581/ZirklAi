import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef } from "react";

export function useRoundRobinAssignment<T>(pool: T[], persistKey?: string) {
  const assignedRef = useRef<{ [id: string]: T }>({});
  const indexRef = useRef(0);

  async function load() {
    if (!persistKey) return;
    const stored = await AsyncStorage.getItem(persistKey);
    if (stored) {
      const data = JSON.parse(stored);
      assignedRef.current = data.assigned || {};
      indexRef.current = data.index || 0;
    }
  }

  function save() {
    if (!persistKey) return;
    AsyncStorage.setItem(
      persistKey,
      JSON.stringify({
        assigned: assignedRef.current,
        index: indexRef.current,
      })
    );
  }

  function assign(id: string): T {
    if (assignedRef.current[id]) {
      return assignedRef.current[id];
    }

    const chosen = pool[indexRef.current % pool.length];
    indexRef.current += 1;

    assignedRef.current[id] = chosen;
    save();

    return chosen;
  }

  return { assign, load };
}
