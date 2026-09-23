// lib/types.ts
export interface SnowSummary {
  base_in: number | null;
  new_24h_in: number | null;
  scraped_at: string | null;
  is_stale: boolean;
}

export interface LiftSummary {
  open: number;
  total: number;
}

export interface TrailSummary {
  open: number | null;
  total: number | null;
}

export interface ResortSummary {
  id: string;
  name: string;
  pass_type: 'epic' | 'ikon' | 'independent';
  region: string;
  state: string;
  snow: SnowSummary | null;
  lifts: LiftSummary | null;
  trails: TrailSummary | null;
}

export interface LiftItem {
  name: string;
  status: 'open' | 'closed' | 'on-hold';
}

export interface LiftDetail {
  open: number;
  total: number;
  scraped_at: string | null;
  is_stale: boolean;
  items: LiftItem[];
}

export interface SnowDetail {
  base_in: number | null;
  new_24h_in: number | null;
  new_48h_in: number | null;
  new_7d_in: number | null;
  surface: string | null;
  scraped_at: string | null;
  is_stale: boolean;
}

export interface SnowForecastDetail {
  next_24h_in: number | null;
  next_48h_in: number | null;
  next_72h_in: number | null;
  scraped_at: string | null;
  is_stale: boolean;
}

export interface WeatherPeriod {
  date: string;
  high_f: number | null;
  low_f: number | null;
  precip_pct: number | null;
  snow_in_forecast: boolean;
  snow_amount_in: number | null;
  wind_mph: number | null;
}

export interface TrafficCamLink {
  label: string;
  url: string;
}

export interface RoadCameraStop {
  name: string;
  url: string;
}

export interface RoadCameraGroup {
  name: string;
  note: string | null;
  stops: RoadCameraStop[];
}

export interface RoadCameraResponse {
  groups: RoadCameraGroup[];
  note: string;
}

export interface WeatherDetail {
  scraped_at: string | null;
  is_stale: boolean;
  forecast: WeatherPeriod[];
}

export interface WebcamItem {
  label: string;
  cam_type: 'hls' | 'jpeg';
  url: string;
  is_alive: boolean;
}

export interface LiveLot {
  name: string;
  status: string | null;
  capacity_pct: number | null;
}

export interface StaticLot {
  name: string;
  distance_ft: number | null;
  cost: string | null;
  directions_url: string | null;
}

export interface ParkingDetail {
  has_live_data: boolean;
  scraped_at: string | null;
  is_stale: boolean;
  live_lots: LiveLot[];
  static_lots: StaticLot[];
}

export interface ResortDetail {
  id: string;
  name: string;
  pass_type: 'epic' | 'ikon' | 'independent';
  region: string;
  state: string;
  country: string;
  summit_elevation_ft: number | null;
  vertical_drop_ft: number | null;
  website: string | null;
  latitude: number;
  longitude: number;
  snow: SnowDetail | null;
  snow_forecast?: SnowForecastDetail | null;
  lifts: LiftDetail | null;
  trails: TrailSummary | null;
  weather: WeatherDetail | null;
  webcams: WebcamItem[];
  parking: ParkingDetail;
  traffic_cams?: TrafficCamLink[];
  traffic_cams_note?: string | null;
  live_traffic_cams?: WebcamItem[];
}

export interface BestResortResponse {
  resorts: ResortSummary[];
  generated_at: string;
}
