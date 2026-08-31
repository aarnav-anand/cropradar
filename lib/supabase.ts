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
  quallis: number
  role: string
  is_verified?: boolean
}

export const generateDifCode = (name: string): string => {
  if (!name) return 'CR10'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  let prefix = 'CR'
  if (parts.length >= 2) {
    prefix = (parts[0][0] + parts[1][0]).toUpperCase()
  } else if (parts.length === 1 && parts[0].length >= 2) {
    prefix = parts[0].substring(0, 2).toUpperCase()
  } else if (parts.length === 1) {
    prefix = (parts[0][0] + 'X').toUpperCase()
  }
  prefix = prefix.replace(/[^A-Z0-9]/g, 'X')
  const randomNum = Math.floor(10 + Math.random() * 90)
  return `${prefix}${randomNum}`
}
