import { Context } from 'telegraf'

export const registerHandler = async (ctx: Context) => {
  try {
    await ctx.scene.enter('register')
  } catch (error) {
    console.error('Register handler error:', error)
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.')
  }
}
