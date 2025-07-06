"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic import for client-side only rendering
const IntmaxClientPageComponent = dynamic(() => import('./IntmaxClientComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#008080] p-4 flex items-center justify-center">
      <div className="bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-lg p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-bold text-black mb-2">Loading INTMAX Client SDK...</h2>
          <p className="text-black">Initializing client-side components...</p>
        </div>
      </div>
    </div>
  )
})

export default function IntmaxClientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#008080] p-4 flex items-center justify-center">
        <div className="bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-lg p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-black mb-2">Loading INTMAX Client SDK...</h2>
            <p className="text-black">Preparing client-side integration...</p>
          </div>
        </div>
      </div>
    }>
      <IntmaxClientPageComponent />
    </Suspense>
  )
} 