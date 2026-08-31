'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Lang = 'en' | 'hi'

type Report = {
  id: string
  disease_class: string
  crop: string
  disease: string
  confidence: number
  farmer_name: string
  farmer_dif: string
  notes: string | null
  reported_at: string
  status: 'reviewing' | 'accepted' | 'rejected'
  photo_url?: string | null
  tool_used?: string | null
}

const T = {
  en: {
    title: 'Check Report Status',
    subtitle: 'Enter the unique Report ID allotted to you upon submission.',
    placeholder: 'e.g. 8f4e2a1b-...',
    button: 'Check Status',
    checking: 'Checking…',
    notFound: 'No report found with this ID. Please check the ID and try again.',
    statusLabel: 'Current Status',
    reviewingTitle: 'Under Review',
    reviewingDesc: 'Your report has been received and is currently being reviewed by our agronomists.',
    acceptedTitle: 'Report Accepted',
    acceptedDesc: 'Your outbreak report was verified and accepted into the regional radar.',
    rejectedTitle: 'Report Rejected',
    rejectedDesc: 'This report was reviewed by our team and marked as rejected.',
    farmer: 'Farmer',
    cropDisease: 'Crop / Disease',
    diseaseClass: 'Verified Disease Class',
    confidence: 'Confidence Score',
    toolUsed: 'Tool Used',
    reportedOn: 'Reported On',
    notes: 'Notes',
  },
  hi: {
    title: 'रिपोर्ट स्थिति जांचें',
    subtitle: 'सबमिशन पर आपको दी गई अनूठी रिपोर्ट आईडी दर्ज करें।',
    placeholder: 'जैसे 8f4e2a1b-...',
    button: 'स्थिति जांचें',
    checking: 'जांच की जा रही है…',
    notFound: 'इस आईडी के साथ कोई रिपोर्ट नहीं मिली। कृपया आईडी की जांच करें और पुनः प्रयास करें।',
    statusLabel: 'वर्तमान स्थिति',
    reviewingTitle: 'समीक्षाधीन',
    reviewingDesc: 'आपकी रिपोर्ट प्राप्त हो गई है और वर्तमान में हमारे कृषि विशेषज्ञों द्वारा समीक्षा की जा रही है।',
    acceptedTitle: 'रिपोर्ट स्वीकृत',
    acceptedDesc: 'आपकी प्रकोप रिपोर्ट सत्यापित की गई और क्षेत्रीय रडार में स्वीकार की गई।',
    rejectedTitle: 'रिपोर्ट अस्वीकृत',
    rejectedDesc: 'हमारी टीम द्वारा इस रिपोर्ट की समीक्षा की गई और इसे अस्वीकृत घोषित किया गया।',
    farmer: 'किसान',
    cropDisease: 'फसल / बीमारी',
    diseaseClass: 'सत्यापित बीमारी वर्ग',
    confidence: 'विश्वास स्कोर',
    toolUsed: 'उपयोग किया गया टूल',
    reportedOn: 'रिपोर्ट करने की तिथि',
    notes: 'टिप्पणियां',
  },
}

export default function ReportStatusLookup({ lang, initialId = '' }: { lang: Lang; initialId?: string }) {
  const t = T[lang]
  const [searchId, setSearchId] = useState(initialId)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const queryId = searchId.trim()
    if (!queryId) return

    setLoading(true)
    setError('')
    setReport(null)
    setSearched(true)

    try {
      const { data, error: fetchErr } = await supabase
        .from('outbreak_reports')
        .select('*')
        .eq('id', queryId)
        .maybeSingle()

      if (fetchErr) throw fetchErr
      if (!data) {
        setError(t.notFound)
      } else {
        setReport(data as Report)
      }
    } catch (err: any) {
      setError(err.message || t.notFound)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 fade-up">
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
        <h2 className="font-semibold text-lg mb-1 text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
          {t.title}
        </h2>
        <p className="text-xs text-gray-500 mb-5">{t.subtitle}</p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
          >
            {loading ? t.checking : t.button}
          </button>
        </form>
      </section>

      {searched && error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center fade-up">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl">
            ⚠️
          </div>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {report && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-50 space-y-6 fade-up">
          {/* Status banner */}
          <div className={`p-4 rounded-xl flex items-start gap-3.5 border ${
            report.status === 'accepted'
              ? 'bg-green-50 border-green-200 text-green-800'
              : report.status === 'rejected'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="text-2xl mt-0.5">
              {report.status === 'accepted' ? '✅' : report.status === 'rejected' ? '❌' : '⏳'}
            </div>
            <div>
              <div className="font-bold text-base">
                {report.status === 'accepted'
                  ? t.acceptedTitle
                  : report.status === 'rejected'
                  ? t.rejectedTitle
                  : t.reviewingTitle}
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {report.status === 'accepted'
                  ? t.acceptedDesc
                  : report.status === 'rejected'
                  ? t.rejectedDesc
                  : t.reviewingDesc}
              </p>
            </div>
          </div>

          {/* Report Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm divide-y sm:divide-y-0 divide-gray-100">
            <div className="pt-2 sm:pt-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider block mb-0.5">{t.farmer}</span>
              <p className="font-semibold text-gray-800">{report.farmer_name}</p>
              <p className="text-xs text-gray-400 font-mono">{report.farmer_dif}</p>
            </div>

            <div className="pt-2 sm:pt-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider block mb-0.5">{t.cropDisease}</span>
              <p className="font-semibold text-gray-800">{report.crop}</p>
              <p className="text-xs text-gray-500">{report.disease}</p>
            </div>

            {report.status === 'accepted' && (
              <>
                <div className="pt-2 sm:pt-0">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block mb-0.5">{t.diseaseClass}</span>
                  <p className="font-semibold text-green-700">{report.disease_class || report.disease}</p>
                </div>

                <div className="pt-2 sm:pt-0">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block mb-0.5">{t.confidence}</span>
                  <p className="font-semibold text-gray-800">{report.confidence}%</p>
                </div>
              </>
            )}

            <div className="pt-2 sm:pt-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider block mb-0.5">{t.toolUsed}</span>
              <p className="font-medium text-gray-700 capitalize">{report.tool_used || '—'}</p>
            </div>

            <div className="pt-2 sm:pt-0">
              <span className="text-xs text-gray-400 uppercase tracking-wider block mb-0.5">{t.reportedOn}</span>
              <p className="font-medium text-gray-700">
                {new Date(report.reported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {report.notes && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">{t.notes}</span>
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">{report.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
