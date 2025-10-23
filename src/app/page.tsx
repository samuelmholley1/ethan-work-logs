'use client'

import { useState } from 'react'
import Timer from '@/components/Timer'
import BehavioralLogger from '@/components/BehavioralLogger'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'timer' | 'logger'>('timer')

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-emerald-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-emerald-900">
            Ethan Work Logger
          </h1>
          <p className="text-sm text-emerald-700">
            Time & Behavioral Data Tracking
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'timer'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⏱️ Timer
          </button>
          <button
            onClick={() => setActiveTab('logger')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'logger'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Behavioral Logger
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        {activeTab === 'timer' && <Timer />}
        {activeTab === 'logger' && <BehavioralLogger />}
      </div>

      {/* Footer Info */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-200 py-2">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-600">
            💾 Offline-first • Auto-syncing to Airtable • Tue-Mon Billing Weeks
          </p>
        </div>
      </div>
    </div>
  )
}