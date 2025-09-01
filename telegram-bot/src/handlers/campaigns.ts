import { Context } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const campaignsHandler = async (ctx: Context) => {
  try {
    const telegramId = ctx.from?.id.toString()
    
    if (!telegramId) {
      await ctx.reply('❌ Ошибка получения данных пользователя')
      return
    }

    const campaignsData = await apiService.getUserCampaigns(telegramId)
    
    let campaignsText = `📊 *Ваши кампании*\n\n`

    if (campaignsData.stats) {
      campaignsText += `📈 *Статистика:*\n`
      campaignsText += `💰 Всего потрачено: ${campaignsData.stats.totalSpent || 0} ₽\n`
      campaignsText += `👆 Всего кликов: ${campaignsData.stats.totalClicks || 0}\n`
      campaignsText += `📊 Всего кампаний: ${campaignsData.stats.totalCampaigns || 0}\n\n`
    }

    if (campaignsData.campaigns && campaignsData.campaigns.length > 0) {
      campaignsText += `🎯 *Активные кампании:*\n\n`
      
      campaignsData.campaigns.slice(0, 5).forEach((campaign, index) => {
        const statusEmoji = campaign.status === 'ACTIVE' ? '🟢' :
                          campaign.status === 'PAUSED' ? '⏸️' :
                          campaign.status === 'DRAFT' ? '📝' : '⭐'
        
        const typeEmoji = campaign.type === 'product' ? '🛒' : '📢'
        
        campaignsText += `${typeEmoji} *${campaign.title}*\n`
        campaignsText += `   ${statusEmoji} Статус: ${campaign.status}\n`
        campaignsText += `   💰 Бюджет: ${campaign.budget} ₽\n`
        campaignsText += `   👆 Клики: ${campaign.currentClicks}${campaign.maxClicks ? `/${campaign.maxClicks}` : ''}\n`
        campaignsText += `   💵 За клик: ${campaign.pricePerClick} ₽\n\n`
      })

      // Add action buttons for first campaign
      if (campaignsData.campaigns[0]) {
        const firstCampaign = campaignsData.campaigns[0]
        const buttons = []
        
        if (firstCampaign.status === 'DRAFT' || firstCampaign.status === 'PAUSED') {
          buttons.push({ text: '▶️ Запустить', callback_data: `campaign_start_${firstCampaign.id}` })
        }
        
        if (firstCampaign.status === 'ACTIVE') {
          buttons.push({ text: '⏸️ Приостановить', callback_data: `campaign_pause_${firstCampaign.id}` })
        }

        if (buttons.length > 0) {
          await ctx.reply(campaignsText, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                buttons,
                [{ text: '📊 Все кампании', url: `${process.env.FRONTEND_URL}/dashboard/campaigns` }]
              ]
            }
          })
          return
        }
      }
    } else {
      campaignsText += `📝 Кампаний пока нет\n\n`
      campaignsText += `💡 Создайте первую кампанию в веб-приложении!`
    }

    await ctx.reply(campaignsText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Создать кампанию', url: `${process.env.FRONTEND_URL}/dashboard/campaigns/create` }],
          [{ text: '📊 Все кампании', url: `${process.env.FRONTEND_URL}/dashboard/campaigns` }]
        ]
      }
    })
  } catch (error) {
    console.error('Campaigns handler error:', error)
    await ctx.reply('❌ Ошибка при загрузке кампаний. Попробуйте позже.')
  }
}
