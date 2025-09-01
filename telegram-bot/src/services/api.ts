import axios, { AxiosInstance } from 'axios'

export interface User {
  id: string
  telegramId?: string
  username?: string
  email?: string
  firstName: string
  lastName?: string
  avatar?: string
  role: 'SELLER' | 'BLOGGER' | 'MANAGER' | 'ADMIN'
  balance: number
  referralCode: string
  isVerified: boolean
  isActive?: boolean
}

export interface Campaign {
  id: string
  title: string
  type: string
  status: string
  budget: number
  currentClicks: number
  maxClicks?: number
  pricePerClick: number
}

export interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description?: string
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export class APIService {
  private api: AxiosInstance

  constructor() {
    const baseURL = process.env.API_URL || 'http://backend:3001'
    
    this.api = axios.create({
      baseURL: `${baseURL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  async registerUser(data: {
    telegramId: string
    firstName: string
    lastName?: string
    username?: string
    role: string
    referralCode?: string
  }): Promise<{ user: User; token: string }> {
    const response = await this.api.post('/auth/telegram', data)
    return response.data
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    try {
      // Check via auth endpoint first
      const response = await this.api.post('/auth/telegram', {
        telegramId,
        firstName: 'Check',
        skipRegistration: true
      })
      return response.data.user
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        return null
      }
      throw error
    }
  }

  // User methods
  async getUserProfile(telegramId: string): Promise<User> {
    const response = await this.api.get(`/users/profile/${telegramId}`)
    return response.data
  }

  async getUserBalance(telegramId: string): Promise<{
    balance: number
    transactions: Transaction[]
  }> {
    const response = await this.api.get(`/users/balance/${telegramId}`)
    return response.data
  }

  async getUserReferrals(telegramId: string): Promise<{
    referrals: any[]
    totalEarnings: number
    count: number
  }> {
    const response = await this.api.get(`/users/referrals/${telegramId}`)
    return response.data
  }

  // Campaign methods
  async getUserCampaigns(telegramId: string): Promise<{
    campaigns: Campaign[]
    stats: any
  }> {
    const response = await this.api.get(`/campaigns/user/${telegramId}`)
    return response.data
  }

  async startCampaign(campaignId: string, telegramId: string): Promise<void> {
    await this.api.post(`/campaigns/${campaignId}/start`, { telegramId })
  }

  async pauseCampaign(campaignId: string, telegramId: string): Promise<void> {
    await this.api.post(`/campaigns/${campaignId}/pause`, { telegramId })
  }

  // Notification methods
  async getUserNotifications(telegramId: string, unread = false): Promise<{
    notifications: Notification[]
    unreadCount: number
  }> {
    const response = await this.api.get(`/users/notifications/${telegramId}`, {
      params: { unread, limit: 10 }
    })
    return response.data
  }

  async markNotificationRead(notificationId: string, telegramId: string): Promise<void> {
    await this.api.put(`/users/notifications/${notificationId}/read`, { telegramId })
  }

  async markAllNotificationsRead(telegramId: string): Promise<void> {
    await this.api.put(`/users/notifications/read-all`, { telegramId })
  }

  // Transaction methods
  async createWithdrawal(telegramId: string, data: {
    amount: number
    method: string
    details: any
  }): Promise<Transaction> {
    const response = await this.api.post(`/transactions/withdrawal`, {
      ...data,
      telegramId
    })
    return response.data.transaction
  }

  // Webhook methods for notifications
  async sendNotificationToUser(telegramId: string, notification: {
    title: string
    message: string
    type: string
    metadata?: any
  }): Promise<void> {
    await this.api.post('/telegram/notify', {
      telegramId,
      ...notification
    })
  }

  // System methods
  async getSystemStats(): Promise<any> {
    const response = await this.api.get('/system/stats')
    return response.data
  }

  // Utility method to handle API errors
  private handleError(error: any, defaultMessage = 'Произошла ошибка'): string {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    
    if (error.response?.status === 400) {
      return 'Неверные данные запроса'
    }
    
    if (error.response?.status === 401) {
      return 'Необходимо авторизоваться'
    }
    
    if (error.response?.status === 403) {
      return 'Недостаточно прав доступа'
    }
    
    if (error.response?.status === 404) {
      return 'Ресурс не найден'
    }
    
    if (error.response?.status >= 500) {
      return 'Ошибка сервера. Попробуйте позже'
    }
    
    if (error.code === 'ECONNABORTED') {
      return 'Превышено время ожидания'
    }
    
    return defaultMessage
  }

  // Public method to get error message
  getErrorMessage(error: any, defaultMessage = 'Произошла ошибка'): string {
    return this.handleError(error, defaultMessage)
  }
}
