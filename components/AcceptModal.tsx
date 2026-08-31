'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Report = {
  id: string
  farmer_name: string
  farmer_dif: string
  crop: string
  disease: string
  tool_used?: string | null
}

type Props = {
  report: Report
  onClose: () => void
  onDone: () => void
}

export default function AcceptModal({ report, onClose, onDone }: Props) {
  const [form, setForm] = useState({
    disease_class: report.disease,
    confidence: '',
    language: 'en',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.disease_class || !form.confidence) {
      setError('Please fill in all required fields')
      return
    }
    setLoading(true)

    try {
      // Update the report to accepted
      const { error: updateErr } = await supabase.from('outbreak_reports').update({
        status: 'accepted',
        disease_class: form.disease_class,
        confidence: parseFloat(form.confidence),
        language: form.language,
      }).eq('id', report.id)

      if (updateErr) throw updateErr

      // Increment the credit counter on the farmer record (or create a new farmer record if it doesn't exist)
      if (report.tool_used) {
        const creditField = report.tool_used.toLowerCase().trim()
        const validFields = ['croplens', 'senseorbit', 'dizmatrix', 'quallis']

        if (validFields.includes(creditField)) {
          let farmerRecord: Record<string, any> | null = null

          if (report.farmer_dif) {
            const { data } = await supabase
              .from('farmers')
              .select('*')
              .eq('dif_code', report.farmer_dif)
              .maybeSingle()
            farmerRecord = data
          }

          if (!farmerRecord && report.farmer_name) {
            const { data } = await supabase
              .from('farmers')
              .select('*')
              .eq('farmer_name', report.farmer_name)
              .maybeSingle()
            farmerRecord = data
          }

          if (farmerRecord) {
            const current = farmerRecord[creditField] ?? 0
            await supabase
              .from('farmers')
              .update({ [creditField]: current + 1 })
              .eq('id', farmerRecord.id)
          } else {
            await supabase
              .from('farmers')
              .insert({
                farmer_name: report.farmer_name,
                role: 'farmer',
                is_verified: true,
                croplens: creditField === 'croplens' ? 1 : 0,
                senseorbit: creditField === 'senseorbit' ? 1 : 0,
                dizmatrix: creditField === 'dizmatrix' ? 1 : 0,
                quallis: creditField === 'quallis' ? 1 : 0,
              })
          }
        }
      }

      onDone()
    } catch (err: any) {
      setError(err.message || 'Failed to accept report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md fade-up">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>Accept report</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the final details for <span className="font-medium text-gray-700">{report.farmer_name}</span>'s report
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Crop</span>
              <span className="font-medium">{report.crop}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Disease</span>
              <span className="font-medium">{report.disease}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Credit requested</span>
              <span className="font-medium capitalize">{report.tool_used || '—'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Disease class <span className="text-red-400">*</span></label>
            <input
              value={form.disease_class}
              onChange={e => setForm(f => ({ ...f, disease_class: e.target.value }))}
              placeholder="e.g. Wheat Leaf Rust"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confidence score (%) <span className="text-red-400">*</span></label>
            <input
              type="number" min="0" max="100" step="0.01"
              value={form.confidence}
              onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))}
              placeholder="e.g. 89.84"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
            <select
              value={form.language}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white transition-all"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="gu">Gujarati</option>
              <option value="mr">Marathi</option>
              <option value="te">Telugu</option>
              <option value="ta">Tamil</option>
            </select>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
            >
              {loading ? 'Saving…' : 'Confirm & accept'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}