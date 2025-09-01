import { Context, MiddlewareFn } from 'telegraf'

interface RateLimitData {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitData>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute

export const rateLimitMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  try {
    const userId = ctx.from?.id.toString()
    
    if (!userId) {
      await next()
      return
    }

    const now = Date.now()
    const userRateLimit = rateLimitMap.get(userId)

    if (!userRateLimit || now > userRateLimit.resetTime) {
      // Reset or create new rate limit data
      rateLimitMap.set(userId, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW
      })
      await next()
      return
    }

    if (userRateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
      // Rate limit exceeded
      const resetInSeconds = Math.ceil((userRateLimit.resetTime - now) / 1000)
      
      await ctx.reply(
        `⏰ Слишком много запросов!\n\n` +
        `Попробуйте снова через ${resetInSeconds} секунд.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏠 На главную', callback_data: 'start' }]
            ]
          }
        }
      )
      return
    }

    // Increment counter
    userRateLimit.count++
    rateLimitMap.set(userId, userRateLimit)

    await next()
  } catch (error) {
    console.error('Rate limit middleware error:', error)
    await next()
  }
}

// Clean up old rate limit data periodically
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  rateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => {
    rateLimitMap.delete(key)
  })
}, RATE_LIMIT_WINDOW)
