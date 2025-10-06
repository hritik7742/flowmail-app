'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

export default function NewCampaignPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    preview_text: '',
    html_content: '',
    segment: 'all'
  })
  const [showEditor, setShowEditor] = useState(false)
  const [editableContent, setEditableContent] = useState('')

  // Load template if selected
  useEffect(() => {
    const selectedTemplate = localStorage.getItem('selectedTemplate')
    if (selectedTemplate) {
      const template = JSON.parse(selectedTemplate)
      setFormData(prev => ({
        ...prev,
        name: template.name + ' Campaign',
        html_content: template.html_content
      }))
      setEditableContent(template.html_content)
      localStorage.removeItem('selectedTemplate')
    }
  }, [])

  // Sync editableContent when formData.html_content changes
  useEffect(() => {
    if (!showEditor && formData.html_content !== editableContent) {
      setEditableContent(formData.html_content)
    }
  }, [formData.html_content, showEditor])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/')
      return
    }
  }, [session, status, router])

  const handleSubmit = async (e, action) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (action === 'send') {
        // Send campaign immediately
        const response = await fetch('/api/send-campaign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        const result = await response.json()
        if (result.success) {
          alert('Campaign sent successfully!')
          router.push('/campaigns')
        } else {
          alert('Error sending campaign: ' + result.error)
        }
      } else {
        // Save as draft
        alert('Draft saved! (Feature coming soon)')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    if (name === 'html_content') {
      setEditableContent(value)
    }
  }

  const handleEditContent = () => {
    setEditableContent(formData.html_content)
    setShowEditor(true)
  }

  const handleSaveEdit = () => {
    console.log('Saving edits...', { editableContent })
    setFormData(prev => {
      const updated = {
        ...prev,
        html_content: editableContent
      }
      console.log('Updated formData:', updated)
      return updated
    })
    alert('✅ Changes saved! Your edits are now applied to the campaign.')
  }

  const handleCancelEdit = () => {
    setEditableContent(formData.html_content)
    setShowEditor(false)
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

      <div className={`${showEditor ? 'max-w-7xl' : 'max-w-4xl'} mx-auto py-6 sm:px-6 lg:px-8 transition-all duration-300`}>
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
            <p className="text-gray-600">Design and send your email campaign</p>
          </div>

          <form className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Weekly Newsletter #13"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send to
                  </label>
                  <select
                    name="segment"
                    value={formData.segment}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Members</option>
                    <option value="active">Active Members Only</option>
                    <option value="vip">VIP Members Only</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., This week's exclusive updates"
                  required
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Text
                </label>
                <input
                  type="text"
                  name="preview_text"
                  value={formData.preview_text}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Text that appears in email preview"
                />
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Email Content</h2>
                <button
                  type="button"
                  onClick={handleEditContent}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Edit Content
                </button>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Available merge tags: {'{name}'}, {'{email}'}, {'{tier}'}
                </div>
              </div>

              {!showEditor ? (
                <>
                  <textarea
                    name="html_content"
                    value={formData.html_content}
                    onChange={handleChange}
                    rows={15}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Write your email content here... You can use HTML tags for formatting."
                    required
                  />

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Pro Tips:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Use {'{name}'} to personalize emails</li>
                      <li>• Keep subject lines under 50 characters</li>
                      <li>• Include a clear call-to-action</li>
                      <li>• Test your email before sending</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Editor Panel - Left Side */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        HTML Editor
                      </label>
                      <textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        rows={20}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        placeholder="Edit your HTML content here..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Save & Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEditor(false)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Close Editor
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Preview Panel - Right Side */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Live Preview
                      </label>
                      <div className="border border-gray-300 rounded-lg p-4 bg-white overflow-auto" style={{ minHeight: '500px', maxHeight: '600px' }}>
                        <div dangerouslySetInnerHTML={{ __html: editableContent }} />
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        👁️ Preview updates live as you type. Click "Save & Preview" to apply your edits to the campaign.
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Debug: {editableContent.length} characters | Saved: {formData.html_content.length} characters
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'send')}
                disabled={loading || !formData.name || !formData.subject || !formData.html_content}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}