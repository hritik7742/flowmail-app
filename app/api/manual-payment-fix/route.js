// Manual payment fix endpoint for specific payment cases
export async function POST(request) {
  try {
    const { user_id, payment_id, amount, plan_type } = await request.json();
    
    console.log('=== MANUAL PAYMENT FIX ===');
    console.log('User ID:', user_id);
    console.log('Payment ID:', payment_id);
    console.log('Amount:', amount);
    console.log('Plan Type:', plan_type);
    
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    // First, check if user exists
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('whop_user_id', user_id)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      return new Response(JSON.stringify({
        error: 'Failed to check user',
        details: userError.message
      }), { status: 500 });
    }
    
    if (!existingUser) {
      // Create user if doesn't exist
      const { error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          whop_user_id: user_id,
          plan: plan_type || 'starter',
          subscription_status: 'active',
          subscription_id: payment_id,
          whop_subscription_id: payment_id,
          whop_plan_id: payment_id,
          plan_updated_at: new Date().toISOString(),
          subscription_updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        return new Response(JSON.stringify({
          error: 'Failed to create user',
          details: createError.message
        }), { status: 500 });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'User created and plan updated successfully',
        user_id: user_id,
        plan: plan_type || 'starter',
        action: 'created'
      }), { status: 200 });
    } else {
      // Update existing user
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          plan: plan_type || 'starter',
          subscription_status: 'active',
          subscription_id: payment_id,
          whop_subscription_id: payment_id,
          whop_plan_id: payment_id,
          plan_updated_at: new Date().toISOString(),
          subscription_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('whop_user_id', user_id);
      
      if (updateError) {
        return new Response(JSON.stringify({
          error: 'Failed to update user',
          details: updateError.message
        }), { status: 500 });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'User plan updated successfully',
        user_id: user_id,
        plan: plan_type || 'starter',
        action: 'updated'
      }), { status: 200 });
    }
    
  } catch (error) {
    console.error('Manual payment fix error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), { status: 500 });
  }
}
