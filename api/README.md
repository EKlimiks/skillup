# SkillUp API

Минимальный Laravel 11 API для приложения SkillUp: регистрация и вход,
хранение прогресса, объединение версий с двух устройств, недельная лига.

Стек: **Laravel 11 + Sanctum + MySQL**.

## Запуск

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --port=8000
```

## Маршруты

```
POST   /api/auth/register      регистрация (name, email, password, password_confirmation)
POST   /api/auth/login         вход (email, password)
GET    /api/auth/me            текущий пользователь
POST   /api/auth/logout        выход

GET    /api/skillup/progress   вернуть прогресс
PUT    /api/skillup/progress   сохранить прогресс
POST   /api/skillup/merge      объединить локальный и серверный прогресс
GET    /api/skillup/league     недельная лига
DELETE /api/skillup/account    удалить аккаунт и все данные
```

## Устройство

- `users` — аккаунты (Sanctum-токены).
- `skillup_progress` — один JSON-объект прогресса на пользователя
  (`cards`, `lessons`, `xp`, `gems`, `streak`, `achievements`, `settings` и т.д.).
- `app/Services/SkillupMerger.php` — правила объединения: то, что растёт
  (опыт, гемы, карточки), берётся по максимуму; настройки — по времени правки.

Подробное описание полей и правил объединения — в [`SKILLUP-API.md`](SKILLUP-API.md).

## Проверка

```bash
node tests/skillup-api-test.mjs
```
