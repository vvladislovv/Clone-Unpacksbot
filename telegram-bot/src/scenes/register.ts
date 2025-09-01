import { Scenes } from 'telegraf'
import { APIService } from '../services/api.js'

const apiService = new APIService()

export const registerScene = new Scenes.BaseScene<Scenes.SceneContext>('register')

let userData: any = {}

registerScene.enter(async (ctx) => {
  userData = {
    telegramId: ctx.from?.id.toString(),
    firstName: ctx.from?.first_name,
    lastName: ctx.from?.last_name,
    username: ctx.from?.username
  }

  await ctx.reply(
    '📝 *Регистрация в Unpacker Clone*\n\n' +
    'Выберите вашу роль на платформе:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Селлер', callback_data: 'role_SELLER' }],
          [{ text: '📢 Блогер', callback_data: 'role_BLOGGER' }],
          [{ text: '⚙️ Менеджер', callback_data: 'role_MANAGER' }],
          [{ text: '❌ Отменить', callback_data: 'cancel' }]
        ]
      }
    }
  )
})

registerScene.action(/^role_(.+)$/, async (ctx) => {
  const role = ctx.match![1]
  userData.role = role

  await ctx.editMessageText(
    `✅ Роль "${role}" выбрана!\n\n` +
    '🎁 У вас есть реферальный код? (необязательно)\n\n' +
    'Введите код или нажмите "Пропустить"',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⏭️ Пропустить', callback_data: 'skip_referral' }],
          [{ text: '❌ Отменить', callback_data: 'cancel' }]
        ]
      }
    }
  )

  ctx.scene.state.waitingForReferral = true
})

registerScene.action('skip_referral', async (ctx) => {
  await finishRegistration(ctx)
})

registerScene.action('cancel', async (ctx) => {
  await ctx.editMessageText(
    '❌ Регистрация отменена.\n\n' +
    'Используйте /start для возврата к главному меню.'
  )
  await ctx.scene.leave()
})

registerScene.on('text', async (ctx) => {
  if (ctx.scene.state.waitingForReferral) {
    const referralCode = ctx.message.text.trim().toUpperCase()
    
    if (referralCode.length === 8 && /^[A-Z0-9]+$/.test(referralCode)) {
      userData.referralCode = referralCode
      await ctx.reply('✅ Реферальный код принят!')
    } else {
      await ctx.reply('⚠️ Неверный формат кода. Пропускаем...')
    }
    
    await finishRegistration(ctx)
  }
})

async function finishRegistration(ctx: any) {
  try {
    await ctx.reply('⏳ Регистрация...')

    const result = await apiService.registerUser(userData)
    
    const roleNames = {
      SELLER: 'Селлер',
      BLOGGER: 'Блогер',
      MANAGER: 'Менеджер'
    }

    await ctx.reply(
      `🎉 *Регистрация завершена успешно!*\n\n` +
      `👋 Добро пожаловать, ${result.user.firstName}!\n` +
      `🎯 Роль: ${roleNames[result.user.role as keyof typeof roleNames]}\n` +
      `🎁 Ваш реферальный код: \`${result.user.referralCode}\`\n\n` +
      `💡 Теперь вы можете пользоваться всеми функциями платформы!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👤 Профиль', callback_data: 'profile' },
              { text: '💰 Баланс', callback_data: 'balance' }
            ],
            [
              { text: '🌐 Открыть приложение', url: process.env.FRONTEND_URL || 'https://unpacker-clone.com' }
            ]
          ]
        }
      }
    )

    await ctx.scene.leave()
  } catch (error) {
    console.error('Registration error:', error)
    
    await ctx.reply(
      '❌ Ошибка при регистрации.\n\n' +
      'Возможные причины:\n' +
      '• Вы уже зарегистрированы\n' +
      '• Неверный реферальный код\n' +
      '• Временная ошибка сервера\n\n' +
      'Попробуйте позже или обратитесь в поддержку.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: 'register' }],
            [{ text: '💬 Техподдержка', url: 'https://t.me/support_unpacker_clone' }]
          ]
        }
      }
    )

    await ctx.scene.leave()
  }
}
