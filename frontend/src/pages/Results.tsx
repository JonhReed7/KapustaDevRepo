import { Link, useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Download, Star, ChevronDown, Loader2 } from 'lucide-react'
import { Button, Card } from '@/components/kit'
import { Logo } from '@/components/logo'
import {
  exportPollResults,
  getPollEngagement,
  getPollResults,
  ApiError,
  type EngagementData,
  type PollResults,
} from '@/api/client'

function ChoiceChart({ question }: { question: PollResults['questions'][number] }) {
  const options = question.options ?? []
  const total = options.reduce((sum, o) => sum + o.votes, 0)
  const max = Math.max(...options.map((o) => o.votes), 1)

  return (
    <div className="flex flex-col gap-3.5">
      {options.map((option) => {
        const pct = total > 0 ? Math.round((option.votes / total) * 100) : 0
        const width = (option.votes / max) * 100
        const isLeading = option.votes === max
        return (
          <div key={option.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-foreground">{option.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {pct}% · {option.votes}
              </span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-md bg-muted">
              <div
                className={`h-full rounded-md ${isLeading ? 'bg-primary' : 'bg-chart-3'}`}
                style={{ width: `${Math.max(width, 4)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TextResponses({ question }: { question: PollResults['questions'][number] }) {
  const texts = question.texts ?? []
  if (texts.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет ответов</p>
  }
  return (
    <div className="flex flex-col gap-2.5">
      {texts.map((text, i) => (
        <div key={i} className="rounded-md bg-muted px-4 py-3 text-sm text-foreground">
          {text}
        </div>
      ))}
    </div>
  )
}

function RatingDisplay({ question }: { question: PollResults['questions'][number] }) {
  const average = question.average ?? 0
  const scale = question.scale ?? 5
  return (
    <div className="flex items-center gap-5">
      <div className="text-5xl font-semibold tabular-nums text-foreground">
        {average.toFixed(1)}
      </div>
      <div>
        <div className="flex items-center gap-1 text-primary">
          {Array.from({ length: scale }).map((_, i) => (
            <Star
              key={i}
              className="size-5"
              fill={i < Math.round(average) ? 'currentColor' : 'none'}
              strokeWidth={i < Math.round(average) ? 0 : 2}
            />
          ))}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">Среднее из {scale}</p>
      </div>
    </div>
  )
}

export default function Results() {
  const { pollId } = useParams<{ pollId: string }>()
  const numericId = pollId ? Number(pollId) : null

  const [results, setResults] = useState<PollResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [engagement, setEngagement] = useState<EngagementData | null>(null)

  useEffect(() => {
    if (!numericId) {
      setLoading(false)
      return
    }
    let cancelled = false
    Promise.all([
      getPollResults(numericId).catch(() => null),
      getPollEngagement(numericId).catch(() => null),
    ]).then(([res, eng]) => {
      if (cancelled) return
      if (res) setResults(res)
      if (eng) setEngagement(eng)
      if (!res) setError('Не удалось загрузить результаты')
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [numericId])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!numericId) return
    setMenuOpen(false)
    setExporting(true)
    setExportError('')
    try {
      const { blob, filename } = await exportPollResults(numericId, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : 'Не удалось скачать файл'
      setExportError(msg)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Logo />
          <Link to="/my-polls">
            <Button variant="ghost" size="sm">
              Мои опросы
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        {loading ? (
          <div className="mt-12 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !results ? (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            {error || 'Результаты недоступны'}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {results.title}
                </h1>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tabular-nums text-foreground">
                    {results.total_responses}
                  </span>
                  <span className="text-sm text-muted-foreground">всего ответов</span>
                </div>
              </div>
              <div className="relative" ref={menuRef}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMenuOpen((o) => !o)}
                  disabled={exporting || !numericId}
                >
                  {exporting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Загрузка…
                    </>
                  ) : (
                    <>
                      <Download />
                      Экспорт результатов
                      <ChevronDown className="size-4" />
                    </>
                  )}
                </Button>
                {menuOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-border/60 bg-card shadow-md">
                    <button
                      type="button"
                      onClick={() => handleExport('csv')}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      CSV (.csv)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('xlsx')}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      Excel (.xlsx)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {exportError && (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {exportError}
              </div>
            )}

            {engagement && (
              <Card className="mt-8 p-6">
                <h2 className="text-base font-medium text-foreground">
                  Индекс вовлечённости участников
                </h2>
                <div className="mt-5 flex items-baseline gap-3">
                  <span className="text-5xl font-semibold tabular-nums text-foreground">
                    {Math.round(engagement.engagement_index * 100)}%
                  </span>
                  <span className="text-sm text-muted-foreground">индекс вовлечённости</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>
                    Начали:{' '}
                    <span className="tabular-nums text-foreground">{engagement.total_started}</span>
                  </span>
                  <span>
                    Завершили:{' '}
                    <span className="tabular-nums text-foreground">{engagement.total_completed}</span>
                  </span>
                  <span>
                    Доля завершивших:{' '}
                    <span className="tabular-nums text-foreground">
                      {Math.round(engagement.completion_rate * 100)}%
                    </span>
                  </span>
                  {engagement.avg_completion_seconds != null && (
                    <span>
                      Среднее время:{' '}
                      <span className="tabular-nums text-foreground">
                        {Math.floor(engagement.avg_completion_seconds / 60)} мин{' '}
                        {Math.round(engagement.avg_completion_seconds % 60)} сек
                      </span>
                    </span>
                  )}
                </div>
              </Card>
            )}

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {results.questions.map((question, index) => (
                <Card
                  key={question.id}
                  className={`p-6 ${question.type === 'multiple' ? 'lg:col-span-2' : ''}`}
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <h2 className="text-base font-medium leading-snug text-foreground">
                      {index + 1}. {question.prompt}
                    </h2>
                  </div>
                  {question.type === 'rating' ? (
                    <RatingDisplay question={question} />
                  ) : question.type === 'open_text' ? (
                    <TextResponses question={question} />
                  ) : (
                    <ChoiceChart question={question} />
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
