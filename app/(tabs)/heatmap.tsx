import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, type Href } from "expo-router";
import { fetchScenes, fetchHeatmap, getToken } from "@/api/client";
import type { HeatmapCell } from "@/types";

export default function HeatmapScreen() {
  const router = useRouter();
  const [scenes, setScenes] = useState<string[]>([]);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          router.replace("/auth" as Href); // eslint-disable-line
          return;
        }
        const data = await fetchScenes();
        setScenes(data);
        if (data.length > 0) setSelectedScene(data[0]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.includes("fetch") || msg.includes("network") ? "Cannot reach central server." : msg);
      }
    })();
  }, [router]);

  const loadHeatmap = useCallback(async (scene: string) => {
    setError(null);
    try {
      const data = await fetchHeatmap(scene);
      setCells(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes("fetch") || msg.includes("network") ? "Failed to load heatmap data." : msg);
    }
  }, []);

  useEffect(() => {
    if (selectedScene) loadHeatmap(selectedScene);
  }, [selectedScene, loadHeatmap]);

  const maxCount = cells.reduce((max, c) => Math.max(max, c.count), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Heatmap</Text>
      <View style={styles.sceneRow}>
        {scenes.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.sceneBtn,
              selectedScene === s && styles.sceneBtnActive,
            ]}
            onPress={() => setSelectedScene(s)}
          >
            <Text
              style={[
                styles.sceneBtnText,
                selectedScene === s && styles.sceneBtnTextActive,
              ]}
            >
              {s.split("/").pop()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : cells.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            {selectedScene
              ? `No heatmap data for ${selectedScene.split("/").pop()} yet.`
              : "No scenes available."}
          </Text>
        </View>
      ) : (
        <View style={styles.gridWrap}>
          <View style={styles.grid}>
            {cells.slice(0, 200).map((cell, i) => {
              const intensity = cell.count / maxCount;
              const r = Math.round(10 + intensity * 28);
              const g = Math.round(14 + intensity * 15);
              const b = Math.round(26 + intensity * 30);
              return (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.6})`,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}
      {selectedScene && cells.length > 0 && (
        <View style={styles.legend}>
          <Text style={styles.legendText}>
            {selectedScene}: {cells.length} cells, {cells.reduce((sum, c) => sum + c.count, 0)}{" "}
            samples
          </Text>
        </View>
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
  sceneRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
    flexWrap: "wrap",
  },
  sceneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1E2A3A",
  },
  sceneBtnActive: { backgroundColor: "#FF7043" },
  sceneBtnText: { color: "#8090A0", fontSize: 13, fontWeight: "600" },
  sceneBtnTextActive: { color: "#0A0E14" },
  gridWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E2A3A",
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#0D1117",
  },
  cell: {
    width: "5%",
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: "#0D1117",
  },
  legend: { padding: 16 },
  legendText: { color: "#607589", fontSize: 12, textAlign: "center" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  emptyText: { color: "#607589", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
