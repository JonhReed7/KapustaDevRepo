import { Link } from 'react-router-dom'
import { useState } from 'react'
import { GripVertical, Plus, Trash2, X } from 'lucide-react'
import { Button, Card, Field, Input, Select, Textarea } from '@/components/kit'
import { Logo } from '@/components/logo'

type QuestionType = 'single' | 'multiple' | 'rating'

interface QuestionDraft {
  id: number
  text: string
  type: QuestionType
  options: string[]
}

let nextId = 1
const makeQuestion = (): QuestionDraft => ({
  id: nextId++,
  text: '',
  type: 'single',
  options: ['', ''],
})

export default function CreateSurvey() {
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => [makeQuestion()])

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              Сохранить черновик
            </Button>
            <Button size="sm">Опубликовать</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Назад к опросам
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Создание опроса
        </h1>

        {/* Survey meta */}
        <Card className="mt-6 flex flex-col gap-5 p-6">
          <Field label="Название опроса" htmlFor="title">
            <Input id="title" placeholder="Напр. Обратная связь по продукту Q3" />
          </Field>
          <Field label="Описание" htmlFor="description">
            <Textarea
              id="description"
              placeholder="Добавьте краткое описание, чтобы участники понимали контекст."
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
                </Select>
              </div>

              {question.type === 'rating' ? (
                <p className="mt-4 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Респонденты оценят этот вопрос по шкале от 1 до 5.
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
      </main>
    </div>
  )
}
