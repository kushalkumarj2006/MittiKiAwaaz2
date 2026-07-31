export type LanguageCode = 'kn' | 'en' | 'hi';

export interface User {
  id: number;
  phone: string;
  name: string;
  role: 'farmer' | 'sarpanch';
  taluk: string;
  village?: string;
  district?: string;
  state?: string;
  farm_size?: string;
  primary_crop?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface SoilRecord {
  id: string;
  ph: number;
  result: string;
  timestamp: string;
}

export interface CommunityPost {
  id: number;
  user_id: number;
  user_name?: string;
  taluk?: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'pdf';
  content: string;
  created_at: string;
}

export interface CropSale {
  id: number;
  farmer_id: number;
  farmer_name?: string;
  farmer_phone?: string;
  crop_name: string;
  quantity: string;
  price: string;
  image_url?: string;
  contact_phone?: string;
  address?: string;
  taluk?: string;
  active: boolean;
  created_at: string;
}

export interface MachineryRental {
  id: number;
  owner_id: number;
  owner_name?: string;
  owner_phone?: string;
  machine_name: string;
  description?: string;
  rental_price: string;
  image_url?: string;
  contact_phone?: string;
  address?: string;
  taluk?: string;
  active: boolean;
  created_at: string;
}

export interface WeatherData {
  temperature?: { max?: { value: number }; min?: { value: number } };
  humidity?: { morning?: number; evening?: number };
  wind?: { speed?: number };
}

export interface ForecastItem {
  date: string;
  max_temp: number;
  min_temp: number;
  description: string;
}

export interface DisasterAlert {
  id: number;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  created_at: string;
}
