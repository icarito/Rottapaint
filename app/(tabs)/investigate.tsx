import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useRouter, type Href } from "expo-router";
import type { IncidentGroup } from "@/types";
import { fetchIncidents, getToken } from "@/api/client";

export default function InvestigateScreen() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/auth" as Href)  // eslint-disable-line;
        return;
      }
      const data = await fetchIncidents({ status: "open" });
      setIncidents(data);
    } catch (e) {
      console.warn("Failed to load incidents for investigate:", e);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/investigation/${id}` as Href);
    },
    [router],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Investigate</Text>
      <Text style={styles.subtitle}>Open incidents requiring triage</Text>
      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handlePress(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardType}>
              {item.type === "low_fps" ? "Low FPS" : "Hotzone"}
            </Text>
            <Text style={styles.cardScene}>
              {item.scene}{item.zone ? ` / ${item.zone}` : ""}
            </Text>
            <Text style={styles.cardMeta}>
              {item.count} occurrences | Last:{" "}
              {new Date(item.last_seen * 1000).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No open incidents</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E14" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E0E0E0",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#607589",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: "#131822",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1E2A3A",
  },
  cardType: { color: "#FF5252", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  cardScene: { color: "#E0E0E0", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  cardMeta: { color: "#607589", fontSize: 12 },
  empty: { color: "#607589", fontSize: 14, textAlign: "center", marginTop: 40 },
});
