export interface IncidentGroup {
  id: string;
  type: "low_fps" | "hotzone";
  scene: string;
  zone: string;
  spatial_cluster_x: number;
  spatial_cluster_z: number;
  status: "open" | "known" | "resolved" | "dismissed";
  count: number;
  first_seen: number;
  last_seen: number;
  builds_seen: string[];
}

export interface IncidentOccurrence {
  id: string;
  group_id: string;
  player_id: string;
  session_id: string;
  fps: number;
  timestamp: number;
  scene: string;
  build_id: string;
}

export interface SessionSample {
  timestamp: number;
  fps: number;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  scene: string;
  zone: string;
  mode: string;
  memory_mb: number;
}

export interface SessionSource {
  type: "live" | "frozen";
  samples: SessionSample[];
  player_id: string;
  session_id: string;
  start_time: number;
  end_time: number;
}

export interface FloorplanProjection {
  world_min_x: number;
  world_min_z: number;
  world_max_x: number;
  world_max_z: number;
  scale: number;
}

export interface SceneStats {
  scene: string;
  total_ghosts: number;
  total_sessions: number;
  oldest_ts: number;
  newest_ts: number;
  memory_mb_avg: number;
}

export interface HeatmapCell {
  grid_x: number;
  grid_z: number;
  count: number;
  low_fps_count: number;
  avg_fps: number;
  min_fps: number;
  avg_mem: number;
}

export interface GeoPlayer {
  player_id: string;
  session_id: string;
  last_seen: number;
  country: string;
  country_code: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  display_name: string | null;
  color: string | null;
  status: "connected" | "recent" | "old";
  hits: number;
}

export interface CentralStatus {
  ok: boolean;
  mode: string;
  dashboard_version: string;
  peers_connected: number;
  heartbeats_total: number;
  sessions_total: number;
  memory_mb: number;
}
