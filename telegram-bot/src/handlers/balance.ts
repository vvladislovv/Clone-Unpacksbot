import { Context } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const balanceHandler = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id.toString()
    
    if (!telegramId) {
      await ctx.reply('❌ Ошибка получения данных пользователя')
      return
    }

    const balanceData = await apiService.getUserBalance(telegramId)
    
    let balanceText = `💰 *Ваш баланс*\n\n`
    balanceText += `💵 Текущий баланс: *${balanceData.balance} ₽*\n\n`

    if (balanceData.transactions && balanceData.transactions.length > 0) {
      balanceText += `📊 *Последние транзакции:*\n\n`
      
      balanceData.transactions.slice(0, 5).forEach((transaction, index) => {
        const amount = transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount
        const statusEmoji = transaction.status === 'COMPLETED' ? '✅' : 
                          transaction.status === 'PENDING' ? '⏳' : '❌'
        const typeEmoji = transaction.type === 'DEPOSIT' ? '💳' :
                         transaction.type === 'WITHDRAWAL' ? '💸' :
                         transaction.type === 'REFERRAL' ? '🎁' : '💰'
        
        balanceText += `${typeEmoji} ${amount} ₽ ${statusEmoji}\n`
        if (transaction.description) {
          balanceText += `   ${transaction.description}\n`
        }
        balanceText += `   ${new Date(transaction.createdAt).toLocaleDateString()}\n\n`
      })
    } else {
      balanceText += `📝 Транзакций пока нет`
    }

    await ctx.reply(balanceText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💸 Вывести средства', callback_data: 'withdraw_bank_card' }
          ],
          [
            { text: '📊 История транзакций', url: `${process.env.FRONTEND_URL}/dashboard/transactions` }
          ]
        ]
      }
    })
  } catch (error) {
    console.error('Balance handler error:', error)
    await ctx.reply('❌ Ошибка при загрузке баланса. Попробуйте позже.')
  }
}
