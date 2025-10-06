'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

export default function SubscribersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/')
      return
    }
    
    loadSubscribers()
  }, [session, status, router])

  const loadSubscribers = async () => {
    try {
      // For now, use dummy data - we'll implement real subscribers later
      setSubscribers([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          tier: 'VIP',
          status: 'active',
          synced_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          tier: 'Basic',
          status: 'active',
          synced_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 3,
          name: 'Bob Johnson',
          email: 'bob@example.com',
          tier: 'Pro',
          status: 'inactive',
          synced_at: '2024-01-14T15:20:00Z'
        }
      ])
    } catch (error) {
      console.error('Error loading subscribers:', error)
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
        loadSubscribers() // Refresh list
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscribers</h1>
              <p className="text-gray-600">Manage your community members</p>
            </div>
            <button
              onClick={syncMembers}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Sync from Whop
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm text-gray-500">Total Subscribers</div>
              <div className="text-2xl font-bold text-gray-900">{subscribers.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm text-gray-500">Active Members</div>
              <div className="text-2xl font-bold text-green-600">
                {subscribers.filter(s => s.status === 'active').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl mb-2">⭐</div>
              <div className="text-sm text-gray-500">VIP Members</div>
              <div className="text-2xl font-bold text-indigo-600">
                {subscribers.filter(s => s.tier === 'VIP').length}
              </div>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Synced
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subscriber.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscriber.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subscriber.tier === 'VIP' 
                          ? 'bg-purple-100 text-purple-800'
                          : subscriber.tier === 'Pro'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subscriber.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subscriber.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscriber.synced_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subscribers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers yet</h3>
              <p className="text-gray-500 mb-4">Sync your Whop members to get started</p>
              <button
                onClick={syncMembers}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Sync from Whop
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}