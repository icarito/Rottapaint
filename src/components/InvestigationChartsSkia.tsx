import React, { useMemo } from "react";
import { Dimensions, View, Text, StyleSheet } from "react-native";
import { Canvas, Path, Rect, Skia } from "@shopify/react-native-skia";
import type { FloorplanProjection, SessionSample } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAD = 16;
const PLOT_W = SCREEN_WIDTH - PAD * 2;
const TIMELINE_H = 140;
const MAP_H = 280;

function buildFpsPath(samples: SessionSample[]) {
  if (samples.length < 2) return null;
  const startTime = samples[0].timestamp;
  const duration = samples[samples.length - 1].timestamp - startTime || 1;
  const path = Skia.Path.Make();
  samples.forEach((sample, index) => {
    const t = (sample.timestamp - startTime) / duration;
    const x = PAD + t * PLOT_W;
    const y = TIMELINE_H - Math.max(0, Math.min(1, sample.fps / 60)) * (TIMELINE_H - 4);
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  return path;
}

function buildTrajectoryPath(samples: SessionSample[], projection: FloorplanProjection) {
  if (samples.length < 2) return null;
  const worldW = projection.world_max_x - projection.world_min_x;
  const worldH = projection.world_max_z - projection.world_min_z;
  if (worldW <= 0 || worldH <= 0) return null;
  const path = Skia.Path.Make();
  samples.forEach((sample, index) => {
    const x = PAD + ((sample.pos_x - projection.world_min_x) / worldW) * PLOT_W;
    const y = ((sample.pos_z - projection.world_min_z) / worldH) * MAP_H;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  return path;
}

export default function InvestigationChartsSkia({
  samples,
  projection,
}: {
  samples: SessionSample[];
  projection: FloorplanProjection;
}) {
  const fpsPath = useMemo(() => buildFpsPath(samples), [samples]);
  const trajectoryPath = useMemo(
    () => buildTrajectoryPath(samples, projection),
    [samples, projection],
  );

  if (!fpsPath || !trajectoryPath) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Not enough data for Skia charts</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>FPS Timeline</Text>
      <Canvas style={{ width: SCREEN_WIDTH, height: TIMELINE_H + 20 }}>
        <Path
          path={fpsPath}
          color="#4FC3F7"
          style="stroke"
          strokeWidth={1.5}
          strokeJoin="round"
          strokeCap="round"
        />
      </Canvas>
      <Text style={styles.sectionTitle}>Trajectory (top-down)</Text>
      <Canvas style={{ width: SCREEN_WIDTH, height: MAP_H + 20 }}>
        <Rect
          x={PAD}
          y={0}
          width={PLOT_W}
          height={MAP_H}
          color="#0D1117"
          style="fill"
        />
        <Rect
          x={PAD}
          y={0}
          width={PLOT_W}
          height={MAP_H}
          color="#2A3A4A"
          style="stroke"
          strokeWidth={1}
        />
        <Path
          path={trajectoryPath}
          color="#FF7043"
          style="stroke"
          strokeWidth={1.5}
          strokeJoin="round"
          strokeCap="round"
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#8090A0",
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  emptyWrap: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 24 },
  emptyText: { color: "#607589", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
