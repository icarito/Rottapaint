import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import type { IncidentGroup } from "@/types";
import { fetchIncidents, setIncidentStatus, getToken } from "@/api/client";

const STATUS_COLORS: Record<string, string> = {
  open: "#FF5252",
  known: "#FFD740",
  resolved: "#69F0AE",
  dismissed: "#607589",
};

const TYPE_LABELS: Record<string, string> = {
  low_fps: "Low FPS",
  hotzone: "Hotzone",
};

function IncidentCard({
  item,
  onStatusChange,
  onPress,
}: {
  item: IncidentGroup;
  onStatusChange: (id: string, status: string) => void;
  onPress: (id: string) => void;
}) {
  const statusColor = STATUS_COLORS[item.status] || "#888";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardType}>{TYPE_LABELS[item.type] || item.type}</Text>
        <Text style={styles.cardCount}>{item.count}x</Text>
      </View>
      <Text style={styles.cardScene}>{item.scene}{item.zone ? ` / ${item.zone}` : ""}</Text>
      <Text style={styles.cardMeta}>
        Last: {new Date(item.last_seen * 1000).toLocaleString()}
      </Text>
      <Text style={styles.cardBuilds}>
        Builds: {item.builds_seen.slice(-3).join(", ")}
      </Text>
      <View style={styles.cardActions}>
        {item.status === "open" && (
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: STATUS_COLORS.known }]}
            onPress={() => onStatusChange(item.id, "known")}
          >
            <Text style={[styles.actionText, { color: STATUS_COLORS.known }]}>
              Known
            </Text>
          </TouchableOpacity>
        )}
        {item.status !== "resolved" && (
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: STATUS_COLORS.resolved }]}
            onPress={() => onStatusChange(item.id, "resolved")}
          >
            <Text style={[styles.actionText, { color: STATUS_COLORS.resolved }]}>
              Resolve
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: STATUS_COLORS.dismissed }]}
          onPress={() => onStatusChange(item.id, "dismissed")}
        >
          <Text style={[styles.actionText, { color: STATUS_COLORS.dismissed }]}>
            Dismiss
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function InboxScreen() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("open");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/auth" as Href);  // eslint-disable-line
        return;
      }
      const data = await fetchIncidents({
        status: filter === "all" ? undefined : filter,
      });
      setIncidents(data);
      setConnected(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("401")) {
        setError("Invalid token. Sign out and re-authenticate.");
      } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed") || msg.includes("timeout")) {
        setError("Cannot reach the central server. Check API base and network.");
        setConnected(false);
      } else {
        setError(msg);
      }
    }
  }, [filter, router]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleStatusChange = useCallback(
    async (id: string, status: string) => {
      try {
        await setIncidentStatus(
          id,
          status as "open" | "known" | "resolved" | "dismissed",
        );
        await load();
      } catch (e) {
        console.warn("Status change failed:", e);
      }
    },
    [load],
  );

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/investigation/${id}` as Href);
    },
    [router],
  );

  const FILTERS = [
    { key: "open", label: "Open" },
    { key: "known", label: "Known" },
    { key: "all", label: "All" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>!</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IncidentCard
              item={item}
              onStatusChange={handleStatusChange}
              onPress={handlePress}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {connected
                  ? "No incidents yet. Data will appear as low FPS or hotzone events are detected."
                  : "Loading..."}
              </Text>
            </View>
          }
        />
      )}
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
    paddingBottom: 8,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1E2A3A",
  },
  filterBtnActive: { backgroundColor: "#4FC3F7" },
  filterText: { color: "#8090A0", fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#0A0E14" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: "#131822",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1E2A3A",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: "#0A0E14", fontSize: 10, fontWeight: "800" },
  cardType: { color: "#E0E0E0", fontSize: 15, fontWeight: "600", flex: 1 },
  cardCount: { color: "#8090A0", fontSize: 13 },
  cardScene: { color: "#4FC3F7", fontSize: 13, marginBottom: 4 },
  cardMeta: { color: "#607589", fontSize: 12, marginBottom: 4 },
  cardBuilds: { color: "#506070", fontSize: 11, marginBottom: 10 },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionText: { fontSize: 12, fontWeight: "600" },
  emptyWrap: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24 },
  emptyIcon: { color: "#FF7043", fontSize: 28, fontWeight: "800", marginBottom: 8 },
  emptyText: { color: "#607589", fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#1E2A3A",
    borderRadius: 8,
  },
  retryText: { color: "#4FC3F7", fontSize: 13, fontWeight: "600" },
});
