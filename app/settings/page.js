'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Navbar from '@/components/Navbar'

function SettingsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const experienceId = searchParams.get('experienceId')
  
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !userId) {
      router.push('/')
      return
    }
    
    // Force refresh data on page load
    loadUserData()
  }, [session, status, router, userId])

  // Force refresh when component mounts
  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user?userId=${userId}&t=${Date.now()}`) // Add timestamp to prevent caching
      const result = await response.json()
      
      if (result.success) {
        setUserData(result.user)
      } else {
        console.error('Error loading user data:', result.error)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planType) => {
    setUpgradingPlan(planType)

    try {
      // Directly redirect to Whop checkout
      const response = await fetch('/api/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          experienceId: experienceId || 'default_experience', 
          planType 
        })
      })

      const result = await response.json()
      
      if (result.success && result.checkoutUrl) {
        // Redirect to Whop checkout
        window.location.href = result.checkoutUrl
      } else {
        alert('❌ Failed to create checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('❌ Upgrade failed. Please try again.')
    } finally {
      setUpgradingPlan(null)
    }
  }

  const handleSaveSettings = async (updates) => {
    setSaving(true)
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates })
      })
      
      const result = await response.json()
      if (result.success) {
        setUserData(result.user)
        alert('✅ Settings saved successfully!')
      } else {
        alert('❌ Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('❌ Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Error loading user data</div>
      </div>
    )
  }

  const plans = {
    free: { 
      name: 'Free Plan', 
      price: '$0', 
      dailyEmails: 10, 
      monthlyEmails: 300,
      features: ['10 emails per day', 'Basic templates', 'Email tracking'] 
    },
    starter: { 
      name: 'Starter Plan', 
      price: '$29', 
      dailyEmails: 100, 
      monthlyEmails: 3000,
      features: ['3,000 emails per month', 'Advanced analytics', 'Priority support', 'All templates'] 
    },
    growth: { 
      name: 'Growth Plan', 
      price: '$49', 
      dailyEmails: 167, 
      monthlyEmails: 5000,
      features: ['5,000 emails per month', 'Advanced analytics', 'Priority support', 'All templates', 'A/B testing'] 
    },
    pro: { 
      name: 'Pro Plan', 
      price: '$129', 
      dailyEmails: 334, 
      monthlyEmails: 10000,
      features: ['10,000 emails per month', 'A/B testing', 'Automation', 'Custom templates', 'White-label', 'API access'] 
    }
  }

  const currentPlan = plans[userData.plan] || plans.free
  const isFreePlan = userData.plan === 'free'
  const isPaidPlan = userData.plan === 'starter' || userData.plan === 'growth' || userData.plan === 'pro'

  // Calculate usage percentages
  const dailyUsagePercentage = isFreePlan ? (userData.emails_sent_today / currentPlan.dailyEmails) * 100 : 0
  const monthlyUsagePercentage = isPaidPlan ? (userData.emails_sent_this_month / currentPlan.monthlyEmails) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account, billing, and preferences</p>
              </div>
              <button
                onClick={loadUserData}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Plan */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{currentPlan.name}</h3>
                  <p className="text-gray-600">{currentPlan.price}/month</p>
                </div>
                <div className="text-right">
                  {isFreePlan ? (
                    <>
                      <div className="text-2xl font-bold text-indigo-600">{currentPlan.dailyEmails}</div>
                      <div className="text-sm text-gray-500">emails per day</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-indigo-600">{currentPlan.monthlyEmails.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">emails per month</div>
                    </>
                  )}
                </div>
              </div>

              {/* Usage Bar - Only show for current plan type */}
              {isFreePlan && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Daily Email Usage</span>
                    <span>{userData.emails_sent_today} / {currentPlan.dailyEmails} emails</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${dailyUsagePercentage > 80 ? 'bg-red-500' : dailyUsagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(dailyUsagePercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {currentPlan.dailyEmails - userData.emails_sent_today} emails remaining today
                  </p>
                  {dailyUsagePercentage > 80 && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ You're running low on daily emails. Consider upgrading your plan.
                    </p>
                  )}
                </div>
              )}

              {isPaidPlan && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Monthly Email Usage</span>
                    <span>{userData.emails_sent_this_month} / {currentPlan.monthlyEmails} emails</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${monthlyUsagePercentage > 80 ? 'bg-red-500' : monthlyUsagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(monthlyUsagePercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {currentPlan.monthlyEmails - userData.emails_sent_this_month} emails remaining this month
                  </p>
                  {monthlyUsagePercentage > 90 && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ You're running low on monthly emails. Your limit will reset next billing cycle.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Plan Features:</h4>
                <ul className="space-y-1">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Debug Information - Remove this in production */}
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Debug Info:</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Current Plan: <span className="font-mono">{userData.plan}</span></div>
                  <div>Subscription Status: <span className="font-mono">{userData.subscription_status || 'not set'}</span></div>
                  <div>Emails Sent Today: <span className="font-mono">{userData.emails_sent_today || 0}</span></div>
                  <div>Emails Sent This Month: <span className="font-mono">{userData.emails_sent_this_month || 0}</span></div>
                  <div>Daily Limit: <span className="font-mono">{userData.dailyLimit || 'not set'}</span></div>
                  <div>Monthly Limit: <span className="font-mono">{userData.monthlyLimit || 'not set'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Plans - Only show for free users */}
          {isFreePlan && (
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upgrade Your Plan</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Starter Plan */}
                  <div className="border-2 border-green-500 bg-green-50 rounded-lg p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        STARTER
                      </span>
                    </div>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Starter Plan</h3>
                      <div className="text-3xl font-bold text-gray-900 mt-2">$29</div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                    
                    <div className="text-center mb-4">
                      <div className="text-xl font-semibold text-green-600">3,000</div>
                      <div className="text-sm text-gray-500">emails per month</div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plans.starter.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade('starter')}
                      disabled={upgradingPlan === 'starter'}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {upgradingPlan === 'starter' ? 'Processing...' : 'Upgrade to Starter'}
                    </button>
                  </div>

                  {/* Growth Plan */}
                  <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        POPULAR
                      </span>
                    </div>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Growth Plan</h3>
                      <div className="text-3xl font-bold text-gray-900 mt-2">$49</div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                    
                    <div className="text-center mb-4">
                      <div className="text-xl font-semibold text-blue-600">5,000</div>
                      <div className="text-sm text-gray-500">emails per month</div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plans.growth.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade('growth')}
                      disabled={upgradingPlan === 'growth'}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {upgradingPlan === 'growth' ? 'Processing...' : 'Upgrade to Growth'}
                    </button>
                  </div>

                  {/* Pro Plan */}
                  <div className="border-2 border-purple-500 bg-purple-50 rounded-lg p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        BEST VALUE
                      </span>
                    </div>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Pro Plan</h3>
                      <div className="text-3xl font-bold text-gray-900 mt-2">$129</div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                    
                    <div className="text-center mb-4">
                      <div className="text-xl font-semibold text-purple-600">10,000</div>
                      <div className="text-sm text-gray-500">emails per month</div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plans.pro.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade('pro')}
                      disabled={upgradingPlan === 'pro'}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {upgradingPlan === 'pro' ? 'Processing...' : 'Upgrade to Pro'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={userData.company_name || ''}
                    onChange={(e) => setUserData({...userData, company_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email address is managed by Whop</p>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => handleSaveSettings({ company_name: userData.company_name })}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <SettingsContent />
    </Suspense>
  )
}