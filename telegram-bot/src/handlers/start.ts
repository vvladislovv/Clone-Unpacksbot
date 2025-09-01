import { Context } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const startHandler = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id.toString()
    
    if (!telegramId) {
      await ctx.reply('❌ Ошибка получения данных пользователя')
      return
    }

    // Check if user exists
    const user = await apiService.getUserByTelegramId(telegramId)
    
    if (user) {
      // User already registered
      await ctx.reply(
        `👋 Добро пожаловать обратно, ${user.firstName}!\n\n` +
        '🎯 Ваш аккаунт активен. Используйте команды для работы с платформой.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '👤 Профиль', callback_data: 'profile' },
                { text: '💰 Баланс', callback_data: 'balance' },
              ],
              [
                { text: '📊 Кампании', callback_data: 'campaigns' },
                { text: '🔔 Уведомления', callback_data: 'notifications' },
              ],
              [
                { text: '🎁 Реферальная программа', callback_data: 'referral' },
              ],
              [
                { text: '📋 Помощь', callback_data: 'help' },
              ],
            ],
          },
        }
      )
    } else {
      // New user - show welcome message and registration
      await ctx.reply(
        '🎉 *Добро пожаловать в Unpacker Clone!*\n\n' +
        '🚀 Современная платформа для продавцов, блогеров и менеджеров\n\n' +
        '*Что вы можете делать:*\n' +
        '• 🛒 Управлять товарами Wildberries\n' +
        '• 📢 Создавать рекламные кампании\n' +
        '• 💬 Размещать рекламу каналов и групп\n' +
        '• 💰 Зарабатывать на реферальной программе (50%)\n' +
        '• 📊 Отслеживать статистику и доходы\n\n' +
        '*Выберите свою роль:*\n' +
        '🔹 *Селлер* - управление товарами и кампаниями\n' +
        '🔹 *Блогер* - размещение рекламы и партнерские программы\n' +
        '🔹 *Менеджер* - координация и техподдержка\n\n' +
        '👆 Нажмите кнопку ниже для регистрации',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📝 Зарегистрироваться', callback_data: 'register' }],
              [{ text: '📋 Узнать больше', callback_data: 'help' }],
            ],
          },
        }
      )
    }
  } catch (error) {
    console.error('Start handler error:', error)
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.')
  }
}
