'use client'
import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const FarmMap = dynamic(() => import('./FarmMap'), { ssr: false, loading: () => (
  <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">Loading map…</div>
)})
//karja kaam bhai pls
const CROPS = ['Wheat', 'Tomato', 'Strawberry', 'Potato', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Other']
const TOOLS = [
  { id: 'quallis', label: 'Quallis' },
  { id: 'senseorbit', label: 'Senseorbit' },
  { id: 'dizmatrix', label: 'Dizmatrix' },
  { id: 'croplens', label: 'Croplens' },
]

type Props = { onSuccess: (id: string) => void }

export default function FarmerForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    farmer_name: '',
    phone_number: '',
    crop: '',
    disease: '',
    disease_class: '',
    notes: '',
    tool_used: '',
    language: 'en',
  })
  const [farmGeoJSON, setFarmGeoJSON] = useState<any>(null)
  const [centerLat, setCenterLat] = useState<number>(20.5937)
  const [centerLng, setCenterLng] = useState<number>(78.9629)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleMapChange = useCallback((geojson: any, lat: number, lng: number) => {
    setFarmGeoJSON(geojson)
    setCenterLat(lat)
    setCenterLng(lng)
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.farmer_name.trim()) e.farmer_name = 'Name is required'
    if (!form.phone_number.trim()) e.phone_number = 'Phone number is required'
    if (!form.crop) e.crop = 'Select a crop'
    if (!form.disease.trim()) e.disease = 'Disease name is required'
    if (!form.tool_used) e.tool_used = 'Select a tool'
    if (!farmGeoJSON) e.map = 'Please draw your farm on the map'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    try {
      // Upload photo if provided
      let photoUrl: string | null = null
      if (photo) {
        const ext = photo.name.split('.').pop()
        const path = `reports/${uuidv4()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('crop-photos').upload(path, photo)
        if (!uploadErr) {
          const { data } = supabase.storage.from('crop-photos').getPublicUrl(path)
          photoUrl = data.publicUrl
        }
      }

      // Upsert farmer record
      const { data: existingFarmer } = await supabase
        .from('farmers')
        .select('id, dif_code')
        .eq('farmer_name', form.farmer_name)
        .eq('phone_number', form.phone_number)
        .maybeSingle()

      let farmerDif = existingFarmer?.dif_code ?? 'SV69'

      if (!existingFarmer) {
        const { data: newFarmer } = await supabase
          .from('farmers')
          .insert({
            farmer_name: form.farmer_name,
            phone_number: form.phone_number,
            croplens: 0,
            senseorbit: 0,
            dizmatrix: 0,
            role: 'farmer',
          })
          .select('dif_code')
          .single()
        farmerDif = newFarmer?.dif_code ?? 'SV69'
      }

      // Insert outbreak report with status 'reviewing'
      const id = uuidv4()
      const { error } = await supabase.from('outbreak_reports').insert({
        id,
        disease_class: form.disease_class || form.disease,
        crop: form.crop,
        disease: form.disease,
        confidence: 0,
        farmer_name: form.farmer_name,
        farmer_dif: farmerDif,
        farm_geojson: JSON.stringify(farmGeoJSON),
        center_lat: centerLat,
        center_lng: centerLng,
        notes: form.notes || null,
        language: form.language,
        reported_at: new Date().toISOString(),
        status: 'reviewing',
        photo_url: photoUrl,
        tool_used: form.tool_used,
      })

      if (error) throw error
      onSuccess(id)
    } catch (err: any) {
      alert('Error submitting report: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 fade-up">
      {/* Farmer Info */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
        <h2 className="font-semibold text-base mb-4 text-gray-800">Your details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
            <input
              name="farmer_name" value={form.farmer_name} onChange={handleChange}
              placeholder="e.g. Ravi Patel"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100 ${errors.farmer_name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.farmer_name && <p className="text-xs text-red-500 mt-1">{errors.farmer_name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone number</label>
            <input
              name="phone_number" value={form.phone_number} onChange={handleChange}
              placeholder="e.g. 9876543210"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100 ${errors.phone_number ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.phone_number && <p className="text-xs text-red-500 mt-1">{errors.phone_number}</p>}
          </div>
        </div>
      </section>

      {/* Farm Map */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
        <h2 className="font-semibold text-base mb-1 text-gray-800">Map your farm</h2>
        <p className="text-xs text-gray-400 mb-4">Use the polygon tool to outline the affected area.</p>
        <FarmMap onChange={handleMapChange} />
        {errors.map && <p className="text-xs text-red-500 mt-2">{errors.map}</p>}
      </section>

      {/* Disease Info */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
        <h2 className="font-semibold text-base mb-4 text-gray-800">Disease information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Crop type</label>
            <select
              name="crop" value={form.crop} onChange={handleChange}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white ${errors.crop ? 'border-red-400' : 'border-gray-200'}`}
            >
              <option value="">Select crop…</option>
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.crop && <p className="text-xs text-red-500 mt-1">{errors.crop}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Disease name</label>
            <input
              name="disease" value={form.disease} onChange={handleChange}
              placeholder="e.g. Wheat Leaf Rust"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100 ${errors.disease ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.disease && <p className="text-xs text-red-500 mt-1">{errors.disease}</p>}
          </div>
        </div>

        {/* Photo Upload */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Photo of affected crop</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-green-400 transition-colors text-center"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="h-40 object-cover rounded-lg mx-auto" />
            ) : (
              <div>
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm text-gray-400">Click to upload a photo</p>
                <p className="text-xs text-gray-300 mt-1">JPG, PNG up to 10MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </section>

      {/* Tool Selection */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
        <h2 className="font-semibold text-base mb-4 text-gray-800">Detection tool used</h2>
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              type="button"
              onClick={() => { setForm(f => ({ ...f, tool_used: tool.id })); setErrors(e => ({ ...e, tool_used: '' })) }}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                form.tool_used === tool.id
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-green-300'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
        {errors.tool_used && <p className="text-xs text-red-500 mt-2">{errors.tool_used}</p>}
      </section>

      {/* Notes */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
        <h2 className="font-semibold text-base mb-1 text-gray-800">Notes <span className="text-gray-400 font-normal text-xs">(optional)</span></h2>
        <textarea
          name="notes" value={form.notes} onChange={handleChange}
          placeholder="Any additional observations about the disease or conditions…"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none"
        />
      </section>

      <button
        type="submit" disabled={loading}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: loading ? '#52B788' : 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Submitting…
          </>
        ) : 'Submit disease report'}
      </button>
    </form>
  )
}
