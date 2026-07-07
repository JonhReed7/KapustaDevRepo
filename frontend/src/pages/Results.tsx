import { Link } from 'react-router-dom'
import { Download, Star } from 'lucide-react'
import { Button, Card } from '@/components/kit'
import { Logo } from '@/components/logo'
import { sampleResult, type ResultQuestion } from '@/lib/data'

function ChoiceChart({ question }: { question: ResultQuestion }) {
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

function RatingDisplay({ question }: { question: ResultQuestion }) {
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
  const result = sampleResult

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Logo />
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Панель управления
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {result.title}
            </h1>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tabular-nums text-foreground">
                {result.totalResponses}
              </span>
              <span className="text-sm text-muted-foreground">всего ответов</span>
            </div>
          </div>
          <Button variant="secondary" size="sm">
            <Download /> Экспортировать результаты
          </Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {result.questions.map((question, index) => (
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
              ) : (
                <ChoiceChart question={question} />
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
