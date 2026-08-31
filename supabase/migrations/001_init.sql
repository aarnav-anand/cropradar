-- ============================================================
-- CropRadar — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: farmers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.farmers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  farmer_name   text NOT NULL,
  phone_number  text,
  croplens      int4 NOT NULL DEFAULT 0,
  senseorbit    int4 NOT NULL DEFAULT 0,
  dif_code      varchar GENERATED ALWAYS AS (
                  -- Simple deterministic code based on id; adjust as needed
                  upper(substring(id::text, 1, 2)) || lpad((abs(hashtext(id::text)) % 100)::text, 2, '0')
                ) STORED,
  dizmatrix     int4 NOT NULL DEFAULT 0,
  role          text NOT NULL DEFAULT 'farmer'
);

-- If dif_code as a generated column causes issues, use this alternative:
-- ALTER TABLE farmers ADD COLUMN IF NOT EXISTS dif_code text;
-- Then populate it via a trigger or application logic.

-- ============================================================
-- TABLE: outbreak_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.outbreak_reports (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  disease_class text NOT NULL,
  crop          text NOT NULL,
  disease       text NOT NULL,
  confidence    float8 NOT NULL DEFAULT 0,
  farmer_name   text NOT NULL,
  farmer_dif    text,
  farm_geojson  text,
  center_lat    float8,
  center_lng    float8,
  notes         text,
  language      text NOT NULL DEFAULT 'en',
  reported_at   timestamptz NOT NULL DEFAULT NOW(),
  status        text NOT NULL DEFAULT 'reviewing' CHECK (status IN ('reviewing', 'accepted', 'rejected')),
  photo_url     text,
  tool_used     text
);

-- ============================================================
-- TABLE: credit_costs  (referenced in schema screenshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_costs (
  id    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  text,
  cost  float8
);

-- ============================================================
-- TABLE: carts  (referenced in schema screenshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.carts (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  farmer_id  uuid REFERENCES public.farmers(id) ON DELETE CASCADE
);

-- ============================================================
-- Storage bucket for crop photos
-- ============================================================
-- Run in Supabase dashboard > Storage > New bucket:
-- Name: crop-photos, Public: true

-- ============================================================
-- Row Level Security (basic open policy for development)
-- Tighten these for production!
-- ============================================================
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbreak_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on farmers" ON public.farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on outbreak_reports" ON public.outbreak_reports FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- NOTES
-- ============================================================
-- 1. If the generated dif_code column is not supported in your
--    Postgres version, remove the GENERATED ALWAYS AS clause and
--    add a default random code instead:
--
--    dif_code varchar DEFAULT upper(substring(md5(random()::text), 1, 4)) || (floor(random()*90+10)::int)::text,
--
-- 2. Create a Storage bucket named "crop-photos" (public) in
--    your Supabase dashboard for photo uploads to work.
--
-- 3. Copy .env.local.example to .env.local and fill in your
--    Supabase URL and keys before running the app.
-- ============================================================
