import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { whopUserId, senderName, displayName } = await request.json();

    if (!whopUserId || !senderName || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Clean and validate sender name
    const cleanSenderName = senderName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (cleanSenderName.length < 2 || cleanSenderName.length > 20) {
      return NextResponse.json(
        { error: 'Sender name must be 2-20 characters, letters and numbers only' },
        { status: 400 }
      );
    }

    // Check if sender name is already taken by another user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('whop_user_id')
      .eq('custom_sender_name', cleanSenderName)
      .neq('whop_user_id', whopUserId)
      .single();

    let finalSenderName = cleanSenderName;
    let nameModified = false;

    // If name is taken, add numbers until we find a unique one
    if (existingUser) {
      let counter = 2;
      let testName = cleanSenderName + counter;
      
      while (true) {
        const { data: testUser } = await supabaseAdmin
          .from('users')
          .select('whop_user_id')
          .eq('custom_sender_name', testName)
          .neq('whop_user_id', whopUserId)
          .single();
          
        if (!testUser) {
          finalSenderName = testName;
          nameModified = true;
          break;
        }
        
        counter++;
        testName = cleanSenderName + counter;
        
        // Safety limit
        if (counter > 100) {
          return NextResponse.json(
            { error: 'Unable to find unique sender name' },
            { status: 400 }
          );
        }
      }
    }

    // Update user with professional sender info
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        custom_sender_name: finalSenderName,
        sender_display_name: displayName,
        sender_email_configured: true
      })
      .eq('whop_user_id', whopUserId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update sender information' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      senderName: finalSenderName,
      displayName: displayName,
      senderEmail: `${finalSenderName}@flowmail.rovelin.com`,
      nameModified: nameModified,
      message: nameModified 
        ? `Sender name was modified to "${finalSenderName}" to ensure uniqueness`
        : 'Professional sender updated successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}