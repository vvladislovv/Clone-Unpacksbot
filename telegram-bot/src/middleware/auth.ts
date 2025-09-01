import { Context, MiddlewareFn } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const authMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  try {
    const telegramId = ctx.from?.id.toString()
    
    if (!telegramId) {
      await ctx.reply('❌ Ошибка получения данных пользователя')
      return
    }

    // Check if user exists in our system
    const user = await apiService.getUserByTelegramId(telegramId)
    
    if (!user) {
      await ctx.reply(
        '🚫 Вы не зарегистрированы в системе.\n\n' +
        'Используйте команду /register для регистрации или /start для начала работы.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📝 Зарегистрироваться', callback_data: 'register' }],
              [{ text: '🏠 На главную', callback_data: 'start' }]
            ]
          }
        }
      )
      return
    }

    // Check if user is active
    if (!user.isActive) {
      await ctx.reply(
        '🚫 Ваш аккаунт заблокирован.\n\n' +
        'Обратитесь в техподдержку для решения вопроса.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💬 Техподдержка', url: 'https://t.me/support_unpacker_clone' }]
            ]
          }
        }
      )
      return
    }

    // Add user data to context
    ctx.state = ctx.state || {}
    ctx.state.user = user

    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    await ctx.reply('❌ Ошибка авторизации. Попробуйте позже.')
  }
}
