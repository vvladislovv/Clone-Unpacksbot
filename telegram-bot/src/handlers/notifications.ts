import { Context } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const notificationsHandler = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id.toString()
    
    if (!telegramId) {
      await ctx.reply('❌ Ошибка получения данных пользователя')
      return
    }

    const notificationsData = await apiService.getUserNotifications(telegramId, false)
    
    let notificationsText = `🔔 *Уведомления*\n\n`
    notificationsText += `📬 Непрочитанных: ${notificationsData.unreadCount}\n\n`

    if (notificationsData.notifications && notificationsData.notifications.length > 0) {
      notificationsText += `📋 *Последние уведомления:*\n\n`
      
      notificationsData.notifications.slice(0, 5).forEach((notification, index) => {
        const readEmoji = notification.isRead ? '✅' : '🔵'
        const typeEmoji = notification.type === 'success' ? '🎉' :
                         notification.type === 'warning' ? '⚠️' :
                         notification.type === 'error' ? '❌' : 'ℹ️'
        
        notificationsText += `${readEmoji} ${typeEmoji} *${notification.title}*\n`
        notificationsText += `   ${notification.message}\n`
        notificationsText += `   📅 ${new Date(notification.createdAt).toLocaleDateString()}\n\n`
      })

      const buttons = []
      
      // Add mark as read button for first unread notification
      const firstUnread = notificationsData.notifications.find(n => !n.isRead)
      if (firstUnread) {
        buttons.push([{ text: '✅ Отметить как прочитанное', callback_data: `notification_read_${firstUnread.id}` }])
      }

      if (notificationsData.unreadCount > 0) {
        buttons.push([{ text: '✅ Отметить все как прочитанные', callback_data: 'notifications_read_all' }])
      }

      buttons.push([{ text: '📬 Все уведомления', url: `${process.env.FRONTEND_URL}/dashboard/notifications` }])

      await ctx.reply(notificationsText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons
        }
      })
    } else {
      notificationsText += `📝 Уведомлений пока нет`
      
      await ctx.reply(notificationsText, {
        parse_mode: 'Markdown'
      })
    }
  } catch (error) {
    console.error('Notifications handler error:', error)
    await ctx.reply('❌ Ошибка при загрузке уведомлений. Попробуйте позже.')
  }
}
