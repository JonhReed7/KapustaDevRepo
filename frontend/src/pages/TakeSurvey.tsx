import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button, Card, ProgressBar } from '@/components/kit'
import { Logo } from '@/components/logo'
import { takingSurvey } from '@/lib/data'

export default function TakeSurvey() {
  const { title, questions } = takingSurvey
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const question = questions[current]
  const isLast = current === questions.length - 1
  const selected = answers[question?.id]
  const progress = ((current + (selected ? 1 : 0)) / questions.length) * 100

  const select = (value: string) =>
    setAnswers((a) => ({ ...a, [question.id]: value }))

  const next = () => {
    if (isLast) setDone(true)
    else setCurrent((c) => c + 1)
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
              <Link to="/results" className="mt-6">
                <Button variant="secondary">Смотреть результаты</Button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{title}</span>
                  <span>
                    Вопрос {current + 1} из {questions.length}
                  </span>
                </div>
                <ProgressBar value={progress} />
              </div>

              <Card className="p-7 md:p-9">
                <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
                  {question.prompt}
                </h1>

                <div className="mt-7 flex flex-col gap-3">
                  {question.options.map((option) => {
                    const active = selected === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => select(option)}
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
                        {option}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={next} disabled={!selected}>
                    {isLast ? 'Отправить' : 'Далее'}
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
