import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  IncidentGroup,
  SceneStats,
  HeatmapCell,
  GeoPlayer,
  SessionSample,
  SessionSource,
  CentralStatus,
} from "@/types";

const TOKEN_KEY = "@odisea:auth_token";
const API_BASE_KEY = "@odisea:api_base";

const DEFAULT_PROD_BASE = "https://odisea.educa.juegos";
const DEFAULT_DEV_BASE = "http://localhost:5003";

let cachedToken: string | null = null;
let cachedBase: string | null = null;

function defaultBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return DEFAULT_PROD_BASE;
  }
  return DEFAULT_DEV_BASE;
}

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getApiBase(): Promise<string> {
  if (cachedBase) return cachedBase;
  const stored = await AsyncStorage.getItem(API_BASE_KEY);
  cachedBase = stored || defaultBaseUrl();
  return cachedBase;
}

export async function setApiBase(base: string): Promise<void> {
  cachedBase = base;
  await AsyncStorage.setItem(API_BASE_KEY, base);
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = await getApiBase();
  const url = `${base}${path}`;
  const headers = await authHeaders();
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchStatus(): Promise<CentralStatus> {
  return apiFetch<CentralStatus>("/health");
}

export async function fetchIncidents(params: {
  status?: string;
  type?: string;
  scene?: string;
  limit?: number;
} = {}): Promise<IncidentGroup[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.type) qs.set("type", params.type);
  if (params.scene) qs.set("scene", params.scene);
  if (params.limit) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return apiFetch<IncidentGroup[]>(`/incidents${q ? `?${q}` : ""}`);
}

export async function fetchIncident(id: string): Promise<IncidentGroup> {
  return apiFetch<IncidentGroup>(`/incidents/${id}`);
}

export async function setIncidentStatus(
  id: string,
  status: "open" | "known" | "resolved" | "dismissed",
): Promise<IncidentGroup> {
  return apiFetch<IncidentGroup>(`/incidents/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function fetchIncidentSamples(
  id: string,
): Promise<SessionSample[]> {
  return apiFetch<SessionSample[]>(`/incidents/${id}/samples`);
}

interface GhostsResponse {
  data: Array<Record<string, unknown>>;
  next_offset: number | null;
  meta: { has_more: boolean; count: number; limit: number; offset: number };
}

interface GhostsStatsResponse {
  scenes: Array<{
    scene: string;
    total_ghosts: number;
    total_sessions: number;
    oldest_ts: number;
    newest_ts: number;
    memory_mb_avg: number;
  }>;
  headline: Record<string, unknown>;
}

function mapGhostRow(r: Record<string, unknown>): SessionSample {
  const pos = (r.pos as Array<number>) || [0, 0, 0];
  return {
    timestamp: (r.timestamp as number) || 0,
    fps: (r.fps as number) || (r.heartbeat_fps as number) || 0,
    pos_x: (r.pos_x as number) || pos[0] || 0,
    pos_y: (r.pos_y as number) || pos[1] || 0,
    pos_z: (r.pos_z as number) || pos[2] || 0,
    scene: (r.scene as string) || "",
    zone: (r.zone as string) || "",
    mode: (r.mode as string) || "",
    memory_mb: (r.memory_mb as number) || 0,
  };
}

export async function fetchGhosts(params: {
  player_id?: string;
  session_id?: string;
  limit?: number;
  scene?: string;
} = {}): Promise<SessionSample[]> {
  const qs = new URLSearchParams();
  if (params.player_id) qs.set("player_id", params.player_id);
  if (params.session_id) qs.set("session_id", params.session_id);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.scene) qs.set("scene", params.scene);
  const q = qs.toString();
  const raw = await apiFetch<GhostsResponse | SessionSample[]>(`/ghosts${q ? `?${q}` : ""}`);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw.data as Array<Record<string, unknown>>).map(mapGhostRow);
  }
  return [];
}

export async function fetchSceneStats(): Promise<SceneStats[]> {
  const raw = await apiFetch<GhostsStatsResponse>("/ghosts/stats");
  if (raw && "scenes" in raw) {
    return raw.scenes.map((s) => ({
      scene: s.scene || "",
      total_ghosts: s.total_ghosts || 0,
      total_sessions: s.total_sessions || 0,
      oldest_ts: s.oldest_ts || 0,
      newest_ts: s.newest_ts || 0,
      memory_mb_avg: s.memory_mb_avg || 0,
    }));
  }
  return [];
}

export async function fetchHeatmap(scene: string): Promise<HeatmapCell[]> {
  return apiFetch<HeatmapCell[]>(`/ghosts/heatmap?scene=${encodeURIComponent(scene)}`);
}

export async function fetchGeoPlayers(): Promise<GeoPlayer[]> {
  return apiFetch<GeoPlayer[]>("/api/geo-players");
}

export async function fetchScenes(): Promise<string[]> {
  return apiFetch<string[]>("/scenes");
}

export async function createEventsSource(token: string): Promise<EventSource> {
  const base = await getApiBase();
  const url = `${base}/events?token=${encodeURIComponent(token)}`;
  return new EventSource(url);
}

export async function buildSessionSource(
  player_id: string,
  session_id: string,
  liveSamples: SessionSample[],
): Promise<SessionSource> {
  const ghosts = await fetchGhosts({
    player_id,
    session_id,
    limit: 10000,
  });

  const samples = ghosts.length > 10 ? ghosts : liveSamples;

  return {
    type: ghosts.length > 10 ? "frozen" : "live",
    samples,
    player_id,
    session_id,
    start_time: samples.length > 0 ? samples[0].timestamp : 0,
    end_time: samples.length > 0 ? samples[samples.length - 1].timestamp : 0,
  };
}
