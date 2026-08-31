import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type OutbreakReport = {
  id: string
  disease_class: string
  crop: string
  disease: string
  confidence: number
  farmer_name: string
  farmer_dif: string
  farm_geojson: string
  center_lat: number
  center_lng: number
  notes: string | null
  language: string
  reported_at: string
  status: 'reviewing' | 'accepted' | 'rejected'
  photo_url?: string | null
  tool_used?: string | null
}

export type Farmer = {
  id: string
  created_at: string
  farmer_name: string
  phone_number: string
  croplens: number
  senseorbit: number
  dif_code: string
  dizmatrix: number
  role: string
}
