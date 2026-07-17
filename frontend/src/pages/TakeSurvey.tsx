import { Link, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { Button, Card, ProgressBar, Textarea } from '@/components/kit'
import { Logo } from '@/components/logo'
import {
  getPublicPoll,
  startPublicResponse,
  submitPublicResponse,
  type PublicPoll,
  type PublicPollQuestion,
  type AnswerPayload,
} from '@/api/client'

type Answers = Record<number, string | string[] | number>

export default function TakeSurvey() {
  const { publicSlug } = useParams<{ publicSlug: string }>()
  const [poll, setPoll] = useState<PublicPoll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const pollResponseIdRef = useRef<number | null>(null)
  const startedAtRef = useRef<string>(new Date().toISOString())

  useEffect(() => {
    if (!publicSlug) {
      setError('Опрос не найден')
      setLoading(false)
      return
    }
    setLoading(true)
    getPublicPoll(publicSlug)
      .then((data) => {
        if (data.status === 'closed') {
          setError('Опрос завершён')
        } else {
          setPoll(data)
        }
      })
      .catch(() => {
        setError('Опрос не найден')
      })
      .finally(() => setLoading(false))
  }, [publicSlug])

  const ensureStarted = async () => {
    if (pollResponseIdRef.current !== null) return pollResponseIdRef.current
    if (!publicSlug) return null
    const { poll_response_id } = await startPublicResponse(publicSlug)
    pollResponseIdRef.current = poll_response_id
    startedAtRef.current = new Date().toISOString()
    return poll_response_id
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto flex w-full max-w-2xl items-center px-6 py-6">
          <Logo />
        </div>
        <main className="flex flex-1 items-start justify-center px-6 pb-20 pt-4">
          <Card className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-destructive/12 text-destructive">
              <AlertCircle className="size-7" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              {error || 'Опрос не найден'}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Возможно, ссылка устарела или опрос был удалён.
            </p>
            <Link to="/" className="mt-6">
              <Button variant="secondary">На главную</Button>
            </Link>
          </Card>
        </main>
      </div>
    )
  }

  const question: PublicPollQuestion | undefined = poll.questions[current]
  const isLast = current === poll.questions.length - 1
  const answer = question ? answers[question.id] : undefined
  const progress = ((current + (answer !== undefined ? 1 : 0)) / poll.questions.length) * 100

  const setAnswer = (value: string | string[] | number) => {
    if (!question) return
    setAnswers((a) => ({ ...a, [question.id]: value }))
  }

  const toggleMultiple = (optionLabel: string) => {
    if (!question) return
    const current = (answers[question.id] as string[]) || []
    if (current.includes(optionLabel)) {
      setAnswer(current.filter((v) => v !== optionLabel))
    } else {
      setAnswer([...current, optionLabel])
    }
  }

  const canProceed = (): boolean => {
    if (!question) return false
    const answer = answers[question.id]
    if (answer === undefined) return false
    if (question.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0
    }
    if (question.type === 'rating') {
      return typeof answer === 'number' && answer > 0
    }
    if (question.type === 'open_text') {
      return typeof answer === 'string' && answer.trim().length > 0
    }
    return true
  }

  const buildAnswerPayloads = (): AnswerPayload[] => {
    const payloads: AnswerPayload[] = []
    for (const q of poll.questions) {
      const raw = answers[q.id]
      if (q.type === 'rating') {
        payloads.push({ question_id: q.id, rating_value: typeof raw === 'number' ? raw : undefined })
      } else if (q.type === 'open_text') {
        payloads.push({ question_id: q.id, text_value: typeof raw === 'string' ? raw : undefined })
      } else if (q.type === 'multiple' && Array.isArray(raw)) {
        const selectedLabels = new Set(raw)
        for (const opt of q.options) {
          if (selectedLabels.has(opt.label)) {
            payloads.push({ question_id: q.id, option_id: opt.id })
          }
        }
      } else if (q.type === 'single' && typeof raw === 'string') {
        const matched = q.options.find((o) => o.label === raw)
        payloads.push({ question_id: q.id, option_id: matched?.id })
      } else {
        payloads.push({ question_id: q.id })
      }
    }
    return payloads
  }

  const next = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await ensureStarted()
      if (isLast) {
        if (!publicSlug) return
        const responseId = pollResponseIdRef.current
        if (responseId === null) throw new Error('Failed to start')
        const answerPayloads = buildAnswerPayloads()
        await submitPublicResponse(publicSlug, responseId, answerPayloads)
        setDone(true)
      } else {
        setCurrent((c) => c + 1)
      }
    } catch {
      setError('Не удалось отправить ответ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl items-center px-6 py-6">
        <Logo />
      </div>

      <main className="flex flex-1 items-start justify-center px-6 pb-20 pt-4">
        <div className="w-full max-w-[600px]">
          {done ? (
            <Card className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
                <Check className="size-7" />
              </span>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                Спасибо за ваш ответ
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Ваши ответы записаны. Вы можете безопасно закрыть эту страницу.
              </p>
              <Link to="/" className="mt-6">
                <Button variant="secondary">На главную</Button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{poll.title}</span>
                  <span>
                    Вопрос {current + 1} из {poll.questions.length}
                  </span>
                </div>
                <ProgressBar value={progress} />
              </div>

              <Card className="p-7 md:p-9">
                <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
                  {question.prompt}
                </h1>

                <div className="mt-7">
                  {question.type === 'single' && (
                    <div className="flex flex-col gap-3">
                      {question.options.map((option) => {
                        const active = answer === option.label
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setAnswer(option.label)}
                            className={`flex items-center gap-3 rounded-md border px-4 py-4 text-left text-sm transition-colors ${
                              active
                                ? 'border-primary bg-accent text-foreground'
                                : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted'
                            }`}
                          >
                            <span
                              className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                              }`}
                            >
                              {active && <Check className="size-3" />}
                            </span>
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {question.type === 'multiple' && (
                    <div className="flex flex-col gap-3">
                      {question.options.map((option) => {
                        const selected = Array.isArray(answer) && answer.includes(option.label)
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleMultiple(option.label)}
                            className={`flex items-center gap-3 rounded-md border px-4 py-4 text-left text-sm transition-colors ${
                              selected
                                ? 'border-primary bg-accent text-foreground'
                                : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted'
                            }`}
                          >
                            <span
                              className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                              }`}
                            >
                              {selected && <Check className="size-3" />}
                            </span>
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {question.type === 'rating' && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        {Array.from({ length: question.scale || 5 }, (_, i) => i + 1).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setAnswer(num)}
                            className={`flex size-12 items-center justify-center rounded-full border-2 text-lg font-medium transition-colors ${
                              answer === num
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Плохо</span>
                        <span>Отлично</span>
                      </div>
                    </div>
                  )}

                  {question.type === 'open_text' && (
                    <Textarea
                      placeholder="Введите ваш ответ..."
                      value={(answer as string) || ''}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="min-h-32"
                    />
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={next} disabled={!canProceed() || submitting}>
                    {submitting ? 'Отправка...' : isLast ? 'Отправить' : 'Далее'}
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
