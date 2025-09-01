import { Telegraf } from 'telegraf'
import { APIService, User } from './api.js'

export class NotificationService {
  private bot: Telegraf
  private apiService: APIService
  private isRunning = false

  constructor(bot: Telegraf, apiService: APIService) {
    this.bot = bot
    this.apiService = apiService
  }

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('Notification service started')

    // Check for notifications every 30 seconds
    setInterval(() => {
      this.checkPendingNotifications()
    }, 30000)
  }

  stop() {
    this.isRunning = false
    console.log('Notification service stopped')
  }

  private async checkPendingNotifications() {
    try {
      // This would be called from the backend when there are notifications to send
      // For now, we'll implement a webhook approach
    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }

  async sendNotification(telegramId: string, notification: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    metadata?: any
  }) {
    try {
      const emoji = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      }

      const text = `${emoji[notification.type]} *${notification.title}*\n\n${notification.message}`
      
      const buttons = []
      
      // Add action buttons based on notification type
      if (notification.metadata?.campaignId) {
        buttons.push([{ text: '📊 Посмотреть кампанию', callback_data: `campaign_view_${notification.metadata.campaignId}` }])
      }
      
      if (notification.metadata?.transactionId) {
        buttons.push([{ text: '💰 Посмотреть транзакцию', callback_data: `transaction_view_${notification.metadata.transactionId}` }])
      }

      buttons.push([{ text: '🔔 Все уведомления', callback_data: 'notifications' }])

      await this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons
        }
      })

      console.log(`Notification sent to ${telegramId}: ${notification.title}`)
    } catch (error) {
      console.error(`Failed to send notification to ${telegramId}:`, error)
    }
  }

  async sendWelcomeMessage(user: User) {
    try {
      const text = `
🎉 *Добро пожаловать в Unpacker Clone!*

Привет, ${user.firstName}! Ваша регистрация успешно завершена.

🎯 *Ваша роль:* ${user.role}
🎁 *Реферальный код:* \`${user.referralCode}\`

💡 *Что дальше?*
• Изучите возможности платформы
• Создайте первую кампанию
• Пригласите друзей и зарабатывайте 50%
• Начните зарабатывать уже сегодня!

🚀 Удачи в работе!
      `.trim()

      await this.bot.telegram.sendMessage(user.telegramId!, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👤 Мой профиль', callback_data: 'profile' },
              { text: '🎁 Рефералы', callback_data: 'referral' }
            ],
            [
              { text: '🌐 Открыть приложение', url: process.env.FRONTEND_URL || 'https://unpacker-clone.com' }
            ]
          ]
        }
      })
    } catch (error) {
      console.error('Failed to send welcome message:', error)
    }
  }

  async sendCampaignNotification(telegramId: string, campaign: any, action: string) {
    try {
      const actionMessages = {
        started: '🚀 Кампания запущена!',
        paused: '⏸️ Кампания приостановлена',
        completed: '🎯 Кампания завершена',
        budget_low: '⚠️ Бюджет кампании заканчивается'
      }

      const text = `
${actionMessages[action as keyof typeof actionMessages]}

📊 *${campaign.title}*
💰 Бюджет: ${campaign.budget} ₽
👆 Клики: ${campaign.currentClicks}${campaign.maxClicks ? `/${campaign.maxClicks}` : ''}

${action === 'completed' ? '🎉 Поздравляем! Кампания успешно завершена.' : ''}
${action === 'budget_low' ? '💡 Пополните бюджет для продолжения показов.' : ''}
      `.trim()

      await this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Посмотреть кампанию', callback_data: `campaign_view_${campaign.id}` }],
            [{ text: '📈 Все кампании', callback_data: 'campaigns' }]
          ]
        }
      })
    } catch (error) {
      console.error('Failed to send campaign notification:', error)
    }
  }

  async sendTransactionNotification(telegramId: string, transaction: any) {
    try {
      const typeEmojis = {
        DEPOSIT: '💳',
        WITHDRAWAL: '💸',
        REFERRAL: '🎁',
        COMMISSION: '💰',
        CAMPAIGN_PAYMENT: '📊'
      }

      const statusEmojis = {
        COMPLETED: '✅',
        PENDING: '⏳',
        FAILED: '❌',
        CANCELLED: '❌'
      }

      const text = `
${statusEmojis[transaction.status as keyof typeof statusEmojis]} *Транзакция ${transaction.status === 'COMPLETED' ? 'выполнена' : 'обновлена'}*

${typeEmojis[transaction.type as keyof typeof typeEmojis]} Тип: ${transaction.type}
💰 Сумма: ${transaction.amount > 0 ? '+' : ''}${transaction.amount} ₽
📝 ${transaction.description || 'Описание отсутствует'}

${transaction.status === 'COMPLETED' && transaction.amount > 0 ? '🎉 Средства зачислены на ваш баланс!' : ''}
${transaction.status === 'FAILED' ? '😔 К сожалению, транзакция не прошла.' : ''}
      `.trim()

      await this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Мой баланс', callback_data: 'balance' }],
            [{ text: '📊 История транзакций', url: `${process.env.FRONTEND_URL}/dashboard/transactions` }]
          ]
        }
      })
    } catch (error) {
      console.error('Failed to send transaction notification:', error)
    }
  }

  async sendReferralNotification(telegramId: string, referral: any, earnings: number) {
    try {
      const text = `
🎁 *Новый реферал!*

👥 ${referral.firstName}${referral.lastName ? ' ' + referral.lastName : ''} присоединился по вашей ссылке!

💰 *Ваш доход: +${earnings} ₽*

🎉 Поздравляем! Продолжайте приглашать друзей и зарабатывать 50% с их доходов.
      `.trim()

      await this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎁 Реферальная программа', callback_data: 'referral' }],
            [{ text: '💰 Мой баланс', callback_data: 'balance' }]
          ]
        }
      })
    } catch (error) {
      console.error('Failed to send referral notification:', error)
    }
  }
}
