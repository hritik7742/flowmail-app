
'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useIframeSdk } from '@whop/react'
import { cn } from '../../../lib/utils'
import {
  ChartBarIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  Cog6ToothIcon,
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  BoltIcon,
  ChartPieIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  FireIcon,
  GlobeAltIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  EnvelopeIcon as EnvelopeIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid'
import { DocumentDuplicateIcon } from '@heroicons/react/16/solid'
import { ClipboardIcon } from '@heroicons/react/16/solid'

interface User {
  id: string
  name: string
  username: string
  email: string
}

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  total_recipients: number
  sent_at: string | null
}

interface Subscriber {
  id: string
  name: string
  email: string
  tier: string
  status: string
  synced_at: string
}

interface FlowMailAppProps {
  user: User
  userId: string
  experienceId: string
}



// Custom hook to safely use iframe SDK
function useSafeIframeSdk() {
  try {
    return useIframeSdk()
  } catch (error) {
    // Fallback for local development or when not in Whop context
    console.log('IframeSdk not available, using fallback for local development')
    return {
      close: () => console.log('Close not available in local development'),
      resize: () => console.log('Resize not available in local development'),
      inAppPurchase: {
        createCheckoutSession: () => Promise.resolve({ id: 'mock-checkout-session' }),
        getProducts: () => Promise.resolve([]),
        getPurchases: () => Promise.resolve([])
      },
      // Add other methods as needed
    } as any
  }
}

function FlowMailApp({ user, userId, experienceId }: FlowMailAppProps) {
  const iframeSdk = useSafeIframeSdk()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isDarkMode, setIsDarkMode] = useState(true) // Default to dark mode
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState({
    subscribers: 0,
    campaigns: 0,
    emailsSent: 0
  })

  // Theme management
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [deletingMember, setDeletingMember] = useState<string | null>(null)
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null)
  const [campaignProgress, setCampaignProgress] = useState<any>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [showDeleteMode, setShowDeleteMode] = useState(false)
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set())
  const [deletingCampaigns, setDeletingCampaigns] = useState(false)
  const [domainSettings, setDomainSettings] = useState<any>(null)
  const [showDomainSetup, setShowDomainSetup] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [senderUsername, setSenderUsername] = useState('hello')
  const [replyToEmail, setReplyToEmail] = useState('')

  const [uploading, setUploading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<any>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string
    message: string
    confirmText: string
    onConfirm: () => void
    type: 'danger' | 'warning' | 'info'
  } | null>(null)

  // Helper function to show toast messages
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    // Show error messages longer, especially for limit reached
    const displayTime = type === 'error' && message.includes('LIMIT REACHED') ? 6000 : 4000
    setTimeout(() => {
      setShowToast(false)
    }, displayTime)
  }

  // Helper function to show confirmation modals
  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning', confirmText: string = 'Confirm') => {
    setConfirmModalData({
      title,
      message,
      confirmText,
      onConfirm,
      type
    })
    setShowConfirmModal(true)
  }



  const loadDashboardData = useCallback(async () => {
    try {
      console.log('🔄 Loading dashboard data...')

      // Load all data in parallel for better performance
      const [subsResponse, campaignsResponse, userResponse] = await Promise.all([
        fetch('/api/get-subscribers-optimized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }),
        fetch('/api/get-campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }),
        fetch(`/api/user?userId=${userId}`)
      ])

      const [subsData, campaignsData, userData] = await Promise.all([
        subsResponse.json(),
        campaignsResponse.json(),
        userResponse.json()
      ])

      if (subsData.success) {
        setSubscribers(subsData.subscribers || [])
        console.log('👥 Loaded subscribers:', subsData.subscribers?.length || 0)
      }

      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns || [])
        console.log('📧 Loaded campaigns:', campaignsData.campaigns?.length || 0)
      }

      if (userData.success) {
        setUserPlan(userData.user)
        console.log('👤 Loaded user plan:', userData.user?.plan || 'free')
      }

      // Set basic stats from loaded data
      setStats({
        subscribers: subsData.subscribers?.length || 0,
        campaigns: campaignsData.campaigns?.filter((c: Campaign) => c.status === 'sent').length || 0,
        emailsSent: campaignsData.campaigns?.filter((c: Campaign) => c.status === 'sent').reduce((sum: number, c: Campaign) => sum + (c.total_recipients || 0), 0) || 0
      })
      console.log('✅ Dashboard data loaded successfully')
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
    }
  }, [userId])



  useEffect(() => {
    loadDashboardData()
  }, [])

  // Auto-refresh stats when enabled
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (autoRefresh) {
      console.log('🔄 Auto-refresh enabled - updating every 10 seconds')
      interval = setInterval(async () => {
        console.log('🔄 Auto-refreshing data...')
        await loadDashboardData()
      }, 10000)
    } else {
      console.log('⏸️ Auto-refresh disabled')
    }

    return () => {
      if (interval) {
        clearInterval(interval)
        console.log('🛑 Auto-refresh interval cleared')
      }
    }
  }, [autoRefresh, loadDashboardData])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu) {
        const target = event.target as Element
        if (!target.closest('.profile-menu')) {
          setShowProfileMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  const syncMembers = async () => {
    setLoading(true)
    try {
      // Use the optimized sync method with enhanced user isolation
      const response = await fetch('/api/sync-members-optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, experienceId }),
      })

      const result = await response.json()

      if (result.success) {
        showToastMessage(`✅ Successfully synced ${result.count} members from your Whop community!`, 'success')
        loadDashboardData()
      } else {
        // Handle specific error codes
        if (result.code === 'AUTH_FAILED') {
          showToastMessage('❌ Authentication failed. Please refresh the page and try again.', 'error')
        } else if (result.code === 'USER_ID_MISMATCH') {
          showToastMessage('❌ User verification failed. Please refresh the page.', 'error')
        } else {
          showToastMessage('❌ Error syncing members: ' + result.error, 'error')
        }
      }
    } catch (error: any) {
      showToastMessage('❌ Error syncing members: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  const [testEmailDialog, setTestEmailDialog] = useState({ open: false, campaignId: '', campaignName: '' })
  const [testEmail, setTestEmail] = useState('')

  const sendTestEmail = async (campaignId: string, campaignName: string) => {
    setTestEmail(user.email || '')
    setTestEmailDialog({ open: true, campaignId, campaignName })
  }



  const performTestEmailSend = async () => {
    if (!testEmail.trim()) {
      showToastMessage('❌ Please enter a valid email address', 'error')
      return
    }

    try {
      const response = await fetch('/api/send-test-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, campaignId: testEmailDialog.campaignId, testEmail }),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage(`✅ Test email sent successfully to ${testEmail}! Check your inbox for the test email from campaign: ${testEmailDialog.campaignName}`, 'success')
        setTestEmailDialog({ open: false, campaignId: '', campaignName: '' })
        setTestEmail('')
        // Refresh user data to update email count in UI
        setTimeout(async () => {
          await loadDashboardData()
        }, 500) // Small delay to ensure database update is complete
      } else {
        // Check if it's a daily limit exceeded error
        if (result.limitExceeded && result.data) {
          console.log('📊 Daily limit exceeded for test email, showing popup and redirecting to settings')
          showToastMessage('🚨 FREE PLAN LIMIT REACHED! 📧 You\'ve hit your daily email limit. Upgrade to Pro to send more emails!', 'error')
          // Redirect to settings page after a short delay
          setTimeout(() => {
            setCurrentPage('settings')
          }, 2000)
      } else {
        showToastMessage('❌ Error sending test email: ' + result.error, 'error')
        }
      }
    } catch (error: any) {
      showToastMessage('❌ Error: ' + error.message, 'error')
    }
  }

  const sendCampaign = async (campaignId: string, campaignName: string) => {
    showConfirmDialog(
      'Send Campaign',
      `Are you sure you want to send "${campaignName}" to all your subscribers? This action cannot be undone.`,
      () => {
        // Actual send campaign logic
        performSendCampaign(campaignId, campaignName)
      },
      'warning',
      'Send Campaign'
    )
  }

  const performSendCampaign = async (campaignId: string, campaignName: string) => {

    console.log('🚀 Starting campaign send:', campaignId)
    setSendingCampaign(campaignId)
    setCampaignProgress({ status: 'starting', current: 0, total: 0, sent: 0, failed: 0 })

    try {
      // First debug the setup
      const debugResponse = await fetch('/api/debug-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, campaignId }),
      })
      const debugResult = await debugResponse.json()

      console.log('🐛 Debug result:', debugResult)

      if (!debugResult.success) {
        showToastMessage('❌ Setup error: ' + debugResult.error, 'error')
        setSendingCampaign(null)
        setCampaignProgress(null)
        return
      }

      if (debugResult.debug.subscribers_count === 0) {
        showToastMessage('❌ No active subscribers found. Please sync members first.', 'error')
        setSendingCampaign(null)
        setCampaignProgress(null)
        return
      }

      // Start the campaign
      const response = await fetch('/api/send-campaign-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, campaignId, action: 'start' }),
      })
      const result = await response.json()

      console.log('📤 Campaign start result:', result)

      if (result.success) {
        // Start polling for progress
        pollCampaignProgressSimple(campaignId)
      } else {
        // Check if it's a daily limit exceeded error
        if (result.limitExceeded && result.data) {
          console.log('📊 Daily limit exceeded, showing popup and redirecting to settings')
          showToastMessage('🚨 FREE PLAN LIMIT REACHED! 📧 You\'ve hit your daily email limit. Upgrade to Pro to send more emails!', 'error')
          // Redirect to settings page after a short delay
          setTimeout(() => {
            setCurrentPage('settings')
          }, 2000)
        } else {
          showToastMessage('❌ Error starting campaign: ' + result.error, 'error')
        }
        setSendingCampaign(null)
        setCampaignProgress(null)
      }
    } catch (error: any) {
      console.error('❌ Campaign error:', error)
      showToastMessage('❌ Error: ' + error.message, 'error')
      setSendingCampaign(null)
      setCampaignProgress(null)
    }
  }

  const pollCampaignProgressSimple = async (campaignId: string) => {
    let pollCount = 0
    const maxPolls = 600 // 5 minutes at 500ms intervals

    console.log('🔄 Starting progress polling for campaign:', campaignId)

    const pollInterval = setInterval(async () => {
      pollCount++

      if (pollCount > maxPolls) {
        console.log('⏰ Polling timeout reached')
        clearInterval(pollInterval)
        setSendingCampaign(null)
        setCampaignProgress(null)
        showToastMessage('⏰ Campaign sending timed out. Please check the campaigns page for status.', 'info')
        return
      }

      try {
        const response = await fetch('/api/send-campaign-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, campaignId, action: 'status' }),
        })
        const result = await response.json()

        console.log(`📊 Poll ${pollCount}: Progress result:`, result)

        if (result.success && result.progress) {
          const progress = result.progress

          // Update progress state
          setCampaignProgress({
            status: progress.status,
            current: Math.max(0, progress.current || 0),
            total: Math.max(1, progress.total || 1),
            sent: Math.max(0, progress.sent || 0),
            failed: Math.max(0, progress.failed || 0),
            percentage: progress.percentage || 0
          })

          console.log(`📈 Progress: ${progress.current}/${progress.total} (${progress.percentage}%) - Status: ${progress.status}`)

          if (progress.status === 'completed') {
            console.log('✅ Campaign completed!')
            clearInterval(pollInterval)

            // Immediately refresh user data to update usage counts
            try {
              const userResponse = await fetch(`/api/user?userId=${userId}`)
              if (userResponse.ok) {
                const userData = await userResponse.json()
                if (userData.success) {
                  setUserPlan(userData.user)
                  console.log('🔄 Updated user usage data:', userData.user)
                }
              }
            } catch (error) {
              console.error('❌ Error refreshing user data:', error)
            }

            // Reload dashboard data
            setTimeout(async () => {
              await loadDashboardData()
              setSendingCampaign(null)

              // Auto-close after showing completion
              setTimeout(() => {
                setCampaignProgress(null)
                showToastMessage(`🎉 Campaign sent successfully! ✅ Sent: ${progress.sent || 0} emails ${progress.failed > 0 ? `❌ Failed: ${progress.failed || 0} emails` : ''}`, 'success')
              }, 3000)
            }, 1000)

          } else if (progress.status === 'failed') {
            console.log('❌ Campaign failed:', progress.error)
            clearInterval(pollInterval)
            setTimeout(() => {
              setSendingCampaign(null)
              setCampaignProgress(null)
              showToastMessage(`❌ Campaign failed: ${progress.error || 'Unknown error'}`, 'error')
            }, 1000)
          }
        } else {
          console.log('⚠️ No progress data received')
          if (pollCount > 10) {
            clearInterval(pollInterval)
            setSendingCampaign(null)
            setCampaignProgress(null)
            showToastMessage('❌ Lost connection to campaign progress.', 'error')
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
        if (pollCount > 20) {
          clearInterval(pollInterval)
          setSendingCampaign(null)
          setCampaignProgress(null)
          showToastMessage('❌ Network error while tracking progress.', 'error')
        }
      }
    }, 1000) // Poll every second for better responsiveness
  }

  // Keep the old function for backward compatibility
  const pollCampaignProgress = async (progressKey: string, campaignId: string) => {
    console.log('⚠️ Using legacy progress polling')
    pollCampaignProgressSimple(campaignId)
  }

  const createSampleCampaign = async () => {
    const sampleCampaign = {
      name: 'Welcome to FlowMail - Sample Campaign',
      subject: 'Welcome to our community! 🎉',
      preview_text: 'Thanks for joining us - here\'s what you need to know',
      html_content: `<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #fff; padding: 40px;"><div style="background: #6366f1; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: #fff; margin: 0; font-size: 28px;">Welcome {{name}}! 🎉</h1></div><div style="padding: 40px; background: #f9fafb;"><p style="font-size: 18px; color: #1f2937;">Hey {{name}},</p><p style="color: #4b5563; line-height: 1.6;">Welcome to our amazing community! We're so excited to have you here.</p><p style="color: #4b5563; line-height: 1.6;">Your email: {{email}}<br>Your tier: {{tier}}</p><div style="text-align: center; margin: 30px 0;"><a href="#" style="background: #6366f1; color: #fff; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Get Started Now</a></div><p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Questions? Just reply to this email!</p></div></div>`,
      segment: 'all'
    }

    try {
      const response = await fetch('/api/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sampleCampaign, userId }),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage('✅ Sample campaign created! You can now test sending emails.', 'success')
        loadDashboardData()
      } else {
        showToastMessage('❌ Error creating sample campaign: ' + result.error, 'error')
      }
    } catch (error: any) {
      showToastMessage('❌ Error: ' + error.message, 'error')
    }
  }

  const deleteMember = async (memberId: string, memberName: string) => {
    showConfirmDialog(
      'Delete Member',
      `Are you sure you want to delete "${memberName}" from your subscriber list? This action cannot be undone.`,
      () => {
        performDeleteMember(memberId)
      },
      'danger',
      'Delete Member'
    )
  }

  const performDeleteMember = async (memberId: string) => {

    setDeletingMember(memberId)
    try {
      const response = await fetch('/api/delete-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, memberId }),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage('✅ Member deleted successfully!', 'success')
        loadDashboardData()
      } else {
        showToastMessage('❌ Error deleting member: ' + result.error, 'error')
      }
    } catch (error: any) {
      showToastMessage('❌ Error: ' + error.message, 'error')
    } finally {
      setDeletingMember(null)
    }
  }

  const clearAllData = async () => {
    console.log('Clear all data button clicked')
    showConfirmDialog(
      'Clear ALL Data',
      '⚠️ Are you sure you want to clear ALL data? This will delete all subscribers and campaigns. This action cannot be undone!\n\n🚨 FINAL WARNING: This will permanently delete everything. This is your last chance to cancel.',
      () => {
        console.log('Confirmation clicked, calling performClearAllData')
            performClearAllData()
          },
          'danger',
          'DELETE EVERYTHING'
    )
  }

  const performClearAllData = async () => {
    console.log('performClearAllData called')
    setLoading(true)
    try {
      console.log('Clearing data for user:', userId)
      const response = await fetch('/api/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, confirmClear: true }),
      })
      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Clear data result:', result)

      if (result.success) {
        showToastMessage(`✅ All data cleared successfully! Deleted ${result.deletedCounts?.subscribers || 0} subscribers and ${result.deletedCounts?.campaigns || 0} campaigns.`, 'success')
        // Reload all data
        console.log('Reloading dashboard data...')
        await loadDashboardData()
        console.log('Dashboard data reloaded')
      } else {
        showToastMessage('❌ Error clearing data: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Clear data error:', error)
      showToastMessage('❌ Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
      console.log('Clear data process completed')
    }
  }



  const handleAddMember = async (name: string, email: string, tier: string) => {
    if (!name || !email) {
      showToastMessage('❌ Please fill in all required fields', 'error')
      return
    }

    // Prevent multiple submissions
    if (loading) {
      console.log('⚠️ Already processing, ignoring duplicate request')
      return
    }

    console.log('handleAddMember called with:', { name, email, tier })
    console.log('userId:', userId)

    setLoading(true)
    try {
      const requestBody = {
        userId,
        name,
        email,
        tier
      }

      console.log('Sending request with body:', requestBody)

      const response = await fetch('/api/add-member-optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage(`✅ ${result.message}`, 'success')
        setShowAddMemberModal(false)
        loadDashboardData()
      } else {
        // Handle specific error codes
        if (result.code === 'AUTH_FAILED') {
          showToastMessage('❌ Authentication failed. Please refresh the page and try again.', 'error')
        } else if (result.code === 'USER_ID_MISMATCH') {
          showToastMessage('❌ User verification failed. Please refresh the page.', 'error')
        } else {
          showToastMessage(`❌ ${result.error}`, 'error')
        }
      }
    } catch (error: any) {
      showToastMessage('❌ Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile) {
      showToastMessage('❌ Please select a file to upload', 'error')
      return
    }

    setUploading(true)
    try {
      const fileContent = await uploadFile.text()
      const lines = fileContent.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        showToastMessage('❌ File appears to be empty or invalid', 'error')
        return
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const subscribers = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length >= 2) {
          const subscriber: any = {}
          headers.forEach((header, index) => {
            subscriber[header] = values[index] || ''
          })

          if (subscriber.name && subscriber.email) {
            subscribers.push({
              name: subscriber.name,
              email: subscriber.email,
              tier: subscriber.tier || 'basic'
            })
          }
        }
      }

      if (subscribers.length === 0) {
        showToastMessage('❌ No valid subscribers found in file', 'error')
        return
      }

      const response = await fetch('/api/upload-subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscribers }),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage(`✅ ${result.message}`, 'success')
        setShowUploadModal(false)
        setUploadFile(null)
        loadDashboardData()
      } else {
        showToastMessage(`❌ ${result.error}`, 'error')
      }
    } catch (error: any) {
      showToastMessage('❌ Error processing file: ' + error.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const downloadSample = () => {
    window.open('/api/download-sample', '_blank')
  }

  const handleEditCampaign = (campaign: Campaign) => {
    if (campaign.status === 'sent') {
      showToastMessage('❌ Cannot edit campaigns that have already been sent.', 'error')
      return
    }
    setEditingCampaign(campaign)
    setCurrentPage('edit-campaign')
  }

  const handleUpdateCampaign = async (updatedCampaign: any) => {
    try {
      const response = await fetch('/api/update-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          campaignId: editingCampaign?.id,
          ...updatedCampaign
        }),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage('✅ Campaign updated successfully!', 'success')
        setEditingCampaign(null)
        setCurrentPage('campaigns')
        loadDashboardData()
      } else {
        showToastMessage('❌ Error updating campaign: ' + result.error, 'error')
      }
    } catch (error: any) {
      showToastMessage('❌ Error: ' + error.message, 'error')
    }
  }

  const toggleCampaignSelection = (campaignId: string) => {
    const newSelected = new Set(selectedCampaigns)
    if (newSelected.has(campaignId)) {
      newSelected.delete(campaignId)
    } else {
      newSelected.add(campaignId)
    }
    setSelectedCampaigns(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedCampaigns.size === 0) {
      showToastMessage('❌ Please select campaigns to delete.', 'error')
      return
    }

    const campaignNames = campaigns
      .filter(c => selectedCampaigns.has(c.id))
      .map(c => c.name)
      .join(', ')

    showConfirmDialog(
      'Delete Campaigns',
      `Are you sure you want to delete ${selectedCampaigns.size} campaign(s)?\n\n${campaignNames}\n\nThis action cannot be undone.`,
      () => {
        performDeleteSelected()
      },
      'danger',
      'Delete Campaigns'
    )
  }

  const performDeleteSelected = async () => {

    setDeletingCampaigns(true)
    try {
      const response = await fetch('/api/delete-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          campaignIds: Array.from(selectedCampaigns)
        }),
      })
      const result = await response.json()

      if (result.success) {
        showToastMessage(`✅ Successfully deleted ${result.deletedCount} campaign(s)!`, 'success')
        setSelectedCampaigns(new Set())
        setShowDeleteMode(false)
        loadDashboardData()
      } else {
        showToastMessage('❌ Error deleting campaigns: ' + result.error, 'error')
      }
    } catch (error: any) {
      showToastMessage('❌ Error: ' + error.message, 'error')
    } finally {
      setDeletingCampaigns(false)
    }
  }

  // Separate memoized modal component to prevent re-renders
  const AddMemberModal = memo(({
    isOpen,
    onClose,
    onSubmit,
    isLoading
  }: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (name: string, email: string, tier: string) => void
    isLoading: boolean
  }) => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [tier, setTier] = useState('basic')

    const handleSubmit = () => {
      if (!name || !email) {
        showToastMessage('❌ Please fill in all required fields', 'error')
        return
      }
      onSubmit(name, email, tier)
    }

    const handleClose = () => {
      setName('')
      setEmail('')
      setTier('basic')
      onClose()
    }

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-md mx-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Add New Member</h3>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-lg"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all hover:border-input/80"
                placeholder="John Doe"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all hover:border-input/80"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all hover:border-input/80"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="vip">VIP</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl transition-all duration-200 border border-border"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !name || !email}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <ClockIcon className="w-4 h-4 mr-2 animate-spin inline" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 mr-2 inline" />
                  Add Member
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  })
  const ProgressModal = () => {
    if (!campaignProgress) return null

    const progressPercentage = campaignProgress.total > 0
      ? Math.min(100, Math.round((campaignProgress.current / campaignProgress.total) * 100))
      : 0

    const isCompleted = campaignProgress.status === 'completed'
    const isFailed = campaignProgress.status === 'failed'
    const isSending = campaignProgress.status === 'sending'

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-border/30 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 backdrop-blur-sm">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-all duration-300 ${isCompleted
              ? 'bg-green-500'
              : isFailed
                ? 'bg-destructive'
                : 'bg-primary'
              }`}>
              {isCompleted ? (
                <CheckCircleIcon className="w-8 h-8 text-card-foreground" />
              ) : isFailed ? (
                <XCircleIcon className="w-8 h-8 text-card-foreground" />
              ) : (
                <PaperAirplaneIcon className={`w-8 h-8 text-card-foreground ${isSending ? 'animate-pulse' : ''}`} />
              )}
            </div>

            <h3 className="text-2xl font-bold text-card-foreground mb-4">
              {isCompleted ? 'Campaign Sent!' : isFailed ? 'Campaign Failed' : 'Sending Campaign'}
            </h3>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm text-card-foreground font-mono">
                  {campaignProgress.current || 0} / {campaignProgress.total || 0} ({progressPercentage}%)
                </span>
              </div>

              <div className="w-full bg-muted rounded-full h-4 border border-border overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ease-out ${isCompleted
                    ? 'bg-green-500'
                    : isFailed
                      ? 'bg-destructive'
                      : 'bg-primary'
                    } ${isSending ? 'animate-pulse' : ''}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center mt-3 text-xs">
                <span className="text-muted-foreground">
                  {isCompleted
                    ? '✅ All emails processed!'
                    : isFailed
                      ? '❌ Sending failed'
                      : isSending
                        ? '📧 Sending emails...'
                        : '⏳ Preparing...'}
                </span>
                <span className="text-muted-foreground font-mono">
                  {campaignProgress.sent || 0}✅ {campaignProgress.failed || 0}❌
                </span>
              </div>
            </div>

            {(isCompleted || isFailed) && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Successfully Sent:</span>
                    <span className="text-green-500 font-semibold">{campaignProgress.sent || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="text-red-500 font-semibold">{campaignProgress.failed || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border pt-2">
                    <span className="text-card-foreground font-medium">Total Processed:</span>
                    <span className="text-card-foreground font-semibold">{campaignProgress.total || 0}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCampaignProgress(null)
                    setSendingCampaign(null)
                    // Refresh data after closing
                    loadDashboardData()
                  }}
                  className={`w-full font-bold py-3 px-6 rounded-xl transition-all duration-200 ${isCompleted
                    ? 'bg-green-500 hover:bg-green-600 text-card-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    }`}
                >
                  {isCompleted ? '🎉 Awesome! Close' : 'Close'}
                </button>
              </div>
            )}

            {isSending && (
              <div className="text-xs text-muted-foreground animate-pulse">
                Please wait while we send your emails...
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: IconComponent, color = 'blue' }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
  }) => {
    return (
      <div className={cn(
        "bg-card border border-border rounded-xl transition-all duration-200",
        isMobile ? "p-4 shadow-sm" : "p-4 sm:p-6 hover:bg-accent/50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{title}</div>
            <div className="text-xl sm:text-2xl font-semibold text-card-foreground">{value}</div>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            color === 'blue' ? 'bg-primary/20 text-primary' :
            color === 'green' ? 'bg-green-500/20 text-green-500' :
            color === 'purple' ? 'bg-purple-500/20 text-purple-500' :
            'bg-orange-500/20 text-orange-500'
          )}>
            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    )
  }

  // Mobile Bottom Navigation Component
  const MobileBottomNav = () => {
    if (!isMobile) return null

    const navItems = [
      { name: 'Dashboard', key: 'dashboard', icon: ChartBarIcon },
      { name: 'Campaigns', key: 'campaigns', icon: EnvelopeIcon },
      { name: 'Subscribers', key: 'subscribers', icon: UserGroupIcon },
      { name: 'Analytics', key: 'analytics', icon: ChartPieIcon },
      { name: 'Settings', key: 'settings', icon: Cog6ToothIcon },
    ]

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              className={cn(
                "flex items-center justify-center p-3 rounded-lg transition-all duration-200 min-w-0 flex-1",
                currentPage === item.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
              title={item.name}
            >
              <item.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const Navbar = () => (
    <div className={cn(
      "border-b border-border bg-card/50 backdrop-blur-sm",
      isMobile ? "mb-4" : "mb-4 sm:mb-8"
    )}>
      <div className="px-4 sm:px-6 py-4">
        <div className={cn(
          "flex items-center justify-between",
          isMobile ? "mb-0" : "mb-4 sm:mb-6"
        )}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <EnvelopeIconSolid className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">FlowMail</h1>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-accent rounded-lg transition-all duration-200 group"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <MoonIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>
            
            {/* Profile Menu */}
          <div className="relative profile-menu">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 hover:bg-accent rounded-lg px-3 py-2 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium text-secondary-foreground">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground hidden lg:inline">{user.email}</span>
              <ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-2xl z-50 backdrop-blur-sm">
                <div className="py-1">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="text-sm font-medium text-popover-foreground">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  
                  {/* Plan Status */}
                  <div className="px-3 py-2 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-popover-foreground">
                          {userPlan?.plan === 'free' ? 'Free Plan' : 
                           userPlan?.plan === 'starter' ? 'Starter Plan' :
                           userPlan?.plan === 'growth' ? 'Growth Plan' : 
                           userPlan?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {userPlan?.plan === 'free' ? '10 emails/day' : 
                           userPlan?.plan === 'starter' ? '3,000 emails/month' :
                           userPlan?.plan === 'growth' ? '5,000 emails/month' : 
                           userPlan?.plan === 'pro' ? '10,000 emails/month' : '10 emails/day'}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userPlan?.plan === 'free' ? 'bg-muted text-muted-foreground' :
                        userPlan?.plan === 'starter' ? 'bg-primary text-primary-foreground' :
                        userPlan?.plan === 'growth' ? 'bg-secondary text-secondary-foreground' :
                        'bg-accent text-accent-foreground'
                      }`}>
                        {userPlan?.plan === 'free' ? 'FREE' : 
                         userPlan?.plan === 'starter' ? 'STARTER' :
                         userPlan?.plan === 'growth' ? 'GROWTH' : 
                         userPlan?.plan === 'pro' ? 'PRO' : 'FREE'}
                      </div>
                    </div>
                    
                    {/* Usage indicator for free plan */}
                    {userPlan?.plan === 'free' && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Today's usage</span>
                          <span>{userPlan?.emails_sent_today || 0}/10</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="h-1 rounded-full bg-gradient-to-r from-primary to-secondary"
                            style={{ width: `${Math.min(((userPlan?.emails_sent_today || 0) / 10) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Usage indicator for paid plans */}
                    {(userPlan?.plan === 'growth' || userPlan?.plan === 'pro') && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Monthly usage</span>
                          <span>{userPlan?.emails_sent_this_month || 0}/{userPlan?.plan === 'growth' ? '5,000' : '10,000'}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="h-1 rounded-full bg-gradient-to-r from-primary to-secondary"
                            style={{ 
                              width: `${Math.min(((userPlan?.emails_sent_this_month || 0) / (userPlan?.plan === 'growth' ? 5000 : 10000)) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Settings Link */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      setCurrentPage('settings')
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center transition-colors duration-200"
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Mobile Navigation */}
          <div className="flex sm:hidden items-center space-x-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-accent rounded-lg transition-all duration-200 group"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <MoonIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>
            
            {/* Profile Menu */}
            <div className="relative profile-menu">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 hover:bg-accent rounded-lg px-2 py-1 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-secondary-foreground">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-2xl z-50 backdrop-blur-sm">
                  <div className="py-1">
                    <div className="px-3 py-2 border-b border-border">
                      <div className="text-sm font-medium text-popover-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    
                    {/* Plan Status */}
                    <div className="px-3 py-2 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-popover-foreground">
                            {userPlan?.plan === 'free' ? 'Free Plan' : 
                             userPlan?.plan === 'starter' ? 'Starter Plan' :
                             userPlan?.plan === 'growth' ? 'Growth Plan' : 
                             userPlan?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {userPlan?.plan === 'free' ? '10 emails/day' : 
                             userPlan?.plan === 'starter' ? '3,000 emails/month' :
                             userPlan?.plan === 'growth' ? '5,000 emails/month' : 
                             userPlan?.plan === 'pro' ? '10,000 emails/month' : '10 emails/day'}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userPlan?.plan === 'free' ? 'bg-muted text-muted-foreground' :
                          userPlan?.plan === 'starter' ? 'bg-primary text-primary-foreground' :
                          userPlan?.plan === 'growth' ? 'bg-secondary text-secondary-foreground' :
                          'bg-accent text-accent-foreground'
                        }`}>
                          {userPlan?.plan === 'free' ? 'FREE' : 
                           userPlan?.plan === 'starter' ? 'STARTER' :
                           userPlan?.plan === 'growth' ? 'GROWTH' : 
                           userPlan?.plan === 'pro' ? 'PRO' : 'FREE'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Settings Link */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        setCurrentPage('settings')
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center transition-colors duration-200"
                    >
                      <Cog6ToothIcon className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex space-x-1">
          {[
            { name: 'Dashboard', key: 'dashboard', icon: ChartBarIcon },
            { name: 'Campaigns', key: 'campaigns', icon: EnvelopeIcon },
            { name: 'Subscribers', key: 'subscribers', icon: UserGroupIcon },
            { name: 'Analytics', key: 'analytics', icon: ChartPieIcon },
            { name: 'Templates', key: 'templates', icon: PaintBrushIcon },
            { name: 'Domains', key: 'domains', icon: GlobeAltIcon },
            { name: 'Settings', key: 'settings', icon: Cog6ToothIcon },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              className={cn(
                "inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                currentPage === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
  const DashboardPage = () => (
    <div className={cn(
      "space-y-6",
      isMobile ? "space-y-4" : "sm:space-y-8"
    )}>
      <div>
        <h1 className={cn(
          "font-semibold text-foreground mb-2",
          isMobile ? "text-xl" : "text-2xl sm:text-3xl"
        )}>Dashboard</h1>
        <p className="text-muted-foreground">Overview of your email program.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>

          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard title="Total Subscribers" value={stats.subscribers.toLocaleString()} icon={UserGroupIcon} />
        <StatCard title="Campaigns Sent" value={stats.campaigns} icon={EnvelopeIcon} />
        <StatCard title="Emails Sent" value={stats.emailsSent.toLocaleString()} icon={PaperAirplaneIcon} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mr-3">
              <BoltIcon className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h3 className="text-lg font-medium text-card-foreground">Recent Campaigns</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Latest activity and performance.</p>
          <div className="space-y-3">
            {campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                <div className="flex-1">
                  <div className="text-sm font-medium text-card-foreground truncate">{campaign.name}</div>
                  <div className="text-xs text-muted-foreground">{campaign.subject}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-card-foreground">{campaign.total_recipients}</div>
                  <div className="text-xs text-muted-foreground">recipients</div>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm">No campaigns yet</div>
                <button
                  onClick={() => setCurrentPage('campaigns')}
                  className="mt-3 text-sm text-primary hover:text-primary/80"
                >
                  Create your first campaign
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 hover:bg-accent/50 transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <RocketLaunchIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground mb-4">
              Quick access to all main features
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage('campaigns')}
                className="w-full text-left bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground text-sm py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-between group"
              >
                <span>Create New Campaign</span>
                <div className="flex items-center ml-2">
                  <PlusIcon className="w-4 h-4 text-secondary-foreground group-hover:scale-110 transition-transform duration-200" />
                </div>
              </button>
              <button
                onClick={() => setCurrentPage('subscribers')}
                className="w-full text-left bg-accent hover:bg-accent/80 border border-border text-accent-foreground text-sm py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-between group"
              >
                <span>Manage Subscribers</span>
                <div className="flex items-center ml-2">
                  <UserGroupIcon className="w-4 h-4 text-accent-foreground group-hover:scale-110 transition-transform duration-200" />
                </div>
              </button>
              <button
                onClick={syncMembers}
                disabled={loading}
                className="w-full text-left bg-primary hover:bg-primary/80 border border-border text-primary-foreground text-sm py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-between group disabled:opacity-50"
              >
                <span>{loading ? 'Syncing...' : 'Sync Whop Members'}</span>
                <div className="flex items-center ml-2">
                  <ArrowPathIcon className={`w-4 h-4 text-primary-foreground group-hover:scale-110 transition-transform duration-200 ${loading ? 'animate-spin' : ''}`} />
                </div>
              </button>
              <button
                onClick={() => setCurrentPage('templates')}
                className="w-full text-left bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground text-sm py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-between group"
              >
                <span>Email Templates</span>
                <div className="flex items-center ml-2">
                  <PaintBrushIcon className="w-4 h-4 text-secondary-foreground group-hover:scale-110 transition-transform duration-200" />
            </div>
              </button>
              <button
                onClick={() => setCurrentPage('domains')}
                className="w-full text-left bg-accent hover:bg-accent/80 border border-border text-accent-foreground text-sm py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-between group"
              >
                <span>Domain Setup</span>
                <div className="flex items-center ml-2">
                  <GlobeAltIcon className="w-4 h-4 text-accent-foreground group-hover:scale-110 transition-transform duration-200" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  const CampaignsPage = () => (
    <div className={cn(
      "space-y-4",
      isMobile ? "space-y-4" : "sm:space-y-6"
    )}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className={cn(
            "font-semibold text-foreground",
            isMobile ? "text-lg" : "text-xl sm:text-2xl"
          )}>Campaigns</h2>
          <p className="text-muted-foreground mt-1">Create and manage your email campaigns</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {showDeleteMode ? (
            <>
              <button
                onClick={() => {
                  setShowDeleteMode(false)
                  setSelectedCampaigns(new Set())
                }}
                className="inline-flex items-center px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl transition-all duration-200"
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedCampaigns.size === 0 || deletingCampaigns}
                className="inline-flex items-center px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {deletingCampaigns ? (
                  <>
                    <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Delete Selected ({selectedCampaigns.size})
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {campaigns.length > 0 && (
                <button
                  onClick={() => setShowDeleteMode(true)}
                  className="inline-flex items-center px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg"
                >
                  <TrashIcon className="w-5 h-5 mr-2" />
                  Delete Campaigns
                </button>
              )}
              <button
                onClick={() => setCurrentPage('create-campaign')}
                className="inline-flex items-center px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-300 shadow-lg hover:scale-105 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <PlusIcon className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Create Campaign</span>
              </button>
            </>
          )}
        </div>
      </div>

      {campaigns.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-border">
            <h3 className="text-lg sm:text-xl font-semibold text-card-foreground">All Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/50">
                <tr>
                  {showDeleteMode && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.size === campaigns.length && campaigns.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCampaigns(new Set(campaigns.map(c => c.id)))
                          } else {
                            setSelectedCampaigns(new Set())
                          }
                        }}
                        className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                      />
                    </th>
                  )}
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Campaign</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipients</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-accent/50">
                    {showDeleteMode && (
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCampaigns.has(campaign.id)}
                          onChange={() => toggleCampaignSelection(campaign.id)}
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                        />
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          className={`text-sm font-medium transition-colors cursor-pointer text-left flex items-center ${campaign.status === 'sent'
                            ? 'text-muted-foreground cursor-not-allowed'
                            : 'text-card-foreground hover:text-primary'
                            }`}
                          disabled={campaign.status === 'sent'}
                        >
                          {campaign.name}
                          {campaign.status !== 'sent' && (
                            <span className="ml-2 text-xs text-primary">✏️</span>
                          )}
                        </button>
                        <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${campaign.status === 'sent'
                        ? 'bg-green-500/20 text-green-400'
                        : campaign.status === 'draft'
                          ? 'bg-muted/20 text-muted-foreground'
                          : 'bg-primary/20 text-primary'
                        }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {campaign.total_recipients || 0}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : 'Not sent'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => sendTestEmail(campaign.id, campaign.name)}
                          className="inline-flex items-center justify-center px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all duration-200 shadow-md"
                        >
                          <PaperAirplaneIcon className="w-3 h-3 mr-1" />
                          Send Test
                        </button>
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => sendCampaign(campaign.id, campaign.name)}
                            disabled={sendingCampaign === campaign.id}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md relative overflow-hidden group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                            {sendingCampaign === campaign.id ? (
                              <>
                                <ClockIcon className="w-3 h-3 mr-1 animate-spin relative z-10" />
                                <span className="relative z-10">Sending...</span>
                              </>
                            ) : (
                              <>
                                <RocketLaunchIcon className="w-3 h-3 mr-1 relative z-10" />
                                <span className="relative z-10">Send Now</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <EnvelopeIcon className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-3">No campaigns yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Get started by creating your first email campaign to engage with your community</p>
            <div className="space-y-4">
              <button
                onClick={() => setCurrentPage('create-campaign')}
                className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-card-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Campaign
              </button>
              <button
                onClick={() => createSampleCampaign()}
                className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-card-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
              >
                <BeakerIcon className="w-5 h-5 mr-2" />
                Create Sample Campaign (for testing)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  const SubscribersPage = () => (
    <div className={cn(
      "space-y-4",
      isMobile ? "space-y-4" : "sm:space-y-6"
    )}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className={cn(
            "font-semibold text-card-foreground",
            isMobile ? "text-lg" : "text-xl sm:text-2xl"
          )}>Subscribers</h2>
          <p className="text-muted-foreground mt-1">Manage your community members and audience</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Member
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Upload CSV
          </button>
          <button
            onClick={syncMembers}
            disabled={loading}
            className="inline-flex items-center justify-center px-8 py-3.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            {loading ? (
              <ClockIcon className="w-5 h-5 mr-2 animate-spin relative z-10" />
            ) : (
              <ArrowPathIcon className="w-5 h-5 mr-2 relative z-10" />
            )}
            <span className="relative z-10">{loading ? 'Syncing...' : 'Sync from Whop'}</span>
          </button>
          <button
            onClick={clearAllData}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-card-foreground font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
          >
            <TrashIcon className="w-5 h-5 mr-2" />
            Clear All Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Subscribers</div>
              <div className="text-2xl font-bold text-card-foreground">{subscribers.length}</div>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
              <UserGroupIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Active Members</div>
              <div className="text-2xl font-bold text-green-400">
                {subscribers.filter(s => s.status === 'active').length}
              </div>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">VIP Members</div>
              <div className="text-2xl font-bold text-purple-400">
                {subscribers.filter(s => s.tier === 'VIP').length}
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {subscribers.length > 0 ? (
        <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h3 className="text-xl font-semibold text-card-foreground">All Subscribers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Synced</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {subscribers.map((subscriber, index) => (
                  <tr key={subscriber.id || index} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-card-foreground">{subscriber.name}</div>
                        <div className="text-sm text-muted-foreground">{subscriber.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${subscriber.tier === 'VIP'
                        ? 'bg-purple-500/20 text-purple-400'
                        : subscriber.tier === 'Pro'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted/20 text-muted-foreground'
                        }`}>
                        {subscriber.tier || 'Basic'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${subscriber.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}>
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {subscriber.synced_at ? new Date(subscriber.synced_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => deleteMember(subscriber.id, subscriber.name)}
                        disabled={deletingMember === subscriber.id}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-card-foreground text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                      >
                        {deletingMember === subscriber.id ? (
                          <>
                            <ClockIcon className="w-3 h-3 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <TrashIcon className="w-3 h-3 mr-1" />
                            Delete
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <UserGroupIcon className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-3">No subscribers yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Import your Whop community members to start building your email list</p>
            <button
              onClick={syncMembers}
              disabled={loading}
              className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-card-foreground font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
            >
              {loading ? (
                <>
                  <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                  Syncing Members...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Import from Whop
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (() => {
        const ModalContent = () => {
          const [name, setName] = useState('')
          const [email, setEmail] = useState('')
          const [tier, setTier] = useState('basic')
          const [isSubmitting, setIsSubmitting] = useState(false)

          const handleSubmit = async () => {
            if (!name || !email) {
              showToastMessage('❌ Please fill in all required fields', 'error')
              return
            }

            // Prevent double submission
            if (isSubmitting) {
              console.log('⚠️ Already submitting, ignoring duplicate click')
              return
            }

            setIsSubmitting(true)
            try {
              await handleAddMember(name, email, tier)
            } finally {
              setIsSubmitting(false)
            }
          }

          const handleClose = () => {
            setShowAddMemberModal(false)
          }

          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-card-foreground">Add New Member</h3>
                  <button
                    onClick={handleClose}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-lg"
                  >
                    <XCircleIcon className="w-8 h-8" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      placeholder="John Doe"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-2">
                      Tier
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    >
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="vip">VIP</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-8">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !name || !email}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <ClockIcon className="w-4 h-4 mr-2 animate-spin inline" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2 inline" />
                        Add Member
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        return <ModalContent />
      })()}

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-card-foreground">Upload Subscribers</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-lg"
              >
                <XCircleIcon className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="p-5 bg-primary/10 border border-primary/30 rounded-xl">
                <h4 className="text-sm font-bold text-primary mb-2">📋 CSV Format Required</h4>
                <p className="text-sm text-primary mb-3">Your CSV file should have these columns:</p>
                <div className="text-xs text-muted-foreground font-mono bg-muted p-3 rounded-lg border border-border">
                  name,email,tier<br />
                  John Doe,john@example.com,premium<br />
                  Jane Smith,jane@example.com,basic
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                />
              </div>

              {uploadFile && (
                <div className="text-sm text-green-500 bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                  ✅ Selected: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-8">
              <button
                onClick={downloadSample}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-all duration-200 flex items-center text-sm"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                 Template
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground font-medium rounded-lg transition-all duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={uploading || !uploadFile}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {uploading ? (
                    <>
                      <ClockIcon className="w-4 h-4 mr-2 animate-spin inline" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="w-4 h-4 mr-2 inline" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )



  const CreateCampaignPage = () => {
    const [formData, setFormData] = useState({
      name: '',
      subject: '',
      preview_text: '',
      html_content: '',
      segment: 'all'
    })
    const [sending, setSending] = useState(false)
    const [loadingTemplate, setLoadingTemplate] = useState(false)

    // Load template data when selectedTemplate changes
    useEffect(() => {
      console.log('🎨 CreateCampaignPage useEffect triggered, selectedTemplate:', selectedTemplate)
      if (selectedTemplate) {
        setLoadingTemplate(true)
        console.log('📝 Loading template:', selectedTemplate.name)

        // Use setTimeout to ensure this runs after the component has fully rendered
        setTimeout(() => {
          // Get template HTML directly from selectedTemplate
          const html = selectedTemplate.html || ''
          console.log('✅ Template HTML loaded, length:', html.length)

          const newFormData = {
            name: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
            subject: selectedTemplate.name,
            preview_text: selectedTemplate.description,
            html_content: html,
            segment: 'all'
          }

          console.log('🔄 Setting form data:', newFormData)
          setFormData(newFormData)
          setLoadingTemplate(false)

          // Clear the selected template after form is populated
          setTimeout(() => {
            setSelectedTemplate(null)
          }, 500)
        }, 50)
      }
    }, [selectedTemplate])

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.name || !formData.subject || !formData.html_content) {
        showToastMessage('❌ Please fill in all required fields', 'error')
        return
      }

      setSending(true)
      try {
        const response = await fetch('/api/create-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, userId }),
        })
        const result = await response.json()

        if (result.success) {
          showToastMessage('✅ Campaign created successfully!', 'success')
          setCurrentPage('campaigns')
          loadDashboardData()
        } else {
          showToastMessage('❌ Error creating campaign: ' + result.error, 'error')
        }
      } catch (error: any) {
        showToastMessage('❌ Error: ' + error.message, 'error')
      } finally {
        setSending(false)
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage('campaigns')}
            className="text-muted-foreground hover:text-card-foreground"
          >
            ← Back to Campaigns
          </button>
          <div>
            <h2 className="text-2xl font-semibold text-card-foreground">Create Campaign</h2>
            <p className="text-muted-foreground mt-1">Design and send your email campaign</p>
          </div>
        </div>

        {loadingTemplate && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-primary text-sm">Loading template...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Campaign Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Weekly Newsletter #13"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Send to
                </label>
                <select
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Members</option>
                  <option value="active">Active Members Only</option>
                  <option value="vip">VIP Members Only</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., This week's exclusive updates"
                required
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preview Text
              </label>
              <input
                type="text"
                value={formData.preview_text}
                onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Text that appears in email preview"
              />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Email Content</h3>

            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-2">
                Available merge tags: {`{{name}}`}, {`{{email}}`}, {`{{tier}}`}
              </div>
            </div>

            <textarea
              value={formData.html_content}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              rows={15}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your email content here... You can use HTML tags for formatting."
              required
            />

            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="text-sm font-medium text-primary mb-2">💡 Pro Tips:</h4>
              <ul className="text-sm text-primary space-y-1">
                <li>• Use {`{{name}}`} to personalize emails</li>
                <li>• Keep subject lines under 50 characters</li>
                <li>• Include a clear call-to-action</li>
                <li>• Test your email before sending</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setCurrentPage('campaigns')}
              className="inline-flex items-center px-6 py-3 bg-white/5 border border-border/50 hover:bg-white/10 hover:border-gray-500/50 text-gray-200 font-semibold rounded-xl transition-all duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !formData.name || !formData.subject || !formData.html_content}
              className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-card-foreground font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {sending ? (
                <>
                  <ClockIcon className="w-5 h-5 mr-2 animate-spin relative z-10" />
                  <span className="relative z-10">Creating...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Create Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  const EditCampaignPage = () => {
    const [formData, setFormData] = useState({
      name: editingCampaign?.name || '',
      subject: editingCampaign?.subject || '',
      preview_text: (editingCampaign as any)?.preview_text || '',
      html_content: (editingCampaign as any)?.html_content || ''
    })
    const [updating, setUpdating] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.name || !formData.subject || !formData.html_content) {
        showToastMessage('❌ Please fill in all required fields', 'error')
        return
      }

      setUpdating(true)
      try {
        await handleUpdateCampaign(formData)
      } finally {
        setUpdating(false)
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setEditingCampaign(null)
              setCurrentPage('campaigns')
            }}
            className="text-muted-foreground hover:text-card-foreground"
          >
            ← Back to Campaigns
          </button>
          <div>
            <h2 className="text-2xl font-semibold text-card-foreground">Edit Campaign</h2>
            <p className="text-muted-foreground mt-1">Update your email campaign details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Campaign Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Weekly Newsletter #13"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-muted-foreground">
                  {editingCampaign?.status || 'draft'}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., This week's exclusive updates"
                required
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preview Text
              </label>
              <input
                type="text"
                value={formData.preview_text}
                onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Text that appears in email preview"
              />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Email Content</h3>

            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-2">
                Available merge tags: {`{{name}}`}, {`{{email}}`}, {`{{tier}}`}
              </div>
            </div>

            <textarea
              value={formData.html_content}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              rows={15}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your email content here... You can use HTML tags for formatting."
              required
            />

            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="text-sm font-medium text-primary mb-2">💡 Pro Tips:</h4>
              <ul className="text-sm text-primary space-y-1">
                <li>• Use {`{{name}}`} to personalize emails</li>
                <li>• Keep subject lines under 50 characters</li>
                <li>• Include a clear call-to-action</li>
                <li>• Test your email before sending</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setEditingCampaign(null)
                setCurrentPage('campaigns')
              }}
              className="inline-flex items-center px-6 py-3 bg-white/5 border border-border/50 hover:bg-white/10 hover:border-gray-500/50 text-gray-200 font-semibold rounded-xl transition-all duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating || !formData.name || !formData.subject || !formData.html_content}
              className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-card-foreground font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {updating ? (
                <>
                  <ClockIcon className="w-5 h-5 mr-2 animate-spin relative z-10" />
                  <span className="relative z-10">Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Update Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  const TemplatesPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('All')

  // Only 10 essential templates
    const allTemplates = [
      {
        name: 'Welcome Email',
        icon: SparklesIcon,
        category: 'Welcome',
        description: 'Perfect for onboarding new members with style',
        color: 'from-green-500 to-emerald-600',
        preview: '🎉 Welcome to our amazing community! Get ready for an incredible journey...',
        features: ['Personalized greeting', 'Quick start guide', 'Community links']
      },
      {
        name: 'Weekly Newsletter',
        icon: DocumentTextIcon,
        category: 'Newsletter',
        description: 'Keep your community updated weekly',
        color: 'from-blue-500 to-indigo-600',
        preview: '📰 This week\'s highlights, updates, and community wins...',
        features: ['Weekly highlights', 'Member features', 'Upcoming events']
      },
      {
        name: 'Flash Sale',
        icon: BoltIcon,
        category: 'Promotion',
        description: 'Limited time offers and deals',
        color: 'from-red-500 to-pink-600',
        preview: '⚡ FLASH SALE: 50% OFF - Only 24 hours left!',
        features: ['Countdown timer', 'Urgency messaging', 'Clear CTA']
      },
      {
        name: 'Event Invitation',
        icon: EnvelopeIcon,
        category: 'Event',
        description: 'Invite members to upcoming events',
        color: 'from-violet-500 to-purple-600',
        preview: '🎪 You\'re invited to our exclusive community event!',
        features: ['Event details', 'RSVP button', 'Calendar integration']
      },
      {
        name: 'Product Updates',
        icon: BoltIcon,
        category: 'Newsletter',
        description: 'Announce new features and improvements',
        color: 'from-yellow-500 to-orange-600',
        preview: '⚡ Exciting new features and improvements just for you...',
        features: ['Feature announcements', 'How-to guides', 'Beta access']
      },
      {
        name: 'Survey Request',
        icon: ChartBarIcon,
        category: 'Engagement',
        description: 'Collect feedback from your audience',
        color: 'from-indigo-500 to-blue-600',
        preview: '📊 Help us improve: Share your thoughts in 2 minutes!',
        features: ['Quick survey', 'Incentives', 'Progress bar']
      },
      {
        name: 'Order Confirmation',
        icon: CheckCircleIcon,
        category: 'Transactional',
        description: 'Confirm successful purchases',
        color: 'from-green-500 to-emerald-600',
        preview: '✅ Order confirmed! Your purchase is being processed...',
        features: ['Order details', 'Tracking info', 'Support contact']
      },
      {
        name: 'Win-back Campaign',
        icon: RocketLaunchIcon,
        category: 'Retention',
        description: 'Re-engage inactive users',
        color: 'from-red-500 to-pink-600',
        preview: '💔 We miss you! Come back with this special 50% discount',
        features: ['Personal message', 'Special offer', 'Easy return path']
      },
      {
        name: 'Holiday Greetings',
        icon: SparklesIcon,
        category: 'Seasonal',
        description: 'Send festive holiday messages',
        color: 'from-red-500 to-green-600',
        preview: '🎄 Season\'s Greetings from our family to yours!',
        features: ['Holiday wishes', 'Festive design', 'Year recap']
      },
      {
        name: 'Partnership Announcement',
        icon: UserGroupIcon,
        category: 'Business',
        description: 'Announce new partnerships',
        color: 'from-teal-500 to-cyan-600',
        preview: '🤝 Exciting Partnership: We\'re joining forces for you!',
        features: ['Partnership details', 'Benefits', 'Future plans']
      }
    ]

      // Filter templates based on selected category
    const filteredTemplates = selectedCategory === 'All'
      ? allTemplates
      : allTemplates.filter(template => template.category === selectedCategory)

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Email Templates</h2>
          <p className="text-muted-foreground mt-1">Choose from 10 professionally designed templates to get started quickly</p>
        </div>

        {/* Template Categories Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {['All', 'Welcome', 'Newsletter', 'Promotion', 'Event', 'Engagement', 'Transactional', 'Retention', 'Seasonal', 'Business'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 border text-sm font-medium rounded-full transition-all duration-200 hover:scale-105 ${selectedCategory === category
                  ? 'bg-blue-500 border-blue-400 text-card-foreground shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 hover:bg-white/20 border-border/30 hover:border-gray-500/50 text-gray-300 hover:text-card-foreground'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredTemplates.map((template) => (
            <div key={template.name} className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:from-white/10 hover:to-white/15 hover:border-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/10">
              {/* Icon */}
              <div className={`w-10 h-10 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center mb-3 transition-transform duration-300`}>
                <template.icon className="w-5 h-5 text-card-foreground" />
              </div>

              {/* Title & Category */}
              <div className="mb-3">
                <h3 className="text-sm font-bold text-card-foreground mb-1 group-hover:text-primary transition-colors duration-300 line-clamp-1">{template.name}</h3>
                <span className={`inline-block bg-gradient-to-r ${template.color} bg-opacity-20 border border-white/20 text-card-foreground text-xs font-medium px-2 py-0.5 rounded-full`}>
                  {template.category}
                </span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-xs leading-relaxed mb-4 line-clamp-2">{template.description}</p>

              {/* Features */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Features:</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {template.features.slice(0, 2).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircleIcon className="w-3 h-3 text-green-400 mr-1" />
                      {feature}
                    </li>
                  ))}
                  {template.features.length > 2 && (
                    <li className="text-gray-500">+{template.features.length - 2} more</li>
                  )}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🎯 Use Template clicked for:', template.name)
                  
                  // Add a small delay to ensure state updates properly
                  setTimeout(() => {
                    setSelectedTemplate(template)
                    setCurrentPage('template-editor')
                  }, 50)
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-card-foreground text-xs font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 relative overflow-hidden group/btn cursor-pointer"
                type="button"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                <PaintBrushIcon className="w-3 h-3 mr-1.5 relative z-10" />
                <span className="relative z-10">Use Template</span>
              </button>

              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-5 rounded-xl blur-lg transition-opacity duration-500`}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

 const TemplateEditorPage = () => {
    const [editorData, setEditorData] = useState({
      subject: '',
      headline: '',
      bodyText: '',
      buttonText: '',
      buttonLink: '',
      campaignName: '',
      footerText: 'Thank you for being part of our community!',
      copyrightText: '© 2025 Your Company. All rights reserved.',
      headerBackgroundColor: '#667eea',
      headerTextColor: '#ffffff',
      bodyBackgroundColor: '#ffffff',
      bodyTextColor: '#333333',
      buttonBackgroundColor: '#667eea',
      buttonTextColor: '#ffffff',
      footerBackgroundColor: '#f8f9fa',
      footerTextColor: '#666666',
      borderColor: '#e5e7eb',
      accentColor: '#667eea'
    })
    const [previewHtml, setPreviewHtml] = useState('')
    const [creating, setCreating] = useState(false)
    const [showHtmlEditor, setShowHtmlEditor] = useState(false)
    const [extractedContent, setExtractedContent] = useState<any[]>([])

    // Initialize editor when template is selected
    useEffect(() => {
      if (selectedTemplate) {
        const defaultData = {
          subject: selectedTemplate.name,
          headline: `${selectedTemplate.name} - Special Update`,
          bodyText: 'Thank you for being part of our community. We have something special to share with you today.',
          buttonText: 'Learn More',
          buttonLink: 'https://example.com',
          campaignName: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
          footerText: 'Thank you for being part of our community!',
          copyrightText: '© 2025 Your Company. All rights reserved.',
          headerBackgroundColor: '#667eea',
          headerTextColor: '#ffffff',
          bodyBackgroundColor: '#ffffff',
          bodyTextColor: '#333333',
          buttonBackgroundColor: '#667eea',
          buttonTextColor: '#ffffff',
          footerBackgroundColor: '#f8f9fa',
          footerTextColor: '#666666',
          borderColor: '#e5e7eb',
          accentColor: '#667eea'
        }
        setEditorData(defaultData)
        updatePreview(defaultData)
      }
    }, [selectedTemplate])

    // Simplified template HTML generation with only 10 templates
    function getTemplateHTML(templateName: string, data: any = {}) {
      console.log('🎨 Generating template HTML for:', templateName);

      // Helper function to adjust color brightness
      const adjustColorBrightness = (hex: string, percent: number) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
      };

      // Helper function to convert hex to rgba
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      // Default data if not provided
      const templateData = {
        subject: data.subject || 'Your Email Subject',
        headline: data.headline || 'Amazing Headline',
        bodyText: data.bodyText || 'This is your email content. You can customize it as needed.',
        buttonText: data.buttonText || 'Learn More',
        buttonLink: data.buttonLink || '#',
        campaignName: data.campaignName || 'My Campaign',
        footerText: data.footerText || 'Thank you for being part of our community!',
        copyrightText: data.copyrightText || '© 2025 Your Company. All rights reserved.',
        headerBackgroundColor: data.headerBackgroundColor || '#667eea',
        headerTextColor: data.headerTextColor || '#ffffff',
        bodyBackgroundColor: data.bodyBackgroundColor || '#ffffff',
        bodyTextColor: data.bodyTextColor || '#333333',
        buttonBackgroundColor: data.buttonBackgroundColor || '#667eea',
        buttonTextColor: data.buttonTextColor || '#ffffff',
        footerBackgroundColor: data.footerBackgroundColor || '#f8f9fa',
        footerTextColor: data.footerTextColor || '#666666',
        borderColor: data.borderColor || '#e5e7eb',
        accentColor: data.accentColor || '#667eea',
        ...data
      };

      const templates: { [key: string]: string } = {
        'Welcome Email': `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', Arial, sans-serif; background: ${templateData.bodyBackgroundColor}; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${templateData.headerBackgroundColor} 0%, ${adjustColorBrightness(templateData.headerBackgroundColor, -20)} 100%); padding: 50px 30px; text-align: center;">
          <h1 style="color: ${templateData.headerTextColor}; margin: 0; font-size: 36px; font-weight: 800;">${templateData.headline}</h1>
          <p style="color: ${adjustColorBrightness(templateData.headerTextColor, 20)}; margin: 15px 0 0; font-size: 18px;">Welcome to our amazing community!</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: ${templateData.bodyTextColor}; font-size: 16px; line-height: 1.7; margin-bottom: 30px;">${templateData.bodyText}</p>
          
          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="${templateData.buttonLink}" style="display: inline-block; background: ${templateData.buttonBackgroundColor}; color: ${templateData.buttonTextColor}; padding: 16px 45px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 25px ${hexToRgba(templateData.buttonBackgroundColor, 0.3)};">${templateData.buttonText}</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: ${templateData.footerBackgroundColor}; padding: 30px; text-align: center; border-top: 1px solid ${templateData.borderColor};">
          <p style="color: ${templateData.footerTextColor}; font-size: 14px; margin: 0 0 8px 0;">${templateData.footerText}</p>
          <p style="color: ${adjustColorBrightness(templateData.footerTextColor, 20)}; font-size: 12px; margin: 0;">${templateData.copyrightText}</p>
        </div>
      </div>
    `,

        'Weekly Newsletter': `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', Arial, sans-serif; background: ${templateData.bodyBackgroundColor}; border-radius: 15px; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${templateData.headerBackgroundColor} 0%, ${adjustColorBrightness(templateData.headerBackgroundColor, -20)} 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: ${templateData.headerTextColor}; margin: 0; font-size: 32px; font-weight: 800;">${templateData.headline}</h1>
          <p style="color: ${adjustColorBrightness(templateData.headerTextColor, 20)}; margin: 15px 0 0; font-size: 16px;">Weekly updates and insights</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: ${templateData.bodyTextColor}; font-size: 16px; line-height: 1.7; margin-bottom: 30px;">${templateData.bodyText}</p>
          
          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="${templateData.buttonLink}" style="display: inline-block; background: ${templateData.buttonBackgroundColor}; color: ${templateData.buttonTextColor}; padding: 15px 35px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 5px 20px ${hexToRgba(templateData.buttonBackgroundColor, 0.3)};">${templateData.buttonText}</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: ${templateData.footerBackgroundColor}; padding: 25px; text-align: center; border-top: 1px solid ${templateData.borderColor};">
          <p style="color: ${templateData.footerTextColor}; font-size: 14px; margin: 0 0 8px 0;">${templateData.footerText}</p>
          <p style="color: ${adjustColorBrightness(templateData.footerTextColor, 20)}; font-size: 12px; margin: 0;">${templateData.copyrightText}</p>
        </div>
      </div>
    `,

        'Default': `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', Arial, sans-serif; background: ${templateData.bodyBackgroundColor}; border-radius: 15px; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${templateData.headerBackgroundColor} 0%, ${adjustColorBrightness(templateData.headerBackgroundColor, -20)} 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: ${templateData.headerTextColor}; margin: 0; font-size: 32px; font-weight: 800;">${templateData.headline}</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: ${templateData.bodyTextColor}; line-height: 1.7; margin-bottom: 30px;">${templateData.bodyText}</p>
          
          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="${templateData.buttonLink}" style="display: inline-block; background: ${templateData.buttonBackgroundColor}; color: ${templateData.buttonTextColor}; padding: 15px 35px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 5px 20px ${hexToRgba(templateData.buttonBackgroundColor, 0.3)};">${templateData.buttonText}</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: ${templateData.footerBackgroundColor}; padding: 30px; text-align: center; border-top: 1px solid ${templateData.borderColor};">
          <p style="color: ${templateData.footerTextColor}; font-size: 14px; margin: 0 0 8px 0;">${templateData.footerText}</p>
          <p style="color: ${adjustColorBrightness(templateData.footerTextColor, 20)}; font-size: 12px; margin: 0;">${templateData.copyrightText}</p>
        </div>
      </div>
    `
      };

      // Return the template HTML or default if not found
      return templates[templateName] || templates['Default'];
    }

    // Helper function to get template color based on template name
    const getTemplateColor = (templateName: string) => {
      const colorMap: { [key: string]: string } = {
        // Welcome & Onboarding
        'Welcome Email': '#667eea',
        'Getting Started Guide': '#4f46e5',
        'Account Activation': '#8b5cf6',
        'First Steps Tutorial': '#7c3aed',
        'Community Introduction': '#06b6d4',

        // Newsletter
        'Weekly Newsletter': '#3b82f6',
        'Monthly Roundup': '#6366f1',
        'Industry News': '#0ea5e9',
        'Product Updates': '#f59e0b',
        'Community Spotlight': '#ec4899',

        // Promotional
        'Flash Sale': '#ef4444',
        'Black Friday Deal': '#000000',
        'Early Bird Discount': '#f59e0b',
        'Bundle Offer': '#10b981',
        'Loyalty Reward': '#f59e0b',

        // Event
        'Event Invitation': '#8b5cf6',
        'Webinar Reminder': '#3b82f6',
        'Workshop Announcement': '#f97316',
        'Conference Invite': '#06b6d4',
        'Event Follow-up': '#10b981',

        // Engagement
        'Survey Request': '#6366f1',
        'User Generated Content': '#ec4899',
        'Community Challenge': '#f59e0b',
        'Success Story Request': '#10b981',
        'Feedback Collection': '#8b5cf6',

        // Educational
        'Tutorial Series': '#3b82f6',
        'Tips & Tricks': '#f59e0b',
        'Case Study': '#6366f1',
        'How-to Guide': '#06b6d4',
        'Best Practices': '#10b981',

        // Transactional
        'Order Confirmation': '#10b981',
        'Shipping Notification': '#3b82f6',
        'Payment Receipt': '#8b5cf6',
        'Subscription Renewal': '#f97316',
        'Password Reset': '#6b7280',

        // Retention
        'Win-back Campaign': '#ec4899',
        'Milestone Celebration': '#8b5cf6',
        'Exclusive Access': '#f59e0b',
        'Anniversary Email': '#ec4899',

        // Seasonal
        'Holiday Greetings': '#dc2626',
        'New Year Message': '#f59e0b',
        'Summer Campaign': '#f97316',
        'Back to School': '#3b82f6',
        'Valentine\'s Special': '#ec4899',

        // Business
        'Partnership Announcement': '#06b6d4',
        'Company Update': '#6366f1',
        'Team Introduction': '#8b5cf6',
        'Investor Update': '#10b981',
        'Press Release': '#6b7280',

        // Support
        'Help & Support': '#3b82f6',
        'FAQ Update': '#6366f1',
        'Maintenance Notice': '#f59e0b',
        'Service Outage': '#ef4444',
        'Feature Request': '#10b981',

        'Default': '#667eea'
      };

      return colorMap[templateName] || '#667eea';
    };



    // Extract ALL editable content with CSS properties from HTML
    const extractEditableContent = (html: string) => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const content: any[] = []

      // Helper to extract CSS properties from inline styles
      const extractStyles = (el: Element) => {
        const styleAttr = el.getAttribute('style') || ''
        const styles: any = {}

        styleAttr.split(';').forEach(rule => {
          const [prop, value] = rule.split(':').map(s => s?.trim())
          if (prop && value) {
            styles[prop] = value
          }
        })

        return {
          color: styles.color || '',
          backgroundColor: styles.background || styles['background-color'] || '',
          fontSize: styles['font-size'] || '',
          fontWeight: styles['font-weight'] || '',
          textAlign: styles['text-align'] || '',
          padding: styles.padding || '',
          margin: styles.margin || '',
          borderRadius: styles['border-radius'] || '',
          border: styles.border || '',
          allStyles: styles
        }
      }

      // Extract ALL text-containing elements
      const allElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, div')

      allElements.forEach((el, index) => {
        const text = el.textContent?.trim() || ''
        if (text.length === 0) return

        // Skip if this element's text is fully contained in a child we'll process
        let hasTextChild = false
        el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a').forEach(child => {
          if (child.textContent?.trim()) hasTextChild = true
        })
        if (hasTextChild && el.tagName.toLowerCase() === 'div') return

        const styles = extractStyles(el)
        const tagName = el.tagName.toLowerCase()

        let type = 'text'
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) type = 'heading'
        else if (tagName === 'p') type = 'paragraph'
        else if (tagName === 'a') type = 'link'
        else if (tagName === 'span') type = 'span'

        content.push({
          type,
          tag: tagName,
          text,
          href: el.getAttribute('href') || '',
          id: `${tagName}-${index}`,
          styles,
          index
        })
      })

      return { content, doc }
    }

    // Update HTML with edited content and styles
    const updateHtmlWithEdits = (edits: any[]) => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(previewHtml, 'text/html')

      edits.forEach(edit => {
        const elements = doc.querySelectorAll(edit.tag)
        if (elements[edit.index]) {
          const el = elements[edit.index]

          // Update text content
          el.textContent = edit.text

          // Update href for links
          if (edit.type === 'link' && edit.href) {
            el.setAttribute('href', edit.href)
          }

          // Update styles
          const styleObj = edit.styles.allStyles || {}
          if (edit.styles.color) styleObj.color = edit.styles.color
          if (edit.styles.backgroundColor) styleObj['background-color'] = edit.styles.backgroundColor
          if (edit.styles.fontSize) styleObj['font-size'] = edit.styles.fontSize
          if (edit.styles.fontWeight) styleObj['font-weight'] = edit.styles.fontWeight
          if (edit.styles.textAlign) styleObj['text-align'] = edit.styles.textAlign
          if (edit.styles.padding) styleObj.padding = edit.styles.padding
          if (edit.styles.margin) styleObj.margin = edit.styles.margin
          if (edit.styles.borderRadius) styleObj['border-radius'] = edit.styles.borderRadius
          if (edit.styles.border) styleObj.border = edit.styles.border

          // Rebuild style attribute
          const styleString = Object.entries(styleObj)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ')

          if (styleString) {
            el.setAttribute('style', styleString)
          }
        }
      })

      return doc.documentElement.outerHTML
    }

    const updatePreview = (data = editorData) => {
      if (!selectedTemplate) return

      const templateName = selectedTemplate.name
      console.log('🎨 Updating preview for template:', templateName)

      // Generate HTML using the template data
      const html = getTemplateHTML(templateName, data)
      setPreviewHtml(html)

      // Extract editable content for visual editor
      const { content } = extractEditableContent(html)
      setExtractedContent(content)
    }

    // Helper function to adjust color brightness
    const adjustColorBrightness = (hex: string, percent: number) => {
      const num = parseInt(hex.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = (num >> 16) + amt
      const G = (num >> 8 & 0x00FF) + amt
      const B = (num & 0x0000FF) + amt
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
    }

    // Helper function to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    const handleInputChange = (field: string, value: string) => {
      const newData = { ...editorData, [field]: value }
      setEditorData(newData)
      updatePreview(newData)
    }

    const createCampaign = async () => {
      if (!editorData.subject) {
        showToastMessage('❌ Please fill in the subject line', 'error')
        return
      }

      if (!previewHtml || previewHtml.trim() === '') {
        showToastMessage('❌ Please create your email content in the preview', 'error')
        return
      }

      setCreating(true)
      try {
        // Extract plain text from HTML for preview text
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = previewHtml
        const previewText = tempDiv.textContent?.substring(0, 100) + '...' || 'Email preview'

        const response = await fetch('/api/create-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editorData.campaignName || 'Untitled Campaign',
            subject: editorData.subject,
            preview_text: previewText,
            html_content: previewHtml,
            segment: 'all',
            userId
          }),
        })
        const result = await response.json()

        if (result.success) {
          showToastMessage('🎉 Campaign created successfully!', 'success')
          setCurrentPage('campaigns')
          loadDashboardData()
        } else {
          showToastMessage('❌ Error: ' + result.error, 'error')
        }
      } catch (error: any) {
        showToastMessage('❌ Error: ' + error.message, 'error')
      } finally {
        setCreating(false)
      }
    }

    if (!selectedTemplate) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No template selected</p>
          <button
            onClick={() => setCurrentPage('templates')}
            className="mt-4 text-primary hover:text-primary"
          >
            ← Back to Templates
          </button>
        </div>
      )
    }

   return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedTemplate(null)
                setCurrentPage('templates')
              }}
              className="text-muted-foreground hover:text-card-foreground transition-colors"
            >
              ← Back to Templates
            </button>
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground">Template Editor</h2>
              <p className="text-muted-foreground mt-1">Customize your {selectedTemplate?.name} template in real-time</p>
            </div>
          </div>
        </div>

        {/* Editor Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-card-foreground mb-6">Live Editor</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={editorData.campaignName}
                  onChange={(e) => handleInputChange('campaignName', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Campaign Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject Line *</label>
                <input
                  type="text"
                  value={editorData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Headline</label>
                <input
                  type="text"
                  value={editorData.headline}
                  onChange={(e) => handleInputChange('headline', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Main headline for your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Body Text</label>
                <textarea
                  value={editorData.bodyText}
                  onChange={(e) => handleInputChange('bodyText', e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your email content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Button Text</label>
                  <input
                    type="text"
                    value={editorData.buttonText}
                    onChange={(e) => handleInputChange('buttonText', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Learn More"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Button Link</label>
                  <input
                    type="url"
                    value={editorData.buttonLink}
                    onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Color Customization */}
              <div className="border-t border-gray-700/50 pt-6">
                <h4 className="text-lg font-semibold text-card-foreground mb-4">Colors & Styling</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Header Background</label>
                    <input
                      type="color"
                      value={editorData.headerBackgroundColor}
                      onChange={(e) => handleInputChange('headerBackgroundColor', e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Button Color</label>
                    <input
                      type="color"
                      value={editorData.buttonBackgroundColor}
                      onChange={(e) => handleInputChange('buttonBackgroundColor', e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-card-foreground">Live Preview</h3>
              <p className="text-muted-foreground text-sm">Changes update in real-time</p>
            </div>

            <div
              className="p-6 bg-gray-100 max-h-[600px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>

        {/* Create Campaign Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Ready to send?</h3>
              <p className="text-muted-foreground">Your edited email is ready. Create your campaign now!</p>
            </div>
            <button
              onClick={createCampaign}
              disabled={creating || !editorData.subject || !previewHtml}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-card-foreground font-bold rounded-xl transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="w-5 h-5 mr-2" />
                  Create Campaign 🚀
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  
  }

  const AnalyticsPage = () => {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loadingAnalytics, setLoadingAnalytics] = useState(false)

    const loadAnalytics = async () => {
      setLoadingAnalytics(true)
      try {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })
        const result = await response.json()

        if (result.success) {
          setAnalytics(result.analytics)
        } else {
          console.error('Failed to load analytics:', result.error)
        }
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoadingAnalytics(false)
      }
    }

    useEffect(() => {
      if (currentPage === 'analytics') {
        loadAnalytics()
      }
    }, [currentPage])

    if (loadingAnalytics) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Analytics</h2>
          <p className="text-muted-foreground mt-1">Track your email performance and engagement</p>
        </div>

        {analytics && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Sent Campaigns" value={analytics.overview.sent_campaigns} icon={EnvelopeIcon} color="blue" />
              <StatCard title="Total Emails Sent" value={analytics.overview.total_emails_sent.toLocaleString()} icon={PaperAirplaneIcon} color="green" />
            </div>

            {/* Campaign Performance */}
            {analytics.campaigns.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700/50">
                  <h3 className="text-xl font-semibold text-card-foreground">Campaign Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Campaign</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipients</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {analytics.campaigns.map((campaign: any) => (
                        <tr key={campaign.id} className="hover:bg-gray-800/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-card-foreground">{campaign.name}</div>
                              <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                            {campaign.total_recipients || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : 'Not sent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


          </>
        )}

        {!analytics && !loadingAnalytics && (
          <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                <ChartBarIcon className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">No analytics data yet</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Send some campaigns to start tracking your email performance</p>
              <button
                onClick={() => setCurrentPage('campaigns')}
                className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-card-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Campaign
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const DomainsPage = () => {
    // Domain Management States
    const [domainSettings, setDomainSettings] = useState<any>(null)
    const [domainLoading, setDomainLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [replyToEmail, setReplyToEmail] = useState('')
    

    // Load domain settings
    useEffect(() => {
      const loadDomainSettings = async () => {
        try {
          const response = await fetch('/api/get-domain-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ whopUserId: userId }),
          })
          const result = await response.json()

          if (result.success) {
            setDomainSettings(result.data)
            setDisplayName(result.data.displayName || '')
            setUsername(result.data.username || '')
            setReplyToEmail(result.data.replyToEmail || '')
          }
        } catch (error) {
          console.error('Error loading domain settings:', error)
        }
      }

      loadDomainSettings()
    }, [userId])


    const handleUpdateDomainSettings = async () => {
      if (!displayName || displayName.length < 2) {
        showToastMessage('❌ Please enter a display name (at least 2 characters)', 'error')
        return
      }

      if (!username || username.length < 2) {
        showToastMessage('❌ Please enter a username (at least 2 characters)', 'error')
        return
      }

      if (!replyToEmail || !replyToEmail.includes('@')) {
        showToastMessage('❌ Please enter a valid reply-to email address', 'error')
        return
      }

      setDomainLoading(true)
      try {
        const response = await fetch('/api/update-domain-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            whopUserId: userId,
            displayName: displayName,
            username: username,
            replyToEmail: replyToEmail
          }),
        })
        const result = await response.json()

        if (result.success) {
          setDomainSettings(result.data)
          // Update local state with the saved values
          setDisplayName(result.data.displayName || displayName)
          setUsername(result.data.username || username)
          setReplyToEmail(result.data.replyToEmail || replyToEmail)
          showToastMessage(`✅ Domain settings updated successfully! Your email is now ${result.data.username || username}.${result.data.uniqueCode}@flowmail.rovelin.com`, 'success')
        } else {
          showToastMessage(`❌ ${result.error}`, 'error')
        }
      } catch (error: any) {
        showToastMessage('❌ Error: ' + error.message, 'error')
      } finally {
        setDomainLoading(false)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Domain Management</h2>
          <p className="text-muted-foreground mt-1">Configure your email sending domains</p>
        </div>

        {domainSettings ? (
          <div className="space-y-6">
            {/* Platform Domain Section */}
            <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                  <EnvelopeIcon className="w-6 h-6 text-card-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">Platform Domain</h3>
                  <p className="text-muted-foreground text-sm">Use our domain with your unique username</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-800 border border-border rounded-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Brand Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 bg-gray-800 border border-border rounded-l-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="yourname"
                    />
                    <div className="bg-background border border-border border-l-0 rounded-r-lg px-4 py-3 text-gray-300">
                      .{domainSettings?.uniqueCode || 'loading'}@flowmail.rovelin.com
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reply-To Email *
                  </label>
                  <input
                    type="email"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                    className="w-full bg-gray-800 border border-border rounded-lg px-4 py-3 text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-email@gmail.com"
                  />
              </div>

            </div>

              <div className="mt-6 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                </div>
                  <h4 className="text-green-400 font-bold text-lg">✅ Your Current Email Domain</h4>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-border/30">
                    <div className="text-sm text-gray-300 mb-2">📧 Your Email Address:</div>
                    <div className="text-lg font-mono text-green-300 break-all">
                      {displayName || '[Your Name]'} &lt;{username || 'username'}.{domainSettings?.uniqueCode || 'loading'}@flowmail.rovelin.com&gt;
              </div>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-border/30">
                    <div className="text-sm text-gray-300 mb-2">🔗 Domain Details:</div>
                    <div className="text-sm text-gray-300">
                      <div>• <strong>Domain:</strong> flowmail.rovelin.com</div>
                      <div>• <strong>Unique Code:</strong> {domainSettings?.uniqueCode || 'loading'}</div>
                      <div>• <strong>Username:</strong> {username || 'username'}</div>
                      <div>• <strong>Display Name:</strong> {displayName || '[Your Name]'}</div>
                      <div>• <strong>Status:</strong> <span className="text-green-400">✅ Active</span></div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-gray-800/30 p-3 rounded-lg">
                    💡 <strong>Unique Code System:</strong> Each user gets a unique code ({domainSettings?.uniqueCode || 'loading'}) to prevent email conflicts when multiple users use the platform. This ensures your emails are always delivered correctly!
                </div>
                    </div>
                  </div>
                </div>

            {/* Custom Domain Feature */}
            <div className="mt-6 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                  <EnvelopeIcon className="w-5 h-5 text-purple-400" />
                  </div>
                <h4 className="text-purple-400 font-bold text-lg">🚀 Custom Domain Feature</h4>
                </div>
              <div className="text-sm text-gray-300">
                <p className="mb-2">Custom domain feature will be available when we reach <strong className="text-purple-400">15 paying users</strong>!</p>
                <p className="text-muted-foreground">This will allow you to send emails from your own domain (e.g., hello@yourbrand.com) for enhanced brand recognition and trust.</p>
              </div>
            </div>

            {/* Update Button */}
            <button
              onClick={handleUpdateDomainSettings}
              disabled={domainLoading || !displayName || !username || !replyToEmail}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-card-foreground font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
            >
              {domainLoading ? (
                <>
                  <ClockIcon className="w-5 h-5 mr-2 animate-spin inline" />
                  Updating Settings...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2 inline" />
                  Save Domain Settings
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-background rounded-xl flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
            <p className="text-muted-foreground">Loading domain settings...</p>
          </div>
        )}
      </div>
    )
  }



  // Professional Copy Button Component
  const CopyButton = ({ text, label }: { text: string; label?: string }) => {
    const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()

      navigator.clipboard.writeText(text).then(() => {
        setCopiedItem(text)
        showToastMessage(`Copied: ${label || 'Value'}`, 'success')
      }).catch((error) => {
        console.error('Failed to copy:', error)
        showToastMessage('Failed to copy to clipboard', 'error')
      })

      return false
    }

    const isCopied = copiedItem === text

    return (
      <button
        type="button"
        onClick={handleCopy}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          return false
        }}
        onMouseUp={(e) => {
          e.preventDefault()
          e.stopPropagation()
          return false
        }}
        className={`inline-flex items-center p-1.5 rounded-lg transition-all duration-200 ${isCopied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30 scale-110'
          : 'text-muted-foreground hover:text-card-foreground hover:bg-background/50 hover:scale-105'
          }`}
        title={label || 'Copy to clipboard'}
        style={{ cursor: 'pointer' }}
      >
        {isCopied ? (
          <CheckCircleIcon className="w-4 h-4" />
        ) : (
          <ClipboardIcon className="w-4 h-4" />
        )}
      </button>
    )
  }

  // Toast Notification Component
  const Toast = () => {
    if (!showToast) return null

    const toastStyles = {
      success: {
        bg: 'bg-green-500',
        border: 'border-green-500/30',
        shadow: 'shadow-green-500/25',
        icon: CheckCircleIcon,
        textColor: 'text-white'
      },
      error: {
        bg: 'bg-destructive',
        border: 'border-destructive/30',
        shadow: 'shadow-destructive/25',
        icon: XCircleIcon,
        textColor: 'text-destructive-foreground'
      },
      info: {
        bg: 'bg-primary',
        border: 'border-primary/30',
        shadow: 'shadow-primary/25',
        icon: InformationCircleIcon,
        textColor: 'text-primary-foreground'
      }
    }

    const style = toastStyles[toastType]
    const IconComponent = style.icon

    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
        <div className={`${style.bg} ${style.textColor} px-6 py-4 rounded-xl shadow-2xl ${style.border} ${style.shadow} flex items-center max-w-md backdrop-blur-sm border-2`}>
          <IconComponent className="w-6 h-6 mr-3 flex-shrink-0" />
          <span className="text-base font-semibold leading-relaxed">{toastMessage}</span>
        </div>
      </div>
    )
  }

  // Test Email Dialog Component
  const TestEmailDialog = () => {
    if (!testEmailDialog.open) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-primary/30 rounded-2xl p-6 max-w-md w-full bg-primary/5 shadow-2xl">
          <div className="flex items-center mb-4">
            <PaperAirplaneIcon className="w-6 h-6 mr-3 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Send Test Email</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Enter the email address where you want to receive the test email for campaign: <strong className="text-primary">{testEmailDialog.campaignName}</strong>
          </p>
          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Test Email Address
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setTestEmailDialog({ open: false, campaignId: '', campaignName: '' })
                setTestEmail('')
              }}
              className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={performTestEmailSend}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center"
            >
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Send Test
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Modal Component  
  const ConfirmModal = () => {
    if (!showConfirmModal || !confirmModalData) return null

    const modalStyles = {
      danger: {
        bg: 'bg-destructive/10',
        border: 'border-destructive/30',
        buttonBg: 'bg-destructive hover:bg-destructive/90',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-destructive'
      },
      warning: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-yellow-500'
      },
      info: {
        bg: 'bg-primary/10',
        border: 'border-primary/30',
        buttonBg: 'bg-primary hover:bg-primary/90',
        icon: InformationCircleIcon,
        iconColor: 'text-primary'
      }
    }

    const style = modalStyles[confirmModalData.type]
    const IconComponent = style.icon

    const handleConfirm = () => {
      confirmModalData.onConfirm()
      setShowConfirmModal(false)
      setConfirmModalData(null)
    }

    const handleCancel = () => {
      setShowConfirmModal(false)
      setConfirmModalData(null)
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`bg-card border ${style.border} rounded-2xl p-6 max-w-md w-full ${style.bg} shadow-2xl`}>
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${style.bg}`}>
              <IconComponent className={`w-6 h-6 ${style.iconColor}`} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-card-foreground">{confirmModalData.title}</h3>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {confirmModalData.message}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-3 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 ${style.buttonBg} text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm`}
            >
              {confirmModalData.confirmText}
            </button>
          </div>
        </div>
      </div>
    )
  }




  const SettingsPage = () => {
    const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const handleUpgrade = async (planType: 'starter' | 'growth' | 'pro') => {
      const planDetails = {
        starter: { name: 'Starter Plan', price: '$29/month', emails: '3,000 emails/month' },
        growth: { name: 'Growth Plan', price: '$49/month', emails: '5,000 emails/month' },
        pro: { name: 'Pro Plan', price: '$129/month', emails: '10,000 emails/month' }
      }

      const plan = planDetails[planType]

      // Go directly to checkout without confirmation dialog
      performSettingsUpgrade(plan, planType)
    }

    const performSettingsUpgrade = async (plan: any, planType: 'starter' | 'growth' | 'pro') => {

      setUpgradingPlan(planType)

      try {
        const response = await fetch('/api/charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            experienceId,
            planType
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create charge')
        }

        const checkoutSession = await response.json()
        const result = await iframeSdk.inAppPurchase(checkoutSession)

        if (result.status === 'ok') {
          showToastMessage(`🎉 Subscription Activated! Welcome to ${plan.name}! Receipt ID: ${result.data.receiptId}. Your subscription is now active and will renew monthly.`, 'success')
          loadDashboardData()
        } else {
          showToastMessage(`❌ Subscription ${result.status} - ${result.error || 'Please try again or contact support.'}`, 'error')
        }

      } catch (error: any) {
        console.error('Upgrade error:', error)
        showToastMessage(`❌ Subscription Error - ${error.message}. Please try again or contact support.`, 'error')
      } finally {
        setUpgradingPlan(null)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Settings</h2>
          <p className="text-muted-foreground mt-1">Manage your account, billing, and preferences</p>
          
        </div>


        {/* Billing Section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
              userPlan?.plan === 'free' ? 'bg-muted' :
              userPlan?.plan === 'starter' ? 'bg-primary' :
              userPlan?.plan === 'growth' ? 'bg-secondary' :
              userPlan?.plan === 'pro' ? 'bg-accent' :
              'bg-muted'
            }`}>
              <SparklesIcon className="w-6 h-6 text-card-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-card-foreground">
                {userPlan?.plan === 'free' ? 'Free Plan' : 
                 userPlan?.plan === 'starter' ? 'Starter Plan' :
                 userPlan?.plan === 'growth' ? 'Growth Plan' : 
                 userPlan?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {userPlan?.plan === 'free' ? '$0/month • 10 emails per day' : 
                 userPlan?.plan === 'starter' ? '$29/month • 3,000 emails per month' :
                 userPlan?.plan === 'growth' ? '$49/month • 5,000 emails per month' : 
                 userPlan?.plan === 'pro' ? '$129/month • 10,000 emails per month' : '$0/month • 10 emails per day'}
              </p>
            </div>
          </div>

          {/* Usage display for free plan */}
          {userPlan?.plan === 'free' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-card-foreground">Daily Email Usage</span>
                <span className="text-sm text-muted-foreground">{userPlan?.emails_sent_today || 0} / 10 emails</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    (userPlan?.emails_sent_today || 0) > 8 ? 'bg-red-500' : 
                    (userPlan?.emails_sent_today || 0) > 6 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(((userPlan?.emails_sent_today || 0) / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{10 - (userPlan?.emails_sent_today || 0)} emails remaining today</p>
            </div>
          )}

          {/* Usage display for paid plans */}
          {(userPlan?.plan === 'starter' || userPlan?.plan === 'growth' || userPlan?.plan === 'pro') && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-card-foreground">Monthly Email Usage</span>
                <span className="text-sm text-muted-foreground">
                  {userPlan?.emails_sent_this_month || 0} / {userPlan?.plan === 'starter' ? '3,000' : userPlan?.plan === 'growth' ? '5,000' : '10,000'} emails
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all bg-gradient-to-r from-green-500 to-blue-500"
                  style={{ 
                    width: `${Math.min(((userPlan?.emails_sent_this_month || 0) / (userPlan?.plan === 'starter' ? 3000 : userPlan?.plan === 'growth' ? 5000 : 10000)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(userPlan?.plan === 'starter' ? 3000 : userPlan?.plan === 'growth' ? 5000 : 10000) - (userPlan?.emails_sent_this_month || 0)} emails remaining this month
              </p>
            </div>
          )}

          <div className="border-t border-border pt-8">
            <h4 className="text-xl font-bold text-card-foreground mb-6 text-center">Upgrade Your Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <div className="bg-card border border-border rounded-2xl p-6 hover:bg-accent/50 hover:border-primary/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <RocketLaunchIcon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/30">
                      STARTER
                    </div>
                  </div>
                  <h5 className="text-xl font-bold text-card-foreground mb-2">Starter Plan</h5>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-card-foreground">$29</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>3,000 emails per month</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>analytics</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Future updates</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>All templates</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgrade('starter')}
                    disabled={upgradingPlan === 'starter'}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgradingPlan === 'starter' ? (
                      <>
                        <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Upgrade to Starter
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Growth Plan */}
              <div className="bg-card border border-border rounded-2xl p-6 hover:bg-accent/50 hover:border-secondary/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                      <RocketLaunchIcon className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <div className="bg-secondary/20 text-secondary text-xs font-semibold px-3 py-1 rounded-full border border-secondary/30">
                      POPULAR
                    </div>
                  </div>
                  <h5 className="text-xl font-bold text-card-foreground mb-2">Growth Plan</h5>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-card-foreground">$49</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>5,000 emails per month</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span> analytics</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Future updates</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>All templates</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgrade('growth')}
                    disabled={upgradingPlan === 'growth'}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgradingPlan === 'growth' ? (
                      <>
                        <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Upgrade to Growth
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="bg-card border border-border rounded-2xl p-6 hover:bg-accent/50 hover:border-accent/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                      <FireIcon className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div className="bg-accent/20 text-accent text-xs font-semibold px-3 py-1 rounded-full border border-accent/30">
                      PREMIUM
                    </div>
                  </div>
                  <h5 className="text-xl font-bold text-card-foreground mb-2">Pro Plan</h5>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-card-foreground">$129</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>10,000 emails per month</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>analytics</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Priority support</span>
                    </div>
                     <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Future updates</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>All Templates</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={upgradingPlan === 'pro'}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgradingPlan === 'pro' ? (
                      <>
                        <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FireIcon className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10">
        <Navbar />
        <div className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
          isMobile ? "pb-20" : "pb-4 sm:pb-8"
        )}>
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'campaigns' && <CampaignsPage />}
          {currentPage === 'subscribers' && <SubscribersPage />}
          {currentPage === 'analytics' && <AnalyticsPage />}
          {currentPage === 'create-campaign' && <CreateCampaignPage />}
          {currentPage === 'edit-campaign' && <EditCampaignPage />}
          {currentPage === 'templates' && <TemplatesPage />}
          {currentPage === 'template-editor' && <TemplateEditorPage />}
          {currentPage === 'domains' && <DomainsPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </div>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSubmit={handleAddMember}
        isLoading={loading}
      />

      {/* Progress Modal */}
      {campaignProgress && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-card-foreground">
                {campaignProgress.status === 'completed' ? 'Campaign Complete!' : 'Sending Campaign'}
              </h3>
              <button
                onClick={() => setCampaignProgress(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-lg"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                {campaignProgress.status === 'completed' ? (
                  <CheckCircleIcon className="w-8 h-8 text-primary-foreground" />
                ) : (
                  <PaperAirplaneIcon className="w-8 h-8 text-primary-foreground" />
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm text-card-foreground">
                    {campaignProgress.current || 0} / {campaignProgress.total || 0}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 border border-border">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300 shadow-sm"
                    style={{
                      width: `${campaignProgress.total > 0 ? (campaignProgress.current / campaignProgress.total) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {campaignProgress.status === 'completed' ? 'All emails sent successfully!' :
                    campaignProgress.status === 'failed' ? 'Campaign failed' : 'Sending emails...'}
                </p>
              </div>

              {campaignProgress.status === 'completed' && (
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sent:</span>
                    <span className="text-green-500">{campaignProgress.sent || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="text-red-500">{campaignProgress.failed || 0}</span>
                  </div>
                </div>
              )}

              {campaignProgress.status === 'completed' && (
                <button
                  onClick={() => setCampaignProgress(null)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <ProgressModal />
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSubmit={handleAddMember}
        isLoading={loading}
      />

      {/* Toast Notification */}
      <Toast />

      {/* Test Email Dialog */}
      <TestEmailDialog />

      {/* Confirmation Modal */}
      <ConfirmModal />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

    </div>
  )
}

export default FlowMailApp