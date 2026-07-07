import { Link } from 'react-router-dom'
import { BarChart3, ClipboardList, ExternalLink, Vote } from 'lucide-react'
import { Button, Card } from '@/components/kit'
import { Navbar } from '@/components/navbar'
import { Logo } from '@/components/logo'

const features = [
  {
    icon: ClipboardList,
    title: 'Создавайте опросы',
    description: 'Создавайте многоступенчатые опросы с выбором вариантов и оценкой за считанные минуты.',
  },
  {
    icon: Vote,
    title: 'Собирайте голоса',
    description: 'Поделитесь удобной ссылкой и собирайте ответы из любой точки.',
  },
  {
    icon: BarChart3,
    title: 'Анализируйте результаты',
    description: 'Просматривайте наглядные графики и средние значения, которые превращают голоса в полезные выводы.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Опросы и аналитика голосований
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
            Создавайте опросы, которые люди заполняют до конца, и понимайте каждый ответ.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            KapustaDev помогает вам создавать продуманные опросы, собирать голоса и превращать ответы в
            понятные аналитические отчёты — без лишнего шума.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/surveys/new">
              <Button size="lg" className="w-full sm:w-auto">
                Создать опрос
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl px-6 pb-24 scroll-mt-20">
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-7">
                <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-medium text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section id="examples" className="mx-auto w-full max-w-6xl px-6 pb-24 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Примеры</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Попробуйте пройти опрос или посмотреть результаты — всё работает прямо сейчас.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Link to="/take" className="group">
              <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-primary/30">
                <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <ClipboardList className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-medium text-foreground">Пройти опрос</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Многоступенчатый опрос с выбором вариантов и прогресс-баром.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Открыть <ExternalLink className="size-3.5" />
                </span>
              </Card>
            </Link>
            <Link to="/results" className="group">
              <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-primary/30">
                <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <BarChart3 className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-medium text-foreground">Результаты опроса</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Диаграммы, проценты и средние оценки — наглядный анализ ответов.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Открыть <ExternalLink className="size-3.5" />
                </span>
              </Card>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
        </div>
      </footer>
    </div>
  )
}
