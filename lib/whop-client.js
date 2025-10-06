import axios from 'axios'

// Whop API client for making requests
export class WhopClient {
  constructor(accessToken) {
    this.accessToken = accessToken
    this.baseURL = 'https://api.whop.com/api/v2'
  }

  async getMe() {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  async getMemberships(companyId) {
    try {
      const response = await axios.get(`${this.baseURL}/memberships`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          company_id: companyId,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching memberships:', error)
      throw error
    }
  }
}