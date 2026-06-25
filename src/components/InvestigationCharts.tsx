import React, { Suspense, useEffect, useState, type ComponentType } from "react";
import { Platform } from "react-native";
import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import type { FloorplanProjection, SessionSample } from "@/types";

const CANVASKIT_VERSION = "0.40.0";

type InvestigationChartsProps = {
  samples: SessionSample[];
  projection: FloorplanProjection;
  fallback: React.ReactNode;
};

type SkiaChartsProps = Pick<InvestigationChartsProps, "samples" | "projection">;

const loadSkiaCharts = () =>
  Promise.resolve().then(() => ({
    // Keep Skia out of the initial web route. CanvasKit is loaded first by WithSkiaWeb.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    default: require("./InvestigationChartsSkia").default as ComponentType<SkiaChartsProps>,
  }));

class ChartErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Skia charts failed, using SVG fallback:", error);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export function InvestigationCharts({
  samples,
  projection,
  fallback,
}: InvestigationChartsProps) {
  const componentProps = { samples, projection };
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (Platform.OS === "web") {
    if (!mounted) {
      return fallback;
    }
    return (
      <ChartErrorBoundary fallback={fallback}>
        <WithSkiaWeb
          fallback={fallback}
          opts={{
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${CANVASKIT_VERSION}/bin/full/${file}`,
          }}
          getComponent={loadSkiaCharts}
          componentProps={componentProps}
        />
      </ChartErrorBoundary>
    );
  }

  const NativeCharts = React.lazy(loadSkiaCharts);
  return (
    <ChartErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <NativeCharts {...componentProps} />
      </Suspense>
    </ChartErrorBoundary>
  );
}
