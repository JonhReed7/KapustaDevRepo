import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, FileText, Inbox, Plus, SquareCheck } from 'lucide-react'
import { Badge, Button, Card } from '@/components/kit'
import { Logo } from '@/components/logo'
import { useAuth } from '@/lib/auth'
import { getMyPolls, closePoll, type Poll, type PollStatus } from '@/api/client'

type FilterStatus = PollStatus | 'all'

const statusLabel: Record<PollStatus, string> = {
  draft: 'Черновик',
  active: 'Активен',
  closed: 'Завершён',
}

const statusTone: Record<PollStatus, 'muted' | 'accent' | 'success'> = {
  draft: 'muted',
  active: 'accent',
  closed: 'success',
}

const filterLabels: Record<FilterStatus, string> = {
  all: 'Все',
  draft: 'Черновик',
  active: 'Активен',
  closed: 'Завершён',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function MyPolls() {
  const { user, logout } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getMyPolls()
        if (!cancelled) setPolls(data)
      } catch {
        if (!cancelled) setError('Не удалось загрузить опросы.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const [closingId, setClosingId] = useState<number | null>(null)

  const handleClose = useCallback(async (pollId: number) => {
    setClosingId(pollId)
    try {
      await closePoll(pollId)
      setPolls((prev) =>
        prev.map((p) => (p.id === pollId ? { ...p, status: 'closed' as PollStatus } : p)),
      )
    } catch {
      // silently ignore — poll may already be closed
    } finally {
      setClosingId(null)
    }
  }, [])

  const filtered = filter === 'all' ? polls : polls.filter((p) => p.status === filter)

  const counts = {
    all: polls.length,
    draft: polls.filter((p) => p.status === 'draft').length,
    active: polls.filter((p) => p.status === 'active').length,
    closed: polls.filter((p) => p.status === 'closed').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={logout}>Выйти</Button>
            <span className="ml-1 flex size-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
              {initials}
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Мои опросы</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Управляйте опросами, отслеживайте ответы и просматривайте результаты.
            </p>
          </div>
          <Link to="/surveys/new">
            <Button className="w-full sm:w-auto">
              <Plus /> Создать опрос
            </Button>
          </Link>
        </div>

        {/* Status filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(Object.keys(filterLabels) as FilterStatus[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {filterLabels[key]}
              <span className={`ml-0.5 text-xs ${filter === key ? 'opacity-70' : 'opacity-60'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="mt-12 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          </div>
        ) : error ? (
          <Card className="mt-8 flex flex-col items-center justify-center px-6 py-20 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
              Попробовать снова
            </Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="mt-8 flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Inbox className="size-6" />
            </span>
            <h2 className="mt-5 text-lg font-medium text-foreground">
              {filter === 'all' ? 'Опросов пока нет' : 'Нет опросов с таким статусом'}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {filter === 'all'
                ? 'Создайте первый опрос, чтобы начать собирать голоса и анализировать результаты.'
                : 'Попробуйте выбрать другой фильтр или создайте новый опрос.'}
            </p>
            <Link to="/surveys/new" className="mt-6">
              <Button>
                <Plus /> Создать опрос
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((poll) => (
              <Link key={poll.id} to={poll.status === 'draft' ? `/surveys/${poll.id}/edit` : `/results/${poll.id}`} className="group">
                <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-primary/30">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-medium leading-snug text-foreground">
                      {poll.title}
                    </h3>
                    <Badge tone={statusTone[poll.status]}>{statusLabel[poll.status]}</Badge>
                  </div>
                  <div className="mt-6 flex items-center gap-5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="size-4" />
                      {poll.responses} ответов
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" />
                      {formatDate(poll.created_at)}
                    </span>
                  </div>
                  {poll.status === 'active' && (
                    <button
                      type="button"
                      disabled={closingId === poll.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleClose(poll.id)
                      }}
                      className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <SquareCheck className="size-3.5" />
                      {closingId === poll.id ? 'Завершение…' : 'Завершить'}
                    </button>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
