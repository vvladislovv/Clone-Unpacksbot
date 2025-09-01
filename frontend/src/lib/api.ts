import { useAuthStore } from '@/store/auth'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error

    if (response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout()
      toast.error('Сессия истекла. Пожалуйста, войдите снова.')
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    } else if (response?.status === 403) {
      toast.error('У вас нет прав для выполнения этого действия')
    } else if (response?.status === 404) {
      toast.error('Ресурс не найден')
    } else if (response?.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.')
    } else if (response?.data?.message) {
      toast.error(response.data.message)
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Превышено время ожидания')
    } else if (!navigator.onLine) {
      toast.error('Проверьте подключение к интернету')
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: { identifier: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (data: {
    firstName: string
    lastName?: string
    email?: string
    username?: string
    password: string
    role: string
    referralCode?: string
  }) => api.post('/auth/register', data),
  
  telegramAuth: (data: {
    telegramId: string
    firstName: string
    lastName?: string
    username?: string
    photoUrl?: string
  }) => api.post('/auth/telegram', data),
  
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// Users API
export const usersAPI = {
  updateProfile: (data: Partial<{
    firstName: string
    lastName: string
    email: string
    phone: string
    avatar: string
  }>) => api.put('/users/profile', data),
  
  getReferrals: () => api.get('/users/referrals'),
  getBalance: () => api.get('/users/balance'),
  
  getNotifications: (params?: {
    limit?: number
    offset?: number
    unread?: boolean
  }) => api.get('/users/notifications', { params }),
  
  markNotificationRead: (id: string) => 
    api.put(`/users/notifications/${id}/read`),
  
  markAllNotificationsRead: () => 
    api.put('/users/notifications/read-all'),
}

// Products API
export const productsAPI = {
  getProducts: (params?: {
    search?: string
    category?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    sellerId?: string
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: string
  }) => api.get('/products', { params }),
  
  getProduct: (id: string) => api.get(`/products/${id}`),
  
  createProduct: (data: {
    wbArticle: string
    title: string
    description?: string
    price: number
    images: string[]
    category: string
    brand?: string
  }) => api.post('/products', data),
  
  updateProduct: (id: string, data: Partial<{
    title: string
    description: string
    price: number
    images: string[]
    category: string
    brand: string
  }>) => api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  getMyProducts: (params?: { limit?: number; offset?: number; isActive?: boolean }) =>
    api.get('/products/my/products', { params }),
}

// Campaigns API
export const campaignsAPI = {
  getCampaigns: (params?: {
    type?: string
    status?: string
    advertiserId?: string
    limit?: number
    offset?: number
  }) => api.get('/campaigns', { params }),
  
  getCampaign: (id: string) => api.get(`/campaigns/${id}`),
  
  createCampaign: (data: {
    title: string
    description?: string
    type: 'product' | 'channel'
    budget: number
    pricePerClick: number
    maxClicks?: number
    startDate?: string
    endDate?: string
    productId?: string
    channelId?: string
  }) => api.post('/campaigns', data),
  
  updateCampaign: (id: string, data: Partial<{
    title: string
    description: string
    budget: number
    pricePerClick: number
    maxClicks: number
    startDate: string
    endDate: string
  }>) => api.put(`/campaigns/${id}`, data),
  
  startCampaign: (id: string) => api.post(`/campaigns/${id}/start`),
  pauseCampaign: (id: string) => api.post(`/campaigns/${id}/pause`),
  recordClick: (id: string) => api.post(`/campaigns/${id}/click`),
  getMyCampaigns: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/campaigns/my/campaigns', { params }),
}

// Chat API
export const chatAPI = {
  getChats: (params?: { limit?: number; offset?: number }) =>
    api.get('/chat/chats', { params }),
  
  createChat: (data: {
    name?: string
    isGroup?: boolean
    participantIds: string[]
  }) => api.post('/chat/chats', data),
  
  getMessages: (chatId: string, params?: { limit?: number; cursor?: string }) =>
    api.get(`/chat/chats/${chatId}/messages`, { params }),
  
  sendMessage: (chatId: string, data: {
    content: string
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
    metadata?: any
  }) => api.post(`/chat/chats/${chatId}/messages`, data),
  
  editMessage: (messageId: string, data: { content: string }) =>
    api.put(`/chat/messages/${messageId}`, data),
  
  deleteMessage: (messageId: string) => api.delete(`/chat/messages/${messageId}`),
  
  addParticipant: (chatId: string, data: { userId: string }) =>
    api.post(`/chat/chats/${chatId}/participants`, data),
  
  leaveChat: (chatId: string) => api.post(`/chat/chats/${chatId}/leave`),
}

// Transactions API
export const transactionsAPI = {
  getTransactions: (params?: {
    type?: string
    status?: string
    limit?: number
    offset?: number
    dateFrom?: string
    dateTo?: string
  }) => api.get('/transactions', { params }),
  
  requestWithdrawal: (data: {
    amount: number
    method: 'bank_card' | 'yoomoney' | 'qiwi'
    details: {
      cardNumber?: string
      accountId?: string
      phone?: string
    }
  }) => api.post('/transactions/withdrawal', data),
  
  getStats: (params?: { period?: '7d' | '30d' | '90d' | '1y' }) =>
    api.get('/transactions/stats', { params }),
  
  cancelTransaction: (id: string) => api.post(`/transactions/${id}/cancel`),
}

// Upload API
export const uploadAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  
  uploadFiles: (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return api.post('/upload/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  
  deleteFile: (filename: string) => api.delete(`/upload/file/${filename}`),
  getFileInfo: (filename: string) => api.get(`/upload/file/${filename}/info`),
}
