import { Context } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const profileHandler = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id.toString()
    
    if (!telegramId) {
      await ctx.reply('❌ Ошибка получения данных пользователя')
      return
    }

    const user = await apiService.getUserProfile(telegramId)
    
    const roleNames = {
      SELLER: 'Селлер',
      BLOGGER: 'Блогер', 
      MANAGER: 'Менеджер',
      ADMIN: 'Администратор'
    }

    const profileText = `
👤 *Ваш профиль*

🆔 ID: \`${user.id}\`
👋 Имя: ${user.firstName}${user.lastName ? ' ' + user.lastName : ''}
${user.username ? `📝 Username: @${user.username}` : ''}
${user.email ? `📧 Email: ${user.email}` : ''}
🎯 Роль: ${roleNames[user.role]}
💰 Баланс: ${user.balance} ₽
${user.isVerified ? '✅' : '❌'} Верификация: ${user.isVerified ? 'Подтверждена' : 'Не подтверждена'}
🎁 Реферальный код: \`${user.referralCode}\`
    `.trim()

    await ctx.reply(profileText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Баланс', callback_data: 'balance' },
            { text: '📊 Кампании', callback_data: 'campaigns' }
          ],
          [
            { text: '🎁 Реферальная программа', callback_data: 'referral' }
          ]
        ]
      }
    })
  } catch (error) {
    console.error('Profile handler error:', error)
    await ctx.reply('❌ Ошибка при загрузке профиля. Попробуйте позже.')
  }
}
