import { Scenes } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const withdrawalScene = new Scenes.BaseScene<Scenes.SceneContext>('withdrawal')

let withdrawalData: any = {}

withdrawalScene.enter(async (ctx) => {
  withdrawalData = {
    method: ctx.scene.state.withdrawalMethod || 'bank_card',
    details: {}
  }

  const methodNames = {
    bank_card: 'Банковская карта',
    yoomoney: 'ЮMoney',
    qiwi: 'QIWI'
  }

  await ctx.reply(
    `💸 *Вывод средств*\n\n` +
    `📋 Способ: ${methodNames[withdrawalData.method as keyof typeof methodNames]}\n\n` +
    `💰 Введите сумму для вывода (в рублях):`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отменить', callback_data: 'cancel' }]
        ]
      }
    }
  )

  ctx.scene.state.waitingForAmount = true
})

withdrawalScene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Вывод средств отменен.')
  await ctx.scene.leave()
})

withdrawalScene.on('text', async (ctx) => {
  const text = ctx.message.text.trim()

  if (ctx.scene.state.waitingForAmount) {
    const amount = parseFloat(text)
    
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Неверная сумма. Введите число больше 0:')
      return
    }

    if (amount < 100) {
      await ctx.reply('❌ Минимальная сумма вывода: 100 ₽. Введите другую сумму:')
      return
    }

    if (amount > 100000) {
      await ctx.reply('❌ Максимальная сумма вывода: 100,000 ₽. Введите другую сумму:')
      return
    }

    withdrawalData.amount = amount
    ctx.scene.state.waitingForAmount = false

    // Ask for payment details based on method
    if (withdrawalData.method === 'bank_card') {
      await ctx.reply(
        `💳 Введите номер банковской карты:\n\n` +
        `📝 Формат: 1234 5678 9012 3456`
      )
      ctx.scene.state.waitingForCard = true
    } else if (withdrawalData.method === 'yoomoney') {
      await ctx.reply(
        `💰 Введите номер кошелька ЮMoney:\n\n` +
        `📝 Формат: 410011234567890`
      )
      ctx.scene.state.waitingForAccount = true
    } else if (withdrawalData.method === 'qiwi') {
      await ctx.reply(
        `📱 Введите номер телефона QIWI:\n\n` +
        `📝 Формат: +79123456789`
      )
      ctx.scene.state.waitingForPhone = true
    }

  } else if (ctx.scene.state.waitingForCard) {
    const cardNumber = text.replace(/\s/g, '')
    
    if (!/^\d{16}$/.test(cardNumber)) {
      await ctx.reply('❌ Неверный номер карты. Введите 16 цифр:')
      return
    }

    withdrawalData.details.cardNumber = cardNumber
    await finishWithdrawal(ctx)

  } else if (ctx.scene.state.waitingForAccount) {
    if (!/^\d{12,15}$/.test(text)) {
      await ctx.reply('❌ Неверный номер кошелька. Введите правильный номер:')
      return
    }

    withdrawalData.details.accountId = text
    await finishWithdrawal(ctx)

  } else if (ctx.scene.state.waitingForPhone) {
    const phone = text.replace(/[^\d+]/g, '')
    
    if (!/^\+?\d{11}$/.test(phone)) {
      await ctx.reply('❌ Неверный номер телефона. Введите в формате +79123456789:')
      return
    }

    withdrawalData.details.phone = phone
    await finishWithdrawal(ctx)
  }
})

async function finishWithdrawal(ctx: any) {
  try {
    await ctx.reply('⏳ Обработка заявки на вывод...')

    const telegramId = ctx.from?.id.toString()
    if (!telegramId) {
      throw new Error('No telegram ID')
    }

    const transaction = await apiService.createWithdrawal(telegramId, withdrawalData)
    
    const methodNames = {
      bank_card: 'банковскую карту',
      yoomoney: 'ЮMoney',
      qiwi: 'QIWI'
    }

    await ctx.reply(
      `✅ *Заявка на вывод создана!*\n\n` +
      `💰 Сумма: ${withdrawalData.amount} ₽\n` +
      `📋 Способ: ${methodNames[withdrawalData.method as keyof typeof methodNames]}\n` +
      `🆔 ID заявки: \`${transaction.id}\`\n\n` +
      `⏰ Обработка займет до 24 часов.\n` +
      `📧 Уведомление придет в бот.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Баланс', callback_data: 'balance' }],
            [{ text: '📊 История транзакций', url: `${process.env.FRONTEND_URL}/dashboard/transactions` }]
          ]
        }
      }
    )

    await ctx.scene.leave()
  } catch (error) {
    console.error('Withdrawal error:', error)
    
    await ctx.reply(
      '❌ Ошибка при создании заявки.\n\n' +
      'Возможные причины:\n' +
      '• Недостаточно средств на балансе\n' +
      '• Неверные реквизиты\n' +
      '• Временная ошибка сервера\n\n' +
      'Попробуйте позже или обратитесь в поддержку.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Проверить баланс', callback_data: 'balance' }],
            [{ text: '💬 Техподдержка', url: 'https://t.me/support_unpacker_clone' }]
          ]
        }
      }
    )

    await ctx.scene.leave()
  }
}
