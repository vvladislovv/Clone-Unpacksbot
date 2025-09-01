import { Context } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const referralHandler = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id.toString()
    
    if (!telegramId) {
      await ctx.reply('❌ Ошибка получения данных пользователя')
      return
    }

    const [user, referralsData] = await Promise.all([
      apiService.getUserProfile(telegramId),
      apiService.getUserReferrals(telegramId)
    ])
    
    let referralText = `🎁 *Реферальная программа*\n\n`
    referralText += `💰 *Ваша комиссия: 50%* (лучше чем у конкурентов!)\n\n`
    referralText += `🔗 *Ваш реферальный код:*\n\`${user.referralCode}\`\n\n`
    
    const referralLink = `${process.env.FRONTEND_URL}/auth/register?ref=${user.referralCode}`
    referralText += `🌐 *Ваша реферальная ссылка:*\n${referralLink}\n\n`
    
    referralText += `📊 *Статистика:*\n`
    referralText += `👥 Приглашено: ${referralsData.count} чел.\n`
    referralText += `💰 Заработано: ${referralsData.totalEarnings} ₽\n\n`

    if (referralsData.referrals && referralsData.referrals.length > 0) {
      referralText += `👥 *Ваши рефералы:*\n\n`
      
      referralsData.referrals.slice(0, 5).forEach((referral, index) => {
        referralText += `${index + 1}. ${referral.firstName}${referral.lastName ? ' ' + referral.lastName : ''}\n`
        referralText += `   📅 ${new Date(referral.createdAt).toLocaleDateString()}\n\n`
      })
      
      if (referralsData.referrals.length > 5) {
        referralText += `... и еще ${referralsData.referrals.length - 5} рефералов\n\n`
      }
    }

    referralText += `💡 *Как это работает:*\n`
    referralText += `• Приглашайте друзей по вашей ссылке\n`
    referralText += `• Получайте 50% с их первых заработков\n`
    referralText += `• Выводите деньги в любое время\n`
    referralText += `• Безлимитное количество рефералов!`

    await ctx.reply(referralText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Копировать код', callback_data: `copy_${user.referralCode}` }],
          [{ text: '🔗 Поделиться ссылкой', switch_inline_query: `Присоединяйся к Unpacker Clone! Заработок на рекламе и товарах. Регистрация: ${referralLink}` }],
          [{ text: '📊 Детальная статистика', url: `${process.env.FRONTEND_URL}/dashboard/referrals` }]
        ]
      }
    })
  } catch (error) {
    console.error('Referral handler error:', error)
    await ctx.reply('❌ Ошибка при загрузке реферальной программы. Попробуйте позже.')
  }
}
