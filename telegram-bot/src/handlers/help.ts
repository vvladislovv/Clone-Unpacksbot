import { Context } from 'telegraf'

export const helpHandler = async (ctx: Context) => {
  try {
    const helpText = `
📋 *Справка по боту Unpacker Clone*

🤖 *Основные команды:*
/start - Начать работу с ботом
/register - Регистрация в системе
/profile - Просмотр профиля
/balance - Баланс и транзакции
/campaigns - Управление кампаниями
/notifications - Уведомления
/referral - Реферальная программа
/help - Эта справка

🎯 *Что можно делать:*
• 🛒 Управлять товарами Wildberries
• 📢 Создавать рекламные кампании
• 💬 Размещать рекламу каналов и групп
• 💰 Зарабатывать на реферальной программе
• 📊 Отслеживать статистику доходов
• 💸 Выводить заработанные средства

🎁 *Роли пользователей:*
• *Селлер* - управление товарами и кампаниями
• *Блогер* - размещение рекламы, партнерские программы
• *Менеджер* - координация и техническая поддержка

💡 *Особенности платформы:*
• Реферальная комиссия 50% (лучше конкурентов!)
• Улучшенная система чата без багов
• Множественные способы вывода средств
• Современный и удобный интерфейс

🔗 *Полезные ссылки:*
• Веб-приложение: ${process.env.FRONTEND_URL || 'https://unpacker-clone.com'}
• Техподдержка: @support_unpacker_clone
• Новости и обновления: @unpacker_clone_news

❓ *Нужна помощь?*
Обратитесь в техподдержку или задайте вопрос в общем чате.
    `.trim()

    await ctx.reply(helpText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👤 Профиль', callback_data: 'profile' },
            { text: '💰 Баланс', callback_data: 'balance' }
          ],
          [
            { text: '📊 Кампании', callback_data: 'campaigns' },
            { text: '🎁 Рефералы', callback_data: 'referral' }
          ],
          [
            { text: '🌐 Открыть веб-приложение', url: process.env.FRONTEND_URL || 'https://unpacker-clone.com' }
          ],
          [
            { text: '💬 Техподдержка', url: 'https://t.me/support_unpacker_clone' }
          ]
        ]
      }
    })
  } catch (error) {
    console.error('Help handler error:', error)
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.')
  }
}
