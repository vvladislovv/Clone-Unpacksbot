import { Context, MiddlewareFn } from 'telegraf'

export const errorHandler: MiddlewareFn<Context> = async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error('Bot error:', error)
    
    // Log error details
    console.error('Error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      update: ctx.update,
      user: ctx.from,
      chat: ctx.chat,
    })

    try {
      // Try to send error message to user
      await ctx.reply(
        '❌ Произошла ошибка при обработке вашего запроса.\n\n' +
        'Пожалуйста, попробуйте позже или обратитесь в техподдержку.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Попробовать снова', callback_data: 'start' }],
              [{ text: '💬 Техподдержка', url: 'https://t.me/support_unpacker_clone' }]
            ]
          }
        }
      )
    } catch (replyError) {
      console.error('Failed to send error message:', replyError)
    }
  }
}
