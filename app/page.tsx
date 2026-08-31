'use client'
import { useState } from 'react'
import Link from 'next/link'
import FarmerForm from '@/components/FarmerForm'

export default function Home() {
  const [submitted, setSubmitted] = useState(false)
  const [reportId, setReportId] = useState('')

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #e8f5ee 0%, #f7f9f7 60%)' }}>
      {/* Header */}
      <header className="border-b border-green-100 bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#2D6A4F' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12c0-2.76 1.12-5.26 2.93-7.07"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <span className="font-semibold text-lg" style={{ color: '#2D6A4F' }}>CropRadar</span>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Admin →
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {!submitted ? (
          <>
            <div className="mb-8 fade-up">
              <p className="text-xs font-medium tracking-widest uppercase text-green-600 mb-2">Disease Reporting</p>
              <h1 className="text-4xl font-bold mb-3" style={{ color: '#1a2e1f', fontFamily: 'Georgia, serif' }}>
                Report a crop disease
              </h1>
              <p className="text-gray-500 text-base leading-relaxed">
                Fill in the details below and our team will review your report. Early reporting helps protect your region's harvest.
              </p>
            </div>
            <FarmerForm onSuccess={(id) => { setSubmitted(true); setReportId(id) }} />
          </>
        ) : (
          <div className="fade-up text-center py-20">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#1a2e1f' }}>
              Report submitted
            </h2>
            <p className="text-gray-500 mb-2">Your report is under review by our agronomists.</p>
            <p className="text-xs text-gray-400 font-mono mb-8">ID: {reportId}</p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
              style={{ background: '#2D6A4F' }}
            >
              Submit another report
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
