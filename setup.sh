#!/bin/bash
# ============================================================
# KapustaDev — быстрая настройка продакшена
# ============================================================
# Использование:
#   bash setup.sh <домен-бэкенда> [домен-фронтенда]
#
# Примеры:
#   bash setup.sh api.kapusta.dev https://kapusta.vercel.app
#   bash setup.sh kapusta.example.com "https://kapusta.vercel.app,https://kapusta-preview.vercel.app"
#
# Скрипт:
#   1. Генерирует пароль БД и JWT-секрет
#   2. Создаёт .env файл
#   3. Настраивает nginx.conf под ваш домен
#   4. Создаёт директории для certbot
# ============================================================
set -e

DOMAIN="${1:?Usage: bash setup.sh <backend-domain> [frontend-domain]}"
FRONTEND_DOMAIN="${2:-https://*.vercel.app}"

# --- Генерация секретов ---
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '\n')
SECRET_KEY=$(openssl rand -base64 48 | tr -d '\n')

# --- Создание .env ---
cat > .env << EOF
# ====== ИЗМЕНИТЕ (обязательно) ======
DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
SECRET_KEY=$SECRET_KEY
CORS_ORIGINS=["$FRONTEND_DOMAIN"]

# ====== ОСТАЛЬНОЕ (менять не нужно) ======
POSTGRES_USER=kapusta
POSTGRES_DB=kapusta
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
DB_HOST=db
DB_PORT=5432
EOF

# --- Настройка nginx и caddy ---
sed -i "s/<DOMAIN>/$DOMAIN/g" deploy/nginx.conf
sed -i "s/<DOMAIN>/$DOMAIN/g" deploy/caddy/Caddyfile

# --- Директории для certbot ---
mkdir -p deploy/certbot/conf deploy/certbot/www

echo ""
echo "Готово! Настроено:"
echo "  .env          — создан с автоматически сгенерированными секретами"
echo "  nginx.conf    — домен $DOMAIN подставлен"
echo "  Caddyfile     — домен $DOMAIN подставлен"
echo "  certbot/      — директории созданы"
echo ""
echo "Далее:"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "Пароль БД:   $POSTGRES_PASSWORD"
echo "JWT-секрет:   $SECRET_KEY"
echo "(Сохраните их — пригодятся при восстановлении)"
