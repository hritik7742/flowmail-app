import NextAuth from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'

const authOptions = {
  providers: [
    {
      id: 'whop',
      name: 'Whop',
      type: 'oauth2',
      clientId: process.env.WHOP_CLIENT_ID,
      clientSecret: process.env.WHOP_CLIENT_SECRET,
      authorization: {
        url: 'https://whop.com/oauth/authorize',
        params: {
          scope: 'user:read memberships:read',
          response_type: 'code',
        },
      },
      token: 'https://api.whop.com/api/v2/oauth/token',
      userinfo: 'https://api.whop.com/api/v2/me',
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name || profile.username,
          email: profile.email,
          image: profile.profile_pic_url,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.whopUserId = profile.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.whopUserId = token.whopUserId
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'whop' && profile) {
        try {
          // Save user to database
          const { error } = await supabaseAdmin
            .from('users')
            .upsert({
              whop_user_id: profile.id,
              email: profile.email,
              company_name: profile.company_name || profile.name || 'My Company',
              plan: 'free',
              emails_sent_this_month: 0,
            }, {
              onConflict: 'whop_user_id'
            })
          
          if (error) {
            console.error('Error saving user:', error)
          }
        } catch (error) {
          console.error('Database error:', error)
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }