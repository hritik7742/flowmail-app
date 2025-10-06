'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import StatCard from '@/components/StatCard'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    subscribers: 0,
    campaigns: 0,
    emailsSent: 0,
    openRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/')
      return
    }
    
    // Load dashboard stats
    loadStats()
  }, [session, status, router])

  const loadStats = async () => {
    try {
      // For now, use dummy data - we'll implement real stats later
      setStats({
        subscribers: 1234,
        campaigns: 12,
        emailsSent: 5678,
        openRate: 24.5
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncMembers = async () => {
    try {
      const response = await fetch('/api/sync-members', {
        method: 'POST',
      })
      const result = await response.json()
      if (result.success) {
        alert('Members synced successfully!')
        loadStats() // Refresh stats
      } else {
        alert('Error syncing members: ' + result.error)
      }
    } catch (error) {
      alert('Error syncing members: ' + error.message)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your email marketing overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Subscribers"
              value={stats.subscribers.toLocaleString()}
              icon="👥"
            />
            <StatCard
              title="Campaigns Sent"
              value={stats.campaigns}
              icon="📧"
            />
            <StatCard
              title="Emails Sent"
              value={stats.emailsSent.toLocaleString()}
              icon="📤"
            />
            <StatCard
              title="Avg Open Rate"
              value={`${stats.openRate}%`}
              icon="📊"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/campaigns/new"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors block text-center"
                >
                  📧 Create Campaign
                </Link>
                <button
                  onClick={syncMembers}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  🔄 Sync Members from Whop
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Welcome Email Campaign</span>
                  <span className="text-green-600">Sent</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Newsletter #12</span>
                  <span className="text-blue-600">Draft</span>
                </div>
                <div className="flex justify-between">
                  <span>Members synced</span>
                  <span className="text-gray-500">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}