import { Link } from 'react-router-dom'
import { CalendarDays, FileText, Inbox, Plus } from 'lucide-react'
import { Badge, Button, Card } from '@/components/kit'
import { Logo } from '@/components/logo'
import { surveys, type SurveyStatus } from '@/lib/data'

const statusTone: Record<SurveyStatus, 'muted' | 'accent' | 'success'> = {
  'Черновик': 'muted',
  'Активен': 'accent',
  'Завершён': 'success',
}

const showEmpty = false

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link to="/results">
              <Button variant="ghost" size="sm">
                Результаты
              </Button>
            </Link>
            <span className="ml-1 flex size-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
              JD
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
              <Plus /> Новый опрос
            </Button>
          </Link>
        </div>

        {showEmpty ? (
          <Card className="mt-8 flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Inbox className="size-6" />
            </span>
            <h2 className="mt-5 text-lg font-medium text-foreground">Опросов пока нет</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Создайте первый опрос, чтобы начать собирать голоса и анализировать результаты.
            </p>
            <Link to="/surveys/new" className="mt-6">
              <Button>
                <Plus /> Создать опрос
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <Link key={survey.id} to="/results" className="group">
                <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-primary/30">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-medium leading-snug text-foreground">
                      {survey.title}
                    </h3>
                    <Badge tone={statusTone[survey.status]}>{survey.status}</Badge>
                  </div>
                  <div className="mt-6 flex items-center gap-5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="size-4" />
                      {survey.responses} ответов
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" />
                      {survey.createdAt}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
