import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Field, Input } from '@/components/kit'
import { Logo } from '@/components/logo'
import { useAuth } from '@/lib/auth'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()
  const isSignup = mode === 'signup'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        await register(email, password, name)
      } else {
        await login(email, password)
      }
      navigate('/my-polls')
    } catch {
      setError('Что-то пошло не так. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <Logo />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isSignup ? 'Создайте аккаунт' : 'Добро пожаловать'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignup
                ? 'Начните создавать опросы за пару минут.'
                : 'Войдите, чтобы управлять опросами и просматривать результаты.'}
            </p>
          </div>

          <Card className="p-6">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {isSignup && (
                <Field label="Имя" htmlFor="name">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Иван Иванов"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
              )}
              <Field label="Электронная почта" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Пароль" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="mt-1 w-full" disabled={loading}>
                {loading ? 'Загрузка…' : isSignup ? 'Создать аккаунт' : 'Войти'}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">или продолжить через</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="secondary" className="w-full">
              Продолжить через Google
            </Button>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'signin' : 'signup')
                setError('')
              }}
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              {isSignup ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
