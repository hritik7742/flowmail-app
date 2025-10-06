import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { templateName } = await request.json()

    if (!templateName) {
      return NextResponse.json(
        { success: false, error: 'Template name required' },
        { status: 400 }
      )
    }

    // Get template from database
    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      template: template
    })

  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}