"use client"

import { useEffect, useState } from "react"

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState<any>({})

  useEffect(() => {
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-8">Environment Variables Test</h1>
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Environment Variables:</h2>
          <pre className="text-slate-300 text-sm">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 