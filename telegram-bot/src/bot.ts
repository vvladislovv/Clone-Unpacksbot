import 'dotenv/config'
import { Scenes, Telegraf, session } from 'telegraf'
import { message } from 'telegraf/filters'

import { balanceHandler } from './handlers/balance.js'
import { campaignsHandler } from './handlers/campaigns.js'
import { helpHandler } from './handlers/help.js'
import { notificationsHandler } from './handlers/notifications.js'
import { profileHandler } from './handlers/profile.js'
import { referralHandler } from './handlers/referral.js'
import { registerHandler } from './handlers/register.js'
import { startHandler } from './handlers/start.js'

import { authMiddleware } from './middleware/auth.js'
import { errorHandler } from './middleware/error.js'
import { rateLimitMiddleware } from './middleware/rateLimit.js'

import { registerScene } from './scenes/register.js'
import { withdrawalScene } from './scenes/withdrawal.js'

import { APIService } from './services/api.js'
import { NotificationService } from './services/notification.js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required')
  process.exit(1)
}

// Initialize bot
const bot = new Telegraf(BOT_TOKEN)

// Initialize services
const apiService = new APIService()
const notificationService = new NotificationService(bot, apiService)

// Create stage for scenes
const stage = new Scenes.Stage<Scenes.SceneContext>([
  registerScene,
  withdrawalScene,
])

// Middleware
bot.use(session())
bot.use(stage.middleware())
bot.use(rateLimitMiddleware)
bot.use(errorHandler)

// Commands
bot.start(startHandler)
bot.command('register', registerHandler)
bot.command('profile', authMiddleware, profileHandler)
bot.command('balance', authMiddleware, balanceHandler)
bot.command('campaigns', authMiddleware, campaignsHandler)
bot.command('notifications', authMiddleware, notificationsHandler)
bot.command('referral', authMiddleware, referralHandler)
bot.command('help', helpHandler)

// Inline keyboards
bot.action('register', async (ctx) => {
  await ctx.scene.enter('register')
})

bot.action('profile', authMiddleware, profileHandler)
bot.action('balance', authMiddleware, balanceHandler)
bot.action('campaigns', authMiddleware, campaignsHandler)
bot.action('notifications', authMiddleware, notificationsHandler)
bot.action('referral', authMiddleware, referralHandler)

bot.action(/^withdraw_(.+)$/, authMiddleware, async (ctx) => {
  const method = ctx.match[1]
  ctx.scene.state.withdrawalMethod = method
  await ctx.scene.enter('withdrawal')
})

bot.action(/^campaign_(\w+)_(.+)$/, authMiddleware, async (ctx) => {
  const action = ctx.match[1]
  const campaignId = ctx.match[2]
  
  try {
    if (action === 'pause') {
      await apiService.pauseCampaign(campaignId, ctx.from.id.toString())
      await ctx.editMessageText('Кампания приостановлена ✅')
    } else if (action === 'start') {
      await apiService.startCampaign(campaignId, ctx.from.id.toString())
      await ctx.editMessageText('Кампания запущена ✅')
    }
  } catch (error) {
    await ctx.editMessageText('Ошибка при выполнении действия ❌')
  }
})

bot.action(/^notification_read_(.+)$/, authMiddleware, async (ctx) => {
  const notificationId = ctx.match[1]
  
  try {
    await apiService.markNotificationRead(notificationId, ctx.from.id.toString())
    await ctx.editMessageText('Уведомление отмечено как прочитанное ✅')
  } catch (error) {
    await ctx.editMessageText('Ошибка при отметке уведомления ❌')
  }
})

// Handle messages in private chat
bot.on(message('text'), async (ctx) => {
  if (ctx.chat.type === 'private') {
    // Check if user is in a scene
    if (ctx.scene.current) {
      return // Let scene handle the message
    }
    
    // Default response for unrecognized commands
    await ctx.reply(
      'Используйте /help для просмотра доступных команд',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Помощь', callback_data: 'help' }],
            [{ text: '👤 Профиль', callback_data: 'profile' }],
          ],
        },
      }
    )
  }
})

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  if (ctx.callbackQuery.data === 'help') {
    await helpHandler(ctx)
  }
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`)
  
  try {
    await bot.stop(signal)
    console.log('Bot stopped successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start bot
const startBot = async () => {
  try {
    console.log('Starting Telegram bot...')
    
    // Set bot commands
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'register', description: 'Регистрация в системе' },
      { command: 'profile', description: 'Мой профиль' },
      { command: 'balance', description: 'Баланс и транзакции' },
      { command: 'campaigns', description: 'Мои кампании' },
      { command: 'notifications', description: 'Уведомления' },
      { command: 'referral', description: 'Реферальная программа' },
      { command: 'help', description: 'Помощь' },
    ])

    if (process.env.NODE_ENV === 'production') {
      // Use webhook in production
      const webhookUrl = process.env.WEBHOOK_URL
      if (!webhookUrl) {
        throw new Error('WEBHOOK_URL is required in production')
      }
      
      await bot.telegram.setWebhook(webhookUrl)
      console.log(`Bot webhook set to: ${webhookUrl}`)
    } else {
      // Use long polling in development
      await bot.launch()
      console.log('Bot started with long polling')
    }

    // Start notification service
    notificationService.start()
    
  } catch (error) {
    console.error('Failed to start bot:', error)
    process.exit(1)
  }
}

startBot()

export { bot }
