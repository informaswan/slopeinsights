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

export interface CrowdSummary {
  current_level: 'low' | 'medium' | 'high' | 'closed' | null;
  current_pct: number | null;
  source: string;
}

export interface ResortSummary {
  id: string;
  name: string;
  pass_type: 'epic' | 'ikon';
  region: string;
  state: string;
  snow: SnowSummary | null;
  lifts: LiftSummary | null;
  trails: TrailSummary | null;
  crowd: CrowdSummary | null;
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

export interface WeatherPeriod {
  date: string;
  high_f: number | null;
  low_f: number | null;
  precip_pct: number | null;
  snow_in_forecast: boolean;
  wind_mph: number | null;
}

export interface WeatherDetail {
  scraped_at: string | null;
  is_stale: boolean;
  forecast: WeatherPeriod[];
}

export interface CrowdDetail {
  current_level: string | null;
  current_pct: number | null;
  source: string;
  label: string | null;
  hourly_start: string;
  hourly: number[];
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
  pass_type: 'epic' | 'ikon';
  region: string;
  state: string;
  country: string;
  summit_elevation_ft: number | null;
  vertical_drop_ft: number | null;
  website: string | null;
  snow: SnowDetail | null;
  lifts: LiftDetail | null;
  trails: TrailSummary | null;
  crowd: CrowdDetail | null;
  weather: WeatherDetail | null;
  webcams: WebcamItem[];
  parking: ParkingDetail;
}

export interface BestResortResponse {
  resorts: ResortSummary[];
  generated_at: string;
}

// Auth types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  provider: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface UserResortsResponse {
  resort_ids: string[];
}
