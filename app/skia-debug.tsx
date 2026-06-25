import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Polyline, Rect } from "react-native-svg";
import { InvestigationCharts } from "@/components/InvestigationCharts";
import type { FloorplanProjection, SessionSample } from "@/types";

const WIDTH = 360;
const PAD = 16;
const PLOT_W = WIDTH - PAD * 2;
const TIMELINE_H = 140;
const MAP_H = 240;

function makeSamples(): SessionSample[] {
  const start = 1782260000;
  return Array.from({ length: 90 }, (_, index) => {
    const angle = index / 8;
    const fpsDip = index > 36 && index < 56 ? 18 : 0;
    return {
      timestamp: start + index,
      fps: Math.max(8, 58 - fpsDip + Math.sin(index / 5) * 4),
      pos_x: Math.cos(angle) * 18 + index * 0.08,
      pos_y: 0,
      pos_z: Math.sin(angle) * 12,
      scene: "SkiaDebug",
      zone: "synthetic",
      mode: "debug",
      memory_mb: 96 + Math.sin(index / 7) * 4,
    };
  });
}

function computeProjection(samples: SessionSample[]): FloorplanProjection {
  const xs = samples.map((s) => s.pos_x);
  const zs = samples.map((s) => s.pos_z);
  return {
    world_min_x: Math.min(...xs) - 5,
    world_max_x: Math.max(...xs) + 5,
    world_min_z: Math.min(...zs) - 5,
    world_max_z: Math.max(...zs) + 5,
    scale: 1,
  };
}

function SvgFallback({
  samples,
  projection,
}: {
  samples: SessionSample[];
  projection: FloorplanProjection;
}) {
  const fpsPoints = samples
    .map((sample, index) => {
      const x = PAD + (index / (samples.length - 1)) * PLOT_W;
      const y = TIMELINE_H - Math.max(0, Math.min(1, sample.fps / 60)) * (TIMELINE_H - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const worldW = projection.world_max_x - projection.world_min_x;
  const worldH = projection.world_max_z - projection.world_min_z;
  const mapPoints = samples
    .map((sample) => {
      const x = PAD + ((sample.pos_x - projection.world_min_x) / worldW) * PLOT_W;
      const y = ((sample.pos_z - projection.world_min_z) / worldH) * MAP_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <View>
      <Text style={styles.renderer}>SVG fallback renderer</Text>
      <Svg width={WIDTH} height={TIMELINE_H + 16}>
        <G>
          {[15, 30, 45, 60].map((fps) => {
            const y = TIMELINE_H - (fps / 60) * (TIMELINE_H - 4);
            return <Line key={fps} x1={PAD} y1={y} x2={WIDTH - PAD} y2={y} stroke="#1E2A3A" />;
          })}
          <Polyline points={fpsPoints} fill="none" stroke="#4FC3F7" strokeWidth={2} />
        </G>
      </Svg>
      <Svg width={WIDTH} height={MAP_H + 16}>
        <Rect x={PAD} y={0} width={PLOT_W} height={MAP_H} fill="#0D1117" stroke="#2A3A4A" />
        <Polyline points={mapPoints} fill="none" stroke="#FF7043" strokeWidth={2} />
      </Svg>
    </View>
  );
}

export default function SkiaDebugScreen() {
  const samples = useMemo(() => makeSamples(), []);
  const projection = useMemo(() => computeProjection(samples), [samples]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Skia Debug</Text>
      <Text style={styles.copy}>
        This route uses the production InvestigationCharts wrapper. If CanvasKit
        loads from CDN, the charts render through Skia. If it fails, the SVG
        fallback below is used.
      </Text>
      <InvestigationCharts
        samples={samples}
        projection={projection}
        fallback={<SvgFallback samples={samples} projection={projection} />}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E14" },
  content: { paddingVertical: 20 },
  title: {
    color: "#E0E0E0",
    fontSize: 28,
    fontWeight: "800",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  copy: {
    color: "#8090A0",
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  renderer: {
    color: "#FFD740",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
});
