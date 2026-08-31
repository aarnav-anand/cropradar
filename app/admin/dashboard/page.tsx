'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AcceptModal from '@/components/AcceptModal'

type Report = {
  id: string
  disease_class: string
  crop: string
  disease: string
  confidence: number
  farmer_name: string
  farmer_dif: string
  center_lat: number
  center_lng: number
  notes: string | null
  reported_at: string
  status: 'reviewing' | 'accepted' | 'rejected'
  photo_url?: string | null
  tool_used?: string | null
}

const STATUS_COLORS: Record<string, string> = {
  reviewing: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function AdminDashboard() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'reviewing'>('all')
  const [acceptReport, setAcceptReport] = useState<Report | null>(null)
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('cr_admin')) {
      router.replace('/admin')
    }
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    let q = supabase.from('outbreak_reports').select('*').order('reported_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setReports(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [filter])

  const handleReject = async (id: string) => {
    if (!confirm('Reject this report?')) return
    await supabase.from('outbreak_reports').update({ status: 'rejected' }).eq('id', id)
    fetchReports()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('cr_admin')
    router.push('/admin')
  }

  const counts = {
    all: reports.length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2D6A4F' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/>
              </svg>
            </div>
            <span className="font-semibold" style={{ color: '#2D6A4F' }}>CropRadar</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">Admin Dashboard</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {(['all', 'reviewing'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`bg-white rounded-xl p-4 border-2 text-left transition-all ${filter === s ? 'border-green-500 shadow-sm' : 'border-transparent'}`}
            >
              <div className="text-2xl font-bold" style={{ color: '#1a2e1f' }}>{counts[s]}</div>
              <div className="text-xs text-gray-400 capitalize mt-0.5">{s === 'all' ? 'Total reports' : 'Pending review'}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Outbreak Reports</h2>
            <button onClick={fetchReports} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">Loading reports…</div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">No reports found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-50">
                    <th className="px-6 py-3 text-left font-medium">Farmer</th>
                    <th className="px-6 py-3 text-left font-medium">Crop / Disease</th>
                    <th className="px-6 py-3 text-left font-medium">Tool</th>
                    <th className="px-6 py-3 text-left font-medium">Notes</th>
                    <th className="px-6 py-3 text-left font-medium">Reported</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Photo</th>
                    <th className="px-6 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm text-gray-800">{r.farmer_name}</div>
                        <div className="text-xs text-gray-400 font-mono">{r.farmer_dif}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{r.crop}</div>
                        <div className="text-xs text-gray-400">{r.disease}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                          {r.tool_used || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[160px]">
                        <p className="text-xs text-gray-500 truncate">{r.notes || <span className="text-gray-300">—</span>}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(r.reported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.photo_url ? (
                          <button
                            onClick={() => setExpandedPhoto(r.photo_url!)}
                            className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 transition-colors font-medium bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">No photo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {r.status === 'reviewing' && (
                            <>
                              <button
                                onClick={() => setAcceptReport(r)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {r.status !== 'reviewing' && (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Photo lightbox */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedPhoto}
              alt="Crop disease"
              className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]"
            />
            <a
              href={expandedPhoto}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-white/60 hover:text-white text-xs transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open original
            </a>
          </div>
        </div>
      )}

      {acceptReport && (
        <AcceptModal
          report={acceptReport}
          onClose={() => setAcceptReport(null)}
          onDone={() => { setAcceptReport(null); fetchReports() }}
        />
      )}
    </div>
  )
}