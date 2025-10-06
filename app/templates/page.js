'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/')
      return
    }
  }, [session, status, router])

  const templates = [
    {
      id: 1,
      name: 'Welcome Email',
      category: 'welcome',
      description: 'Perfect for welcoming new community members',
      thumbnail: '🎉',
      html_content: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;padding:40px">
  <div style="background:#6366f1;padding:30px;text-align:center;border-radius:10px 10px 0 0">
    <h1 style="color:#fff;margin:0;font-size:28px">Welcome to Our Community! 🎉</h1>
  </div>
  <div style="padding:40px;background:#f9fafb">
    <p style="font-size:18px;color:#1f2937">Hey {{name}},</p>
    <p style="color:#4b5563;line-height:1.6">We're so excited to have you here! You now have access to:</p>
    <ul style="color:#4b5563;line-height:1.8">
      <li>✅ Exclusive content and resources</li>
      <li>✅ Private community chat</li>
      <li>✅ Weekly live sessions</li>
      <li>✅ 1-on-1 coaching opportunities</li>
    </ul>
    <div style="text-align:center;margin:30px 0">
      <a href="#" style="background:#6366f1;color:#fff;padding:15px 40px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold">Get Started Now</a>
    </div>
    <p style="color:#6b7280;font-size:14px;margin-top:30px">Questions? Just reply to this email!</p>
  </div>
</div>`
    },
    {
      id: 2,
      name: 'Weekly Newsletter',
      category: 'newsletter',
      description: 'Keep your community updated with weekly news',
      thumbnail: '📰',
      html_content: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
  <div style="padding:40px;background:#fff">
    <h2 style="color:#1f2937;margin:0 0 10px 0">This Week's Update 📰</h2>
    <p style="color:#6b7280;margin:0 0 30px 0">Hey {{name}},</p>
    
    <div style="background:#f3f4f6;padding:25px;border-radius:10px;margin:20px 0">
      <h3 style="color:#1f2937;margin:0 0 15px 0">🔥 Featured Content</h3>
      <p style="color:#4b5563;line-height:1.6">Your main article or announcement goes here. Make it compelling!</p>
      <a href="#" style="color:#6366f1;font-weight:bold;text-decoration:none">Read More →</a>
    </div>
    
    <div style="margin:30px 0">
      <h3 style="color:#1f2937">Quick Updates:</h3>
      <ul style="color:#4b5563;line-height:1.8">
        <li>📌 Update or tip #1</li>
        <li>📌 Update or tip #2</li>
        <li>📌 Update or tip #3</li>
      </ul>
    </div>
    
    <div style="background:#fef3c7;padding:20px;border-radius:10px;margin:30px 0">
      <p style="margin:0;color:#92400e"><strong>💡 Pro Tip:</strong> Share your best insight of the week here!</p>
    </div>
  </div>
</div>`
    },
    {
      id: 3,
      name: 'Promotion Email',
      category: 'promo',
      description: 'Drive sales with eye-catching promotional emails',
      thumbnail: '🔥',
      html_content: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:60px 40px;text-align:center;border-radius:15px">
  <h1 style="color:#fff;font-size:42px;margin:0 0 20px 0">🔥 Limited Time Offer!</h1>
  <p style="color:#fff;font-size:24px;margin:0 0 15px 0;opacity:0.95">Special Deal Just for You, {{name}}</p>
  <div style="background:rgba(255,255,255,0.1);padding:30px;border-radius:15px;margin:30px 0">
    <p style="color:#fff;font-size:56px;font-weight:bold;margin:0;line-height:1">50% OFF</p>
    <p style="color:#fff;font-size:20px;margin:10px 0 0 0;opacity:0.9">Your Next Purchase</p>
  </div>
  <a href="#" style="background:#fff;color:#667eea;padding:18px 50px;text-decoration:none;border-radius:50px;display:inline-block;font-weight:bold;font-size:18px;margin:20px 0">Claim Your Discount</a>
  <p style="color:#fff;margin:30px 0 0 0;font-size:16px;opacity:0.8">⏰ Offer expires in 48 hours</p>
</div>`
    }
  ]

  const useTemplate = (template) => {
    // Store template in localStorage and redirect to campaign creation
    localStorage.setItem('selectedTemplate', JSON.stringify(template))
    router.push('/campaigns/new')
  }

  if (status === 'loading') {
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
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600">Choose from our professionally designed templates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="text-4xl mb-4 text-center">{template.thumbnail}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  
                  <div className="mb-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      template.category === 'welcome' 
                        ? 'bg-green-100 text-green-800'
                        : template.category === 'newsletter'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {template.category}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => useTemplate(template)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Use This Template
                    </button>
                    <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Need a Custom Template?</h3>
              <p className="text-gray-600 mb-6">
                Our templates are fully customizable. You can modify the HTML, colors, and content to match your brand.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>💡 <strong>Pro Tip:</strong> Use merge tags like {'{name}'} and {'{tier}'} to personalize your emails</p>
                <p>🎨 <strong>Styling:</strong> All templates are mobile-responsive and tested across email clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}