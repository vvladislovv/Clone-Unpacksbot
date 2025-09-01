'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import {
    ArrowRightIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    CurrencyDollarIcon,
    MegaphoneIcon,
    ShieldCheckIcon,
    UsersIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const features = [
  {
    icon: UsersIcon,
    title: 'Мультиролевая система',
    description: 'Селлеры, блогеры и менеджеры - каждый найдет свое место',
  },
  {
    icon: MegaphoneIcon,
    title: 'Расширенная реклама',
    description: 'Реклама товаров WB и продвижение каналов/групп',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Улучшенный чат',
    description: 'Система чата без багов с поддержкой файлов',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Реферальная система',
    description: '50% вознаграждение за приглашенных пользователей',
  },
  {
    icon: ChartBarIcon,
    title: 'Аналитика',
    description: 'Подробная статистика по кампаниям и доходам',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Безопасность',
    description: 'Надежная защита данных и транзакций',
  },
]

const roles = [
  {
    title: 'Селлер',
    description: 'Управляйте товарами и создавайте рекламные кампании',
    features: ['Добавление товаров WB', 'Создание кампаний', 'Аналитика продаж', 'Финансовые операции'],
    color: 'bg-blue-500',
  },
  {
    title: 'Блогер',
    description: 'Размещайте рекламу и зарабатывайте на партнерских программах',
    features: ['Размещение рекламы', 'Партнерские программы', 'Реклама каналов', 'Статистика кликов'],
    color: 'bg-purple-500',
  },
  {
    title: 'Менеджер',
    description: 'Координируйте работу между продавцами и рекламщиками',
    features: ['Модерация контента', 'Техподдержка', 'Управление спорами', 'Координация'],
    color: 'bg-green-500',
  },
]

export default function HomePage() {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  if (user) {
    return null // Loading state while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600"></div>
              <h1 className="text-xl font-bold">Unpacker Clone</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Войти</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Регистрация</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4" variant="secondary">
              Новая платформа для бизнеса
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Современная платформа для{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                продавцов и блогеров
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Объединяем продавцов, блогеров и менеджеров в единой экосистеме. 
              Создавайте кампании, размещайте рекламу и зарабатывайте больше.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="flex items-center gap-2">
                  Начать бесплатно
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Узнать больше
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Преимущества платформы</h2>
            <p className="text-lg text-muted-foreground">
              Все необходимые инструменты для успешного бизнеса
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <feature.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Выберите свою роль</h2>
            <p className="text-lg text-muted-foreground">
              Каждая роль имеет уникальные возможности и инструменты
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {roles.map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${role.color}`}>
                      <UsersIcon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {role.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center text-white"
          >
            <h2 className="mb-4 text-3xl font-bold">Готовы начать?</h2>
            <p className="mb-8 text-lg opacity-90">
              Присоединяйтесь к нашей платформе и начните зарабатывать уже сегодня
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary">
                Создать аккаунт бесплатно
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-600 to-purple-600"></div>
              <span className="font-semibold">Unpacker Clone</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Политика конфиденциальности
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Пользовательское соглашение
              </Link>
              <Link href="/support" className="hover:text-foreground">
                Поддержка
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
