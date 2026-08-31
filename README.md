# CropRadar 🌾

A disease outbreak reporting web app for farmers, with an admin review dashboard.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Storage for photos)
- **Leaflet** (interactive farm mapping)
- **Tailwind CSS**

---

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_init.sql`
3. Go to **Storage** → create a bucket named `crop-photos` with **Public** access

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # optional, for server-side ops
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Farmer report submission form |
| `/admin` | Admin login |
| `/admin/dashboard` | Review, accept, or reject reports |

## Admin credentials

- **Username:** `codecraftchampions`
- **Password:** `piis3.14`

---

## How it works

### Farmer flow
1. Farmer enters name, phone number
2. Draws their farm on the map (click points to create polygon)
3. Selects crop type, enters disease name, uploads a photo
4. Chooses tool used (Uallis / Ensesrbit / Dizmatrix / Croplens)
5. Adds optional notes
6. Submits — report saved with `status: reviewing`

### Admin flow
1. Logs in at `/admin`
2. Views all reports on the dashboard, filtered by status
3. **Accept** — admin fills in disease class, confidence score, language → report marked `accepted`, farmer's tool counter incremented by 1
4. **Reject** — report deleted from the database

---

## Database schema

### `outbreak_reports`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| disease_class | text | |
| crop | text | |
| disease | text | |
| confidence | float8 | Filled by admin on accept |
| farmer_name | text | |
| farmer_dif | text | FK ref to farmers.dif_code |
| farm_geojson | text | GeoJSON polygon string |
| center_lat | float8 | |
| center_lng | float8 | |
| notes | text | nullable |
| language | text | |
| reported_at | timestamptz | |
| status | text | reviewing / accepted / rejected |
| photo_url | text | nullable |
| tool_used | text | croplens / senseorbit / dizmatrix / uallis |

### `farmers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| created_at | timestamptz | |
| farmer_name | text | |
| phone_number | text | |
| croplens | int4 | incremented on accept |
| senseorbit | int4 | incremented on accept |
| dif_code | varchar | auto-generated |
| dizmatrix | int4 | incremented on accept |
| role | text | farmer / admin |
