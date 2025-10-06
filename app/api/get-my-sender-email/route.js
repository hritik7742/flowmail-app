import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's current sender configuration
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('custom_sender_name, sender_display_name, sender_email_configured')
      .eq('whop_user_id', userId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sender configuration' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build the professional sender email
    const senderEmail = user.custom_sender_name 
      ? `${user.custom_sender_name}@flowmail.rovelin.com`
      : `user_${userId.substring(5, 11)}@flowmail.rovelin.com`;

    const displayName = user.sender_display_name || 'FlowMail User';
    const fullSenderString = `${displayName} <${senderEmail}>`;

    return NextResponse.json({
      success: true,
      senderEmail: senderEmail,
      displayName: displayName,
      fullSenderString: fullSenderString,
      customSenderName: user.custom_sender_name,
      isConfigured: user.sender_email_configured || false
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}