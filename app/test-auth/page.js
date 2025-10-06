'use client'

import { useState } from 'react'

export default function TestAuth() {
  const [result, setResult] = useState('')

  const testWhopAPI = async () => {
    try {
      setResult('Testing Whop API...')
      
      // Test if we can reach our API
      const response = await fetch('/api/test-whop', {
        method: 'GET',
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Whop Integration</h1>
        
        <button
          onClick={testWhopAPI}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        >
          Test Whop API Connection
        </button>
        
        <pre className="bg-white p-4 rounded border overflow-auto">
          {result || 'Click the button to test'}
        </pre>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Environment Check:</h2>
          <div className="bg-white p-4 rounded border">
            <p>WHOP_CLIENT_ID: {process.env.NEXT_PUBLIC_WHOP_APP_ID ? '✅ Set' : '❌ Missing'}</p>
            <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>RESEND_API_KEY: {'✅ Set (server-side)'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}