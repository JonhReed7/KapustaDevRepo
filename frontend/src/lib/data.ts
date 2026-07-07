export type SurveyStatus = 'Черновик' | 'Активен' | 'Завершён'

export interface SurveySummary {
  id: string
  title: string
  status: SurveyStatus
  responses: number
  createdAt: string
}

export const surveys: SurveySummary[] = [
  {
    id: 'product-feedback',
    title: 'Обратная связь по продукту Q3',
    status: 'Активен',
    responses: 342,
    createdAt: '12 июня 2026',
  },
  {
    id: 'remote-work',
    title: 'Предпочтения по удалённой работе',
    status: 'Активен',
    responses: 189,
    createdAt: '3 июня 2026',
  },
  {
    id: 'brand-name',
    title: 'Голосование за новое название бренда',
    status: 'Завершён',
    responses: 521,
    createdAt: '21 мая 2026',
  },
  {
    id: 'onboarding',
    title: 'Опрос по опыту онбординга',
    status: 'Черновик',
    responses: 0,
    createdAt: '28 июня 2026',
  },
  {
    id: 'event-topics',
    title: 'Темы мероприятий сообщества',
    status: 'Активен',
    responses: 76,
    createdAt: '24 июня 2026',
  },
  {
    id: 'nps',
    title: 'Удовлетворённость клиентов (NPS)',
    status: 'Завершён',
    responses: 410,
    createdAt: '30 апреля 2026',
  },
]

export interface ChoiceOption {
  label: string
  votes: number
}

export interface ResultQuestion {
  id: string
  prompt: string
  type: 'single' | 'multiple' | 'rating'
  options?: ChoiceOption[]
  average?: number
  scale?: number
}

export interface SurveyResult {
  title: string
  totalResponses: number
  questions: ResultQuestion[]
}

export const sampleResult: SurveyResult = {
  title: 'Обратная связь по продукту Q3',
  totalResponses: 342,
  questions: [
    {
      id: 'q1',
      prompt: 'Какую функцию вы используете чаще всего?',
      type: 'single',
      options: [
        { label: 'Аналитика дашборда', votes: 168 },
        { label: 'Конструктор опросов', votes: 94 },
        { label: 'Общий доступ для команды', votes: 51 },
        { label: 'Экспорт данных', votes: 29 },
      ],
    },
    {
      id: 'q2',
      prompt: 'Что стоит улучшить в первую очередь?',
      type: 'multiple',
      options: [
        { label: 'Больше типов вопросов', votes: 203 },
        { label: 'Улучшенный мобильный опыт', votes: 152 },
        { label: 'Интеграции с другими сервисами', votes: 121 },
        { label: 'Настраиваемый брендинг', votes: 88 },
      ],
    },
    {
      id: 'q3',
      prompt: 'Как бы вы оценили общий опыт?',
      type: 'rating',
      average: 4.3,
      scale: 5,
    },
  ],
}

export interface SurveyQuestion {
  id: string
  prompt: string
  options: string[]
}

export const takingSurvey = {
  title: 'Предпочтения по удалённой работе',
  questions: [
    {
      id: 't1',
      prompt: 'Сколько дней в неделю вы бы хотели работать удалённо?',
      options: ['0–1 день', '2–3 дня', '4 дня', 'Полностью удалённо'],
    },
    {
      id: 't2',
      prompt: 'Что важно для вашей идеальной рабочей среды?',
      options: ['Гибкий график', 'Тихое время для концентрации', 'Очное взаимодействие', 'Короче дорога до офиса'],
    },
    {
      id: 't3',
      prompt: 'Какие инструменты помогают вам быть максимально продуктивным?',
      options: ['Асинхронные сообщения', 'Видеозвонки', 'Общие документы', 'Канбан-доски'],
    },
  ] satisfies SurveyQuestion[],
}
