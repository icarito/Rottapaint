import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, RefreshControl, ScrollView } from "react-native";
import { useRouter, type Href } from "expo-router";
import { fetchGeoPlayers, getToken } from "@/api/client";
import type { GeoPlayer } from "@/types";

function PlayerDot({ player }: { player: GeoPlayer }) {
  const statusColors: Record<string, string> = {
    connected: "#69F0AE",
    recent: "#FFD740",
    old: "#607589",
  };
  const color = statusColors[player.status] || "#607589";

  return (
    <View style={styles.dotRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.dotInfo}>
        <Text style={styles.dotName} numberOfLines={1}>
          {player.display_name || player.player_id.slice(0, 12)}
        </Text>
        <Text style={styles.dotLocation}>
          {player.city}, {player.country_code}
        </Text>
      </View>
      <Text style={styles.dotStatus}>{player.status}</Text>
    </View>
  );
}

export default function GlobeScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<GeoPlayer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/auth" as Href)  // eslint-disable-line;
        return;
      }
      const data = await fetchGeoPlayers();
      setPlayers(data);
    } catch (e) {
      console.warn("Failed to load geo players:", e);
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

  const connected = players.filter((p) => p.status === "connected").length;
  const recent = players.filter((p) => p.status === "recent").length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Globe</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{connected}</Text>
          <Text style={styles.statLabel}>Connected</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{recent}</Text>
          <Text style={styles.statLabel}>Recent</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{players.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
      <View style={styles.list}>
        {players.map((p) => (
          <PlayerDot key={`${p.player_id}-${p.latitude}`} player={p} />
        ))}
      </View>
    </ScrollView>
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
    paddingBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#131822",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E2A3A",
  },
  statValue: { color: "#E0E0E0", fontSize: 24, fontWeight: "700" },
  statLabel: { color: "#607589", fontSize: 12, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2A3A",
    gap: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotInfo: { flex: 1 },
  dotName: { color: "#E0E0E0", fontSize: 13, fontWeight: "600" },
  dotLocation: { color: "#607589", fontSize: 11, marginTop: 2 },
  dotStatus: { color: "#506070", fontSize: 11, textTransform: "capitalize" },
});
