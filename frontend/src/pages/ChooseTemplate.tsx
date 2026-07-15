import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardCheck, MessageSquare, Vote, UserCheck, Loader2 } from 'lucide-react'
import { Button, Card } from '@/components/kit'
import { Logo } from '@/components/logo'
import { createPollFromTemplate, ApiError } from '@/api/client'

interface Template {
  key: string
  title: string
  description: string
  icon: typeof ClipboardCheck
}

const templates: Template[] = [
  {
    key: 'lesson_feedback',
    title: 'Оценка занятия',
    description: 'Оцените качество проведённого занятия по нескольким критериям.',
    icon: ClipboardCheck,
  },
  {
    key: 'feedback',
    title: 'Обратная связь',
    description: 'Соберите мнения участников о продукте, мероприятии или процессе.',
    icon: MessageSquare,
  },
  {
    key: 'vote',
    title: 'Голосование',
    description: 'Проведите голосование по одному или нескольким вопросам.',
    icon: Vote,
  },
  {
    key: 'survey',
    title: 'Анкета',
    description: 'Заполните анкету с вопросами разных типов.',
    icon: UserCheck,
  },
]

export default function ChooseTemplate() {
  const navigate = useNavigate()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelect = async (template: Template) => {
    setLoadingKey(template.key)
    setError('')
    try {
      const poll = await createPollFromTemplate(template.key)
      navigate(`/surveys/${poll.id}/edit`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || 'Не удалось создать опрос из шаблона')
      } else {
        setError('Не удалось создать опрос из шаблона')
      }
      setLoadingKey(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Logo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          to="/my-polls"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Назад к опросам
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Новый опрос
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Выберите шаблон, чтобы быстро начать, или{' '}
          <Link to="/surveys/new/blank" className="text-primary underline-offset-2 hover:underline">
            создайте опрос с нуля
          </Link>.
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {templates.map((template) => {
            const Icon = template.icon
            const isLoading = loadingKey === template.key
            const isDisabled = loadingKey !== null

            return (
              <button
                key={template.key}
                type="button"
                onClick={() => handleSelect(template)}
                disabled={isDisabled}
                className="group text-left"
              >
                <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-primary/30 disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      {isLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </span>
                    <h3 className="text-base font-medium text-foreground">
                      {template.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                </Card>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
