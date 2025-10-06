import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { whopUserId, displayName, username, replyToEmail, customDomain } = await request.json();

    if (!whopUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('unique_code, username, custom_domain')
      .eq('whop_user_id', whopUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate and clean username if provided
    let finalUsername = user.username; // Keep existing if not updating
    if (username) {
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (cleanUsername.length < 2 || cleanUsername.length > 20) {
        return NextResponse.json(
          { error: 'Username must be 2-20 characters, letters and numbers only' },
          { status: 400 }
        );
      }
      
      finalUsername = cleanUsername;
    }

    // Validate reply-to email if provided
    if (replyToEmail && !replyToEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid reply-to email address' },
        { status: 400 }
      );
    }

    // Validate custom domain if provided
    let domainVerified = user.domain_verified || false;
    if (customDomain && customDomain !== user.custom_domain) {
      // Reset verification status when domain changes
      domainVerified = false;
      
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(customDomain)) {
        return NextResponse.json(
          { error: 'Please enter a valid domain (e.g., yourcompany.com)' },
          { status: 400 }
        );
      }
    }

    // Update user settings
    const updateData = {};
    if (displayName) updateData.display_name = displayName;
    if (finalUsername) updateData.username = finalUsername;
    if (replyToEmail) updateData.reply_to_email = replyToEmail;
    if (customDomain !== undefined) {
      updateData.custom_domain = customDomain || null;
      updateData.domain_verified = domainVerified;
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('whop_user_id', whopUserId);

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update domain settings' },
        { status: 500 }
      );
    }

    // Generate the final email addresses
    const platformEmail = `${finalUsername}.${user.unique_code}@flowmail.rovelin.com`;
    const finalEmail = customDomain && domainVerified 
      ? `${finalUsername}@${customDomain}`
      : platformEmail;

    return NextResponse.json({
      success: true,
      message: 'Domain settings updated successfully',
      data: {
        displayName: displayName || user.display_name,
        username: finalUsername,
        uniqueCode: user.unique_code,
        platformEmail: platformEmail,
        finalEmail: finalEmail,
        replyToEmail: replyToEmail || user.reply_to_email,
        customDomain: customDomain || null,
        domainVerified: domainVerified
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}