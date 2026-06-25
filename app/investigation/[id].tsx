import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Svg, { Polyline, Line, Rect, G } from "react-native-svg";
import { useLocalSearchParams } from "expo-router";
import type {
  IncidentGroup,
  SessionSample,
  FloorplanProjection,
} from "@/types";
import {
  fetchIncident,
  fetchIncidentSamples,
  setIncidentStatus,
} from "@/api/client";
import { InvestigationCharts } from "@/components/InvestigationCharts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAD = 16;
const PLOT_W = SCREEN_WIDTH - PAD * 2;
const TIMELINE_H = 140;
const MAP_H = 280;
const GRID_COLOR = "#1E2A3A";
const AXIS_COLOR = "#2A3A4A";
const FPS_COLOR = "#4FC3F7";
const TRAJECTORY_COLOR = "#FF7043";

function buildFpsPoints(samples: SessionSample[]): string {
  if (samples.length < 2) return "";
  const startTime = samples[0].timestamp;
  const duration = samples[samples.length - 1].timestamp - startTime || 1;
  return samples
    .map((s) => {
      const t = (s.timestamp - startTime) / duration;
      const x = t * PLOT_W;
      const y = TIMELINE_H - Math.max(0, Math.min(1, s.fps / 60)) * (TIMELINE_H - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildTrajectoryPoints(
  samples: SessionSample[],
  proj: FloorplanProjection,
): string {
  if (samples.length < 2) return "";
  const w = proj.world_max_x - proj.world_min_x;
  const h = proj.world_max_z - proj.world_min_z;
  if (w <= 0 || h <= 0) return "";
  return samples
    .map((s) => {
      const sx = ((s.pos_x - proj.world_min_x) / w) * PLOT_W;
      const sy = ((s.pos_z - proj.world_min_z) / h) * MAP_H;
      return `${sx.toFixed(1)},${sy.toFixed(1)}`;
    })
    .join(" ");
}

function computeProjection(samples: SessionSample[]): FloorplanProjection {
  if (samples.length === 0) {
    return { world_min_x: -50, world_min_z: -50, world_max_x: 50, world_max_z: 50, scale: 1 };
  }
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const s of samples) {
    if (s.pos_x < minX) minX = s.pos_x;
    if (s.pos_x > maxX) maxX = s.pos_x;
    if (s.pos_z < minZ) minZ = s.pos_z;
    if (s.pos_z > maxZ) maxZ = s.pos_z;
  }
  const pad = Math.max((maxX - minX) * 0.1, 5, (maxZ - minZ) * 0.1);
  return {
    world_min_x: minX - pad,
    world_min_z: minZ - pad,
    world_max_x: maxX + pad,
    world_max_z: maxZ + pad,
    scale: 1,
  };
}

function FPSChart({ samples }: { samples: SessionSample[] }) {
  const points = useMemo(() => buildFpsPoints(samples), [samples]);
  if (!points) {
    return (
      <View style={styles.chartWrap}>
        <Text style={styles.emptyText}>Not enough data for timeline</Text>
      </View>
    );
  }

  const yTicks = [0, 15, 30, 45, 60];
  return (
    <Svg width={SCREEN_WIDTH} height={TIMELINE_H + 20}>
      <G x={PAD}>
        {yTicks.map((v) => {
          const y = TIMELINE_H - (v / 60) * (TIMELINE_H - 4);
          return (
            <React.Fragment key={`fps-tick-${v}`}>
              <Line x1={0} y1={y} x2={PLOT_W} y2={y} stroke={GRID_COLOR} strokeWidth={0.5} />
            </React.Fragment>
          );
        })}
        <Line x1={0} y1={TIMELINE_H} x2={PLOT_W} y2={TIMELINE_H} stroke={AXIS_COLOR} strokeWidth={1} />
        <Polyline
          points={points}
          fill="none"
          stroke={FPS_COLOR}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

function TrajectoryMap({
  samples,
  projection,
}: {
  samples: SessionSample[];
  projection: FloorplanProjection;
}) {
  const points = useMemo(
    () => buildTrajectoryPoints(samples, projection),
    [samples, projection],
  );
  if (!points) {
    return (
      <View style={styles.chartWrap}>
        <Text style={styles.emptyText}>Not enough data for trajectory map</Text>
      </View>
    );
  }

  return (
    <Svg width={SCREEN_WIDTH} height={MAP_H + 20}>
      <G x={PAD}>
        <Rect
          x={0}
          y={0}
          width={PLOT_W}
          height={MAP_H}
          fill="#0D1117"
          stroke={AXIS_COLOR}
          strokeWidth={1}
          rx={4}
        />
        <Polyline
          points={points}
          fill="none"
          stroke={TRAJECTORY_COLOR}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

function SvgInvestigationCharts({
  samples,
  projection,
}: {
  samples: SessionSample[];
  projection: FloorplanProjection;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>FPS Timeline</Text>
      <FPSChart samples={samples} />
      <Text style={styles.sectionTitle}>Trajectory (top-down)</Text>
      <TrajectoryMap samples={samples} projection={projection} />
    </View>
  );
}

export default function InvestigationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentGroup | null>(null);
  const [samples, setSamples] = useState<SessionSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [inc, samps] = await Promise.all([
        fetchIncident(id),
        fetchIncidentSamples(id),
      ]);
      setIncident(inc);
      setSamples(samps);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes("fetch") || msg.includes("network") ? "Cannot reach central server." : msg);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const projection = useMemo(() => computeProjection(samples), [samples]);

  const handleStatus = useCallback(
    async (status: "open" | "known" | "resolved" | "dismissed") => {
      if (!id) return;
      try {
        const updated = await setIncidentStatus(id, status);
        setIncident(updated);
      } catch (e) {
        console.warn("Status change failed:", e);
      }
    },
    [id],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{error || "Incident not found."}</Text>
        </View>
      </View>
    );
  }

  const hasSamples = samples.length > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerType}>
          {incident.type === "low_fps" ? "Low FPS" : "Hotzone"}
        </Text>
        <Text style={styles.headerScene}>
          {incident.scene}
          {incident.zone ? ` / ${incident.zone}` : ""}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Status</Text>
          <Text style={styles.metaValue}>{incident.status}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Count</Text>
          <Text style={styles.metaValue}>{incident.count}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Last Seen</Text>
          <Text style={styles.metaValue}>
            {new Date(incident.last_seen * 1000).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text style={styles.metaBuilds}>
        Builds: {incident.builds_seen.join(", ") || "none"}
      </Text>

      {hasSamples ? (
        <InvestigationCharts
          samples={samples}
          projection={projection}
          fallback={<SvgInvestigationCharts samples={samples} projection={projection} />}
        />
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            No positional samples for this incident. Ghost data may have expired or the session was too short.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionKnown]}
          onPress={() => handleStatus("known")}
        >
          <Text style={styles.actionText}>Mark Known</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionResolved]}
          onPress={() => handleStatus("resolved")}
        >
          <Text style={styles.actionText}>Mark Resolved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDismissed]}
          onPress={() => handleStatus("dismissed")}
        >
          <Text style={styles.actionText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E14" },
  loading: { color: "#607589", fontSize: 16, textAlign: "center", marginTop: 60 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerType: { color: "#FF5252", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  headerScene: { color: "#E0E0E0", fontSize: 20, fontWeight: "700" },
  metaRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 4,
  },
  metaItem: {
    flex: 1,
    backgroundColor: "#131822",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1E2A3A",
  },
  metaLabel: { color: "#607589", fontSize: 11 },
  metaValue: { color: "#E0E0E0", fontSize: 15, fontWeight: "600", marginTop: 2 },
  metaBuilds: {
    color: "#506070",
    fontSize: 11,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#8090A0",
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chartWrap: { height: TIMELINE_H + 20, alignItems: "center", justifyContent: "center" },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionKnown: { backgroundColor: "#E65100" },
  actionResolved: { backgroundColor: "#1B5E20" },
  actionDismissed: { backgroundColor: "#37474F" },
  actionText: { color: "#E0E0E0", fontSize: 13, fontWeight: "700" },
  emptyWrap: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24 },
  emptyText: { color: "#607589", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
