import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { GripVertical, Plus, Trash2, X, Copy, Check, Loader2 } from 'lucide-react'
import { Button, Card, Field, Input, Select, Textarea } from '@/components/kit'
import { Logo } from '@/components/logo'
import {
  createPoll,
  getPoll,
  publishPoll,
  updatePoll,
  ApiError,
  type QuestionPayload,
} from '@/api/client'

type QuestionType = 'single' | 'multiple' | 'rating' | 'open_text'

interface QuestionDraft {
  id: number
  text: string
  type: QuestionType
  options: string[]
  scale?: number
}

let nextId = 1
const makeQuestion = (): QuestionDraft => ({
  id: nextId++,
  text: '',
  type: 'single',
  options: ['', ''],
})

function toQuestionPayload(q: QuestionDraft, index: number): QuestionPayload {
  const base = {
    prompt: q.text,
    type: q.type,
    sort_order: index,
  }
  if (q.type === 'rating') {
    return { ...base, options: [], scale: q.scale || 5 }
  }
  if (q.type === 'open_text') {
    return { ...base, options: [] }
  }
  return {
    ...base,
    options: q.options.filter((o) => o.trim()).map((label) => ({ label })),
  }
}

export default function CreateSurvey() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pollId = id ? Number(id) : null
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => [makeQuestion()])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loadingPoll, setLoadingPoll] = useState(!!id)
  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [publicSlug, setPublicSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!pollId) return
    let cancelled = false

    async function load() {
      try {
        const poll = await getPoll(pollId!)
        if (cancelled) return
        setTitle(poll.title)
        setDescription(poll.description || '')
        if (poll.questions && poll.questions.length > 0) {
          setQuestions(
            poll.questions.map((q) => ({
              id: nextId++,
              text: q.prompt,
              type: q.type as QuestionType,
              scale: q.scale,
              options:
                q.type === 'rating' || q.type === 'open_text'
                  ? []
                  : q.options.length > 0
                    ? q.options.map((o) => o.label)
                    : ['', ''],
            })),
          )
        }
      } catch {
        if (!cancelled) setError('Не удалось загрузить опрос')
      } finally {
        if (!cancelled) setLoadingPoll(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [pollId])

  const updateQuestion = (id: number, patch: Partial<QuestionDraft>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)))

  const addQuestion = () => setQuestions((qs) => [...qs, makeQuestion()])
  const removeQuestion = (id: number) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id))

  const addOption = (id: number) =>
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, options: [...q.options, ''] } : q)),
    )
  const updateOption = (id: number, index: number, value: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === id
          ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) }
          : q,
      ),
    )
  const removeOption = (id: number, index: number) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === id ? { ...q, options: q.options.filter((_, i) => i !== index) } : q,
      ),
    )

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError('Введите название опроса')
      return
    }
    setSavingDraft(true)
    setError('')
    setSuccess('')
    try {
      const payloads = questions.map(toQuestionPayload)
      if (pollId) {
        await updatePoll(pollId, { title: title.trim(), description: description.trim() || undefined, questions: payloads })
      } else {
        const poll = await createPoll(title.trim(), description.trim() || undefined, payloads)
        navigate(`/surveys/${poll.id}/edit`, { replace: true })
      }
      setSuccess('Черновик сохранён')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || 'Не удалось сохранить черновик')
      } else {
        setError('Не удалось сохранить черновик')
      }
    } finally {
      setSavingDraft(false)
    }
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      setError('Введите название опроса')
      return
    }
    setPublishing(true)
    setError('')
    setSuccess('')
    try {
      const payloads = questions.map(toQuestionPayload)
      let pollIdToPublish: number
      if (pollId) {
        await updatePoll(pollId, { title: title.trim(), description: description.trim() || undefined, questions: payloads })
        pollIdToPublish = pollId
      } else {
        const poll = await createPoll(title.trim(), description.trim() || undefined, payloads)
        pollIdToPublish = poll.id
        navigate(`/surveys/${poll.id}/edit`, { replace: true })
      }
      const published = await publishPoll(pollIdToPublish)
      setPublicSlug(published.public_slug!)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || 'Не удалось опубликовать опрос')
      } else {
        setError('Не удалось опубликовать опрос')
      }
    } finally {
      setPublishing(false)
    }
  }

  const copyLink = async () => {
    const url = `${window.location.origin}/take/${publicSlug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const publicLink = publicSlug ? `${window.location.origin}/take/${publicSlug}` : ''
  const backLink = '/my-polls'
  const backLabel = '← Назад к опросам'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveDraft}
              disabled={savingDraft || publishing}
            >
              {savingDraft ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Сохранение…
                </>
              ) : (
                'Сохранить черновик'
              )}
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={savingDraft || publishing}
            >
              {publishing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Публикация…
                </>
              ) : (
                'Опубликовать'
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          to={backLink}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {backLabel}
        </Link>

        {loadingPoll && (
          <div className="mt-12 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loadingPoll && (
        <>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          {pollId ? 'Редактирование опроса' : 'Создание опроса'}
        </h1>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            {success}
          </div>
        )}

        {publicSlug && (
          <Card className="mt-4 p-4">
            <p className="text-sm text-muted-foreground">Публичная ссылка на опрос:</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm text-foreground">
                {publicLink}
              </code>
              <Button size="sm" variant="secondary" onClick={copyLink}>
                {copied ? (
                  <>
                    <Check className="size-4" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Скопировать ссылку
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Survey meta */}
        <Card className="mt-6 flex flex-col gap-5 p-6">
          <Field label="Название опроса" htmlFor="title">
            <Input
              id="title"
              placeholder="Напр. Обратная связь по продукту Q3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Описание" htmlFor="description">
            <Textarea
              id="description"
              placeholder="Добавьте краткое описание, чтобы участники понимали контекст."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </Card>

        {/* Questions */}
        <div className="mt-6 flex flex-col gap-5">
          {questions.map((question, qIndex) => (
            <Card key={question.id} className="p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <GripVertical className="size-4" />
                  Вопрос {qIndex + 1}
                </span>
                <button
                  type="button"
                  aria-label="Удалить вопрос"
                  onClick={() => removeQuestion(question.id)}
                  disabled={questions.length === 1}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Input
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                    placeholder="Введите ваш вопрос"
                  />
                </div>
                <Select
                  value={question.type}
                  onChange={(e) =>
                    updateQuestion(question.id, { type: e.target.value as QuestionType })
                  }
                  className="sm:w-52"
                  aria-label="Тип вопроса"
                >
                  <option value="single">Один вариант</option>
                  <option value="multiple">Несколько вариантов</option>
                  <option value="rating">Оценка</option>
                  <option value="open_text">Свободный ответ</option>
                </Select>
              </div>

              {question.type === 'rating' ? (
                <p className="mt-4 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Респонденты оценят этот вопрос по шкале от 1 до 5.
                </p>
              ) : question.type === 'open_text' ? (
                <p className="mt-4 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Респондент напишет свободный текстовый ответ.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-2.5">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <span className="size-4 shrink-0 rounded-full border-2 border-border" />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                        placeholder={`Вариант ${oIndex + 1}`}
                        className="h-10"
                      />
                      <button
                        type="button"
                        aria-label="Удалить вариант"
                        onClick={() => removeOption(question.id, oIndex)}
                        disabled={question.options.length <= 2}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    <Plus className="size-4" /> Добавить вариант
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Button variant="secondary" className="mt-5 w-full" onClick={addQuestion}>
          <Plus /> Добавить вопрос
        </Button>
        </>
        )}
      </main>
    </div>
  )
}
