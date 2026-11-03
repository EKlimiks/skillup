# EKlimiks — REST API интернет-магазина техники Apple

Дипломный проект: **backend-часть** магазина **EKlimiks**, который продаёт **только технику Apple**
(iPhone, Mac, iPad, Apple Watch, AirPods, HomePod, Apple TV, Vision Pro, аксессуары).

Стек по заданию преподавателя: **React + Laravel + MySQL**.
Этот репозиторий — **Laravel 11 API**: каталог, корзина, заказы, онлайн-бронирование визита в магазин,
запись в сервисный центр (ремонт) с динамическим выбором мастера и свободного времени из БД,
Trade-In, отзывы, лид-формы, бонусная программа и админ-панель.

Frontend (React + Vite) живёт в **соседней папке `eklimiks/`** — см. раздел
[«Связка с React-фронтендом»](#связка-с-react-фронтендом).

---

## Содержание

1. [Требования и стек](#1-требования-и-стек)
2. [Структура проекта](#2-структура-проекта)
3. [Быстрый старт в OSPanel (колледж)](#3-быстрый-старт-в-ospanel-колледж)
4. [Схема БД и связи таблиц](#4-схема-бд-и-связи-таблиц)
5. [Таблица API-маршрутов](#5-таблица-api-маршрутов)
6. [Тестовые учётные записи](#6-тестовые-учётные-записи)
7. [Бизнес-логика](#7-бизнес-логика)
8. [Связка с React-фронтендом](#8-связка-с-react-фронтендом)
9. [Деплой на VPS (vps.ktk-45.ru)](#9-деплой-на-vps-vpsktk-45ru)
10. [Частые проблемы](#10-частые-проблемы)

---

## 1. Требования и стек

| Компонент | Версия | Примечание |
|---|---|---|
| PHP | **8.2+** | OSPanel: модуль PHP 8.2/8.3 |
| Laravel | **11.x** | `->withRouting(api: ...)`, `->withMiddleware(...)` |
| MySQL | **8.0** / MariaDB 10.4+ | кодировка `utf8mb4` |
| Laravel Sanctum | 4.x | API-токены + SPA-cookie |
| Composer | 2.x | установка зависимостей |
| Node.js (для фронта) | 18+ | сборка React-приложения |

Расширения PHP, которые обязательно включить в OSPanel:
`pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `curl`, `fileinfo`, `zip`.

---

## 2. Структура проекта

```
eklimiks-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php                  # базовый контроллер
│   │   │   └── Api/
│   │   │       ├── AuthController.php          # регистрация, вход, выход, me
│   │   │       ├── ProductController.php       # каталог + фильтры + отзывы товара
│   │   │       ├── CategoryController.php      # категории
│   │   │       ├── CartController.php          # серверная корзина (сессия)
│   │   │       ├── OrderController.php         # оформление и просмотр заказов
│   │   │       ├── BookingController.php       # бронирование визита в магазин
│   │   │       ├── RepairController.php        # услуги, мастера, слоты, заявки
│   │   │       ├── TradeInController.php       # оценка и заявка Trade-In
│   │   │       ├── ReviewController.php        # отзывы
│   │   │       ├── LeadController.php          # лид-формы
│   │   │       ├── FavoriteController.php      # избранное
│   │   │       ├── ProfileController.php       # личный кабинет
│   │   │       ├── SettingController.php       # публичные настройки
│   │   │       └── Admin/                      # админ-панель
│   │   │           ├── DashboardController.php
│   │   │           ├── ProductController.php
│   │   │           ├── CategoryController.php
│   │   │           ├── OrderController.php
│   │   │           ├── RepairController.php
│   │   │           ├── TradeInController.php
│   │   │           ├── UserController.php
│   │   │           ├── ReviewController.php
│   │   │           ├── SettingController.php
│   │   │           ├── SlotController.php
│   │   │           ├── StoreController.php
│   │   │           └── LeadController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureUserIsAdmin.php           # role = admin → иначе 403 JSON
│   │   │   └── EnsureUserIsStaff.php           # role = admin|manager
│   │   ├── Requests/                           # 10 Form Request с русскими сообщениями
│   │   └── Resources/                          # 10 API Resource
│   ├── Models/                                 # 18 моделей Eloquent
│   ├── Providers/AppServiceProvider.php
│   └── Services/
│       ├── BookingService.php                  # свободные слоты + бронирование в транзакции
│       ├── TradeInCalculator.php               # формула оценки Trade-In
│       └── OrderNumberGenerator.php            # номера заказов EK-2026-000123
├── bootstrap/app.php                           # регистрация api-роутов и middleware
├── config/                                     # app.php, cors.php, sanctum.php, database.php
├── database/
│   ├── data/products.php                       # 37 товаров Apple: цены, цвета, specs, картинки
│   ├── factories/                              # UserFactory, ProductFactory
│   ├── migrations/                             # 20 миграций в правильном порядке зависимостей
│   ├── seeders/                                # 11 сидеров
│   └── schema.sql                              # готовый MySQL-дамп: DDL + INSERT
├── routes/
│   ├── api.php                                 # все API-маршруты
│   └── web.php                                 # health-check
├── storage/, bootstrap/cache/                  # создаются Laravel в рантайме
├── tools/                                      # python-скрипты проверки (PHP не нужен)
│   ├── check_php.py                            # структура PHP, маршруты, каталог
│   ├── check_images.py                         # сверка картинок с фронтендом
│   ├── check_sql.py                            # проверка schema.sql
│   └── normalize_colors.py                     # синхронизация цветов с React-каталогом
├── .env.example
├── composer.json
└── README.md
```

---

## 3. Быстрый старт в OSPanel (колледж)

### 3.1. Подготовка

1. Запустите **OSPanel**, включите модули **PHP 8.2+**, **MySQL 8**, **Apache/Nginx**.
2. Скопируйте папку `eklimiks-laravel` в домены OSPanel, например:
   `C:\OSPanel\domains\eklimiks-laravel\`
   (или оставьте на рабочем столе — работать будет и через `php artisan serve`).

### 3.2. Создание базы данных

Через **phpMyAdmin** (`http://localhost/phpmyadmin`) или консоль MySQL:

```sql
CREATE DATABASE eklimiks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3.3. Настройка окружения

```bash
cd eklimiks-laravel

# Windows (cmd)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Проверьте в `.env` (для OSPanel пользователь обычно `root` без пароля):

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eklimiks
DB_USERNAME=root
DB_PASSWORD=
```

### 3.4. Установка зависимостей и запуск

```bash
composer install
php artisan key:generate
```

### 3.5. Наполнение базы — **два способа**

**Способ А (рекомендуется) — миграции + сидеры:**

```bash
php artisan migrate --seed
```

**Способ Б — импорт готового дампа `schema.sql`** (если нужно создать БД без Composer):

```bash
mysql -u root eklimiks < database/schema.sql
```

или в phpMyAdmin: база `eklimiks` → **Импорт** → выбрать `database/schema.sql` → **Вперёд**.

> Способ Б создаёт те же таблицы и данные (12 товаров, категории, магазины, услуги,
> мастеров, слоты, настройки, промокоды, отзывы), но без 20 миграций.
> Оба способа взаимоисключающие: не применяйте их к одной и той же базе.

### 3.6. Символическая ссылка и запуск сервера

```bash
php artisan storage:link
php artisan serve
```

API будет доступно по адресу **http://localhost:8000/api**.
Проверка работоспособности: **http://localhost:8000/health** → `{"status":"ok","database":"ok"}`.

Полезные команды:

```bash
php artisan route:list --path=api     # список всех API-маршрутов
php artisan migrate:fresh --seed      # пересоздать базу с данными
php artisan eklimiks:about            # информация о проекте
```

---

## 4. Схема БД и связи таблиц

**18 таблиц.** Связи (минимум две связанные таблицы в проекте выполняются многократно):

```
categories 1 ──< products                 (products.category_id → categories.id, ON DELETE CASCADE)
users      1 ──< orders                   (orders.user_id → users.id, CASCADE)
orders     1 ──< order_items >── 1 products
users      1 ──< bookings  >── 1 products  и  >── 1 stores
users      1 ──< repair_requests >── 1 repair_services
                             >── 1 masters (nullable)
                             >── 1 master_slots (nullable)
masters    1 ──< master_slots             (CASCADE, UNIQUE(master_id, date, time))
users      1 ──< trade_ins                (user_id nullable — заявка возможна от гостя)
users      1 ──< reviews  >── 1 products  (user_id nullable — отзыв может быть без аккаунта)
users      >──< products через favorites  (UNIQUE(user_id, product_id))
users      1 ──< personal_access_tokens   (Sanctum)
settings / promos / leads / stores / cache / jobs — справочные и служебные таблицы
```

| Таблица | Назначение | Ключевые поля |
|---|---|---|
| `users` | клиенты, менеджеры, администраторы | `role` enum(client/manager/admin), `bonus_points` |
| `categories` | 8 категорий каталога | `slug` unique, `icon`, `sort` |
| `products` | товары Apple | `price`, `old_price`, `colors`/`specs`/`images` JSON, `stock`, `rating`, `reviews_count` |
| `stores` | точки самовывоза | `address`, `phone`, `work_hours` |
| `orders` | заказы | `number` (EK-2026-000123), `status`, `total`, `delivery_type` |
| `order_items` | позиции заказа | `qty`, `price` (цена на момент покупки) |
| `masters` | мастера сервиса | `specialization`, `experience_years`, `rating` |
| `master_slots` | **свободное время мастера** | `date`, `time`, `is_booked`, UNIQUE(master, date, time) |
| `repair_services` | услуги ремонта | `slug`, `price_from`, `duration_minutes` |
| `repair_requests` | заявки на ремонт | `status` (7 значений), `master_slot_id` |
| `bookings` | бронирование визита | `slot_date`, `slot_time`, `store_id`, UNIQUE(store, date, time) |
| `trade_ins` | оценка устройства | `device_condition`, `battery_health`, `estimated_price`, `final_price` |
| `reviews` | отзывы | `rating`, `is_approved` |
| `leads` | формы сайта | `type` (callback/question/trade_in/repair), `status` |
| `promos` | промокоды | `code`, `discount_percent`, `expires_at` |
| `settings` | тексты и контакты сайта | `key` unique, `value`, `group` |
| `favorites` | избранное | UNIQUE(user_id, product_id) |

---

## 5. Таблица API-маршрутов

Все маршруты доступны по префиксу **`/api`**. Ответы — JSON.
Ошибки валидации: **422** `{ message, errors }`; нет доступа: **403**; не авторизован: **401**.

### Публичные

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | регистрация клиента |
| POST | `/api/auth/login` | вход, выдаёт Bearer-токен |
| POST | `/api/auth/logout` | выход |
| GET | `/api/auth/me` | текущий пользователь |
| GET | `/api/categories` | список категорий (`?with_counts=1`) |
| GET | `/api/categories/{slug}` | одна категория |
| GET | `/api/products` | каталог: `category`, `search`, `min_price`, `max_price`, `condition`, `sort`, `per_page` |
| GET | `/api/products/{slug}` | товар + похожие товары |
| GET | `/api/products/{slug}/reviews` | одобренные отзывы товара |
| GET | `/api/reviews` | последние отзывы (для главной) |
| GET | `/api/repair-services` | услуги сервисного центра |
| GET | `/api/masters` | мастера (`?specialization=`) |
| GET | `/api/masters/{master}/slots?date=YYYY-MM-DD` | **только свободные слоты мастера** + календарь на 14 дней |
| GET | `/api/stores` | магазины |
| GET | `/api/stores/{store}/slots?date=YYYY-MM-DD` | свободное время визита в магазин |
| GET | `/api/booking-slots?date=&master_id=` | слоты всех мастеров и магазинов на дату |
| POST | `/api/trade-in/estimate` | расчёт стоимости Trade-In (без сохранения) |
| GET | `/api/settings/public` | публичные настройки сайта |
| POST | `/api/leads` | лид-форма («Заказать звонок») |
| GET | `/api/leads/types` | типы обращений |
| POST | `/api/repair-requests` | заявка на ремонт (можно без регистрации) |

### Авторизованные (`auth:sanctum`)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/profile` | профиль |
| PUT / PATCH | `/api/profile` | изменить имя, e-mail, телефон, пароль |
| GET | `/api/profile/orders` | мои заказы |
| GET | `/api/profile/repairs` | мои заявки на ремонт |
| GET | `/api/profile/trade-ins` | мои заявки Trade-In |
| GET | `/api/profile/bookings` | мои бронирования |
| GET | `/api/profile/bonuses` | баланс и история бонусов |
| GET | `/api/cart` | корзина |
| POST | `/api/cart` | добавить товар |
| PUT | `/api/cart` | изменить количество (0 — удалить) |
| DELETE | `/api/cart/{product}` | удалить позицию |
| DELETE | `/api/cart` | очистить корзину |
| GET | `/api/favorites` | избранное |
| POST | `/api/favorites` | добавить в избранное |
| DELETE | `/api/favorites/{product}` | убрать из избранного |
| POST | `/api/orders` | оформить заказ |
| GET | `/api/orders/{number}` | заказ по номеру |
| POST | `/api/bookings` | забронировать визит в магазин |
| POST | `/api/reviews` | оставить отзыв (появится после модерации) |

### Админ-панель (`auth:sanctum` + `staff` = admin/manager)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/admin/dashboard` | счётчики, выручка, график продаж, топ товаров, последние записи |
| GET/POST | `/api/admin/orders` | список / создание заказа менеджером |
| GET/PUT/DELETE | `/api/admin/orders/{order}` | просмотр / правка / удаление |
| PATCH | `/api/admin/orders/{order}/status` | смена статуса (отмена возвращает товар на склад) |
| GET/POST | `/api/admin/repair-requests` | заявки на ремонт |
| GET/PUT/DELETE | `/api/admin/repair-requests/{repair_request}` | карточка заявки |
| PATCH | `/api/admin/repair-requests/{repair_request}/status` | смена статуса (отмена освобождает слот) |
| GET | `/api/admin/repair-masters` | справочник мастеров |
| GET/POST | `/api/admin/trade-ins` | заявки Trade-In |
| GET/PUT/DELETE | `/api/admin/trade-ins/{trade_in}` | работа с заявкой |
| PATCH | `/api/admin/trade-ins/{trade_in}/status` | статус и итоговая цена |
| POST | `/api/admin/trade-ins-recalculate` | пересчёт оценки калькулятором |
| GET/PUT/DELETE | `/api/admin/leads/{lead}` | лиды из форм сайта |
| GET | `/api/admin/leads` | список лидов |
| GET/POST | `/api/admin/reviews` | отзывы |
| GET/PUT/DELETE | `/api/admin/reviews/{review}` | правка и удаление (с пересчётом рейтинга) |
| PATCH | `/api/admin/reviews/{review}/approve` | **одобрить отзыв** |
| GET/POST | `/api/admin/master-slots` | расписание мастеров (`?grouped=1`) |
| POST | `/api/admin/master-slots/generate` | сгенерировать слоты на период (воскресенья пропускаются) |
| PATCH | `/api/admin/master-slots/{master_slot}/toggle` | занять / освободить слот |
| GET/PUT/DELETE | `/api/admin/master-slots/{master_slot}` | слот |
| GET/POST | `/api/admin/stores` | магазины |
| GET/PUT/DELETE | `/api/admin/stores/{store}` | магазин |

### Только администратор (`staff` + `admin`)

| Метод | Путь | Описание |
|---|---|---|
| GET/POST | `/api/admin/products` | товары |
| GET/PUT/DELETE | `/api/admin/products/{product}` | товар (при наличии заказов — мягкое скрытие) |
| PATCH | `/api/admin/products/{product}/toggle` | скрыть/показать |
| GET/POST | `/api/admin/categories` | категории |
| GET/PUT/DELETE | `/api/admin/categories/{category}` | категория |
| GET/POST | `/api/admin/users` | пользователи |
| GET/PUT/DELETE | `/api/admin/users/{user}` | пользователь (защита последнего администратора) |
| GET | `/api/admin/settings` | настройки сайта (плоско + по группам) |
| POST | `/api/admin/settings` | создать настройку |
| PATCH | `/api/admin/settings` | **массовое сохранение** `{ "settings": { "phone": "..." } }` |
| GET/PUT/DELETE | `/api/admin/settings/{setting}` | настройка |

Полный список с именами middleware: `php artisan route:list --path=api`.

---

## 6. Тестовые учётные записи

| Роль | E-mail | Пароль | Доступ |
|---|---|---|---|
| Администратор | `admin@eklimiks.ru` | `admin123` | всё, включая товары, категории, пользователей, настройки |
| Менеджер | `manager@eklimiks.ru` | `manager123` | заказы, заявки на ремонт, Trade-In, лиды, отзывы, слоты, магазины |
| Клиент | `client@eklimiks.ru` | `client123` | каталог, корзина, заказы, записи, отзывы, избранное, бонусы |

Проверка через curl:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"admin@eklimiks.ru\",\"password\":\"admin123\"}"
```

В ответе придёт `token` — его нужно передавать в заголовке:

```
Authorization: Bearer <token>
Accept: application/json
```

> Если после импорта `schema.sql` вход не выполняется (хеш пароля не совпал),
> выполните `php artisan tinker` и создайте новый хеш:
> `Illuminate\Support\Facades\Hash::make('admin123')`, затем обновите поле `password`.

---

## 7. Бизнес-логика

### 7.1. TradeInCalculator (`app/Services/TradeInCalculator.php`)

```
стоимость = базовое значение семейства устройства
          × коэффициент накопителя
          × коэффициент состояния
          × коэффициент ёмкости аккумулятора
```

* Базовые значения: таблица `BASE_VALUES` (более 50 позиций: `iphone 18 pro max` → 82 000 ₽,
  `macbook pro 16` → 105 000 ₽, `vision pro` → 130 000 ₽, `airtag` → 900 ₽).
* Накопитель: 64 ГБ → 0.92, 128 → 1.0, 256 → 1.08, 512 → 1.18, 1 ТБ → 1.28, 2 ТБ → 1.36.
* Состояние: `perfect` → 1.0, `good` → 0.82, `fair` → 0.6, `broken` → 0.3.
* Аккумулятор: ≥ 90% → 1.0, 80–89% → 0.95, < 80% → 0.88.
* Результат округляется до целых рублей (`round()`), метод `breakdown()` возвращает расшифровку
  для интерфейса.

### 7.2. BookingService (`app/Services/BookingService.php`)

* `availableSlots(Master $master, string $date)` — **только свободные** слоты
  (`is_booked = false`) выбранного мастера на дату, отсортированные по времени.
* `book(RepairRequest $request, int $slotId)` — внутри `DB::transaction()` берёт строку
  через `lockForUpdate()`, проверяет, что слот свободен и принадлежит нужному мастеру,
  помечает `is_booked = true` и привязывает слот к заявке. При занятом слоте бросает
  `RuntimeException` → API отвечает **409** с понятным текстом.
* `generateSlots()` — массовая генерация расписания (воскресенья пропускаются).
* `availabilityCalendar()` — количество свободных слотов по дням для календаря.

### 7.3. Оформление заказа (`OrderController@store`)

1. Позиции берутся из тела запроса или из серверной корзины (`use_cart: true`).
2. Товары читаются с `lockForUpdate()` — защита от одновременной покупки последнего экземпляра.
3. Проверяется остаток: если `stock < qty` → **422** с названием товара.
4. Остаток уменьшается, **сумма считается только на сервере** по актуальным ценам
   (цены клиента игнорируются).
5. Применяется промокод из `promos` (недействительный → **422**).
6. Генерируется номер вида **`EK-2026-000123`** (`OrderNumberGenerator`).
7. Начисляются бонусы: **2%** от суммы заказа (настройка `bonus_percent`), запись попадает
   в журнал `settings.group = bonus_history` и видна в `/api/profile/bonuses`.
8. Серверная корзина очищается.

### 7.4. Рейтинг товара

При одобрении, правке или удалении отзыва вызывается `Product::recalculateRating()` —
пересчитываются `rating` (среднее, 1 знак) и `reviews_count` по одобренным отзывам.

### 7.5. Роли и middleware

* `EnsureUserIsAdmin` (`admin`) — пропускает только `role = admin`, иначе **403 JSON**.
* `EnsureUserIsStaff` (`staff`) — пропускает `admin` и `manager`.
* Роль хранится в `users.role`, менять её может только администратор.
* Защита: нельзя снять роль или удалить последнего администратора системы
  (ответ **409**), нельзя удалить собственную учётную запись.

---

## 8. Связка с React-фронтендом

Фронтенд лежит в **соседней папке** относительно этого проекта:

```
Сайт Eklimiks top/
├── eklimiks/            ← React + Vite (npm run dev / npm run build)
│   ├── public/img/products/*.webp   ← изображения товаров
│   └── src/
└── eklimiks-laravel/    ← этот Laravel API
```

* Vite dev-сервер: `npm run dev` → `http://localhost:5173`.
  Laravel dev-сервер: `php artisan serve` → `http://localhost:8000`.
  Адрес фронтенда прописан в `.env` (`FRONTEND_URL`) и в `config/cors.php`.
* Продуктовая сборка: `npm run build` создаёт папку **`dist/`** —
  её содержимое копируется в **`public/`** Laravel (там же, где `index.php`).
* **Пути к картинкам совпадают:** API отдаёт `img/products/<slug>--<color_id>.webp`,
  и ровно такие файлы лежат в `eklimiks/public/img/products/`.
  Поэтому файлы изображений достаточно перенести в `eklimiks-laravel/public/img/products/`
  или задеплоить одну общую папку `public`.
* Отзывы, корзина, избранное, заказы, бронирования и запись на ремонт работают
  через описанные выше эндпоинты; тексты и контакты берутся из `GET /api/settings/public`.

### 8.1. Синхронизация каталога с фронтендом

Каталог бэкенда (`database/data/products.php`, 37 товаров) выровнен по
React-каталогу `eklimiks/src/data/catalog.js`:

| Поле | Совпадает |
|---|---|
| `slug` товара (37 шт.) | да, полностью |
| `category` (8 категорий) | да (`iphone`, `mac`, `ipad`, `watch`, `audio`, `tv`, `vision`, `accessories`) |
| `colors[].id` | да, тот же id используется в имени файла картинки |
| `colors[].name` / `hex` | да |
| Названия и описания | тексты бэкенда подробнее, названия моделей совпадают |
| `price` / `old_price` | **отличаются** — см. ниже |

Все 90 пар «товар + цвет» имеют реальный файл в `eklimiks/public/img/products`
(проверяется скриптом `tools/check_images.py`). Пять оставшихся файлов
(`pencil-pro--white2..5`, `magic-keyboard--black2`) — это дополнительные
ракурсы, которые фронтенд может подставлять в галерею товара.

> **Важно про цены.** Бэкенд отдаёт цены «позднего 2026 года»
> (iPhone 18 Pro Max — 189 990 ₽), а локальный демо-слой фронтенда
> (`eklimiks/src/lib/api.js`) использует другие значения (154 990 ₽).
> После переключения фронтенда на API источники должны быть согласованы:
> либо принять цены API как единственный источник правды, либо
> один раз поправить `database/data/products.php` и `database/schema.sql`.
> Все цены правятся в одном месте — сидере `ProductSeeder` / дампе `schema.sql`.

Скрипты проверки (нужен только Python, PHP не требуется):

```bash
python tools/check_php.py      # структура PHP-файлов, маршруты, каталог
python tools/check_images.py   # сверка путей картинок с файлами фронтенда
python tools/check_sql.py      # проверка schema.sql
python tools/normalize_colors.py  # привести цвета к id из React-каталога
```

### 8.2. Совместимость с клиентом `eklimiks/src/lib/api.js`

Бэкенд принимает как «канонические» snake_case-параметры из ТЗ, так и
camelCase-алиасы React-клиента:

| Клиент отправляет | Бэкенд понимает |
|---|---|
| `GET /products?minPrice=&maxPrice=&sort=price-asc` | `min_price`, `max_price`, `sort=price-asc` (и `price_asc`) |
| `POST /trade-in/estimate {model, condition, battery}` | `device_model`, `device_condition`, `battery_health` |
| `POST /repair-requests {serviceSlug, device, slotDate, slotTime, masterId}` | требуется `repair_service_id`, `device_model`, `master_slot_id` — см. примечание |
| `GET /masters/{id}/slots?date=` | ответ содержит и `slots[]` (объекты), и `times[]` (строки «ЧЧ:ММ») |
| `GET /products/{slug}` | ответ содержит `data`, `related` и дубли полей верхнего уровня |

Дополнительно в ответах товара есть camelCase-алиасы `oldPrice`, `featured`,
`reviews`, `isActive`, а `ProductResource` отдаёт `rating`, `reviews_count`,
`colors`, `specs`, `images`, `stock`, `condition`.

> **Что осталось согласовать с фронтендом.** Локальный демо-слой
> `eklimiks/src/lib/api.js` рассчитан на другую форму данных:
> 1) он ждёт от `GET /products` **массив**, а Laravel отдаёт объект
>    с пагинацией `{ data: [...], meta: {...}, links: {...} }`;
> 2) корзина на фронтенде хранится объектами `{slug, storage, color, qty}`,
>    а API корзины (по ТЗ) работает с `{product_id, qty}`;
> 3) заявки на ремонт фронтенд отправляет с `serviceSlug`/`device`/`slotDate`/`slotTime`,
>    тогда как API принимает `repair_service_id`, `device_model`, `master_slot_id`.
>
> Это расхождение нужно закрыть на стороне фронтенда (адаптер в `api.js`)
> либо точечно расширить бэкенд — решение за ведущим агентом.


---

## 9. Деплой на VPS (vps.ktk-45.ru)

### 9.1. Получение сервера

1. Перейдите на **vps.ktk-45.ru** и авторизуйтесь (логин и пароль — на выданной карточке).
2. Создайте виртуальную машину (BM), имя — любое.
3. Нажмите **«Запустить»** и дождитесь появления **IP-адреса**.
4. Подключитесь по SSH (символы пароля при вводе не отображаются — это нормально):

```bash
ssh root@<ваш_IP_адрес>
```

### 9.2. Установка пакетов (Ubuntu 22.04 / 24.04)

```bash
apt update && apt upgrade -y

apt install -y nginx mysql-server \
  php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring php8.2-xml \
  php8.2-curl php8.2-zip php8.2-gd php8.2-bcmath php8.2-intl \
  unzip git composer ufw

php -v          # должно быть PHP 8.2 или выше
composer -V
```

> На Ubuntu 24.04 вместо `php8.2-*` доступны `php8.3-*` — Laravel 11 работает и с 8.3.
> Проверить версию: `apt policy php-fpm`.

### 9.3. Создание базы данных MySQL

```bash
mysql -u root
```

```sql
CREATE DATABASE eklimiks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'eklimiks'@'localhost' IDENTIFIED BY 'НадёжныйПароль123!';
GRANT ALL PRIVILEGES ON eklimiks.* TO 'eklimiks'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 9.4. Загрузка проекта на сервер

Вариант через Git:

```bash
mkdir -p /var/www/eklimiks
cd /var/www
git clone <АДРЕС_РЕПОЗИТОРИЯ> eklimiks
```

Вариант копированием с локальной машины (выполняется **на своём компьютере**):

```bash
scp -r "C:\Users\user1\Desktop\Сайт Eklimiks top\eklimiks-laravel" root@<IP>:/var/www/eklimiks
```

### 9.5. Настройка окружения

```bash
cd /var/www/eklimiks
cp .env.example .env
nano .env
```

Продакшн-значения:

```env
APP_NAME="EKlimiks"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://<IP-адрес-сервера>
FRONTEND_URL=http://<IP-адрес-сервера>

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eklimiks
DB_USERNAME=eklimiks
DB_PASSWORD=НадёжныйПароль123!

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync

CORS_ALLOWED_ORIGINS=http://<IP-адрес-сервера>
SANCTUM_STATEFUL_DOMAINS=<IP-адрес-сервера>
```

### 9.6. Установка зависимостей и миграции

```bash
cd /var/www/eklimiks

composer install --no-dev --optimize-autoloader

php artisan key:generate
php artisan migrate --force --seed

# либо вместо миграций — импорт готового дампа:
# mysql -u eklimiks -p eklimiks < database/schema.sql

php artisan storage:link
```

### 9.7. Права доступа

```bash
chown -R www-data:www-data /var/www/eklimiks
find /var/www/eklimiks -type d -exec chmod 755 {} \;
find /var/www/eklimiks -type f -exec chmod 644 {} \;
chmod -R 775 /var/www/eklimiks/storage /var/www/eklimiks/bootstrap/cache
```

### 9.8. Сборка React-фронтенда и копирование в public

**На локальной машине** в папке `eklimiks/`:

```bash
npm install
npm run build          # создаётся папка dist/
```

Затем переносим сборку и картинки на сервер:

```bash
scp -r "C:\Users\user1\Desktop\Сайт Eklimiks top\eklimiks\dist\*" root@<IP>:/var/www/eklimiks/public/
scp -r "C:\Users\user1\Desktop\Сайт Eklimiks top\eklimiks\public\img" root@<IP>:/var/www/eklimiks/public/
```

На сервере (если сборка делается там):

```bash
cd /var/www/eklimiks-frontend && npm ci && npm run build
cp -r dist/* /var/www/eklimiks/public/
```

### 9.9. Конфиг nginx

Создайте файл `/etc/nginx/sites-available/eklimiks`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;                     # или домен, если он есть

    root /var/www/eklimiks/public;
    index index.php index.html;

    charset utf-8;
    client_max_body_size 20M;

    # Все API-запросы обслуживает Laravel (index.php)
    location ^~ /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ^~ /sanctum {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Собранное React SPA: любые адреса отдают index.html (роутинг на клиенте)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Статика отдаётся напрямую
    location ~* \.(?:webp|png|jpe?g|gif|svg|ico|woff2?|ttf|css|js|map)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;   # для 24.04: php8.3-fpm.sock
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_read_timeout 120;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    error_log  /var/log/nginx/eklimiks-error.log;
    access_log /var/log/nginx/eklimiks-access.log;
}
```

> Если статики фронтенда на сервере нет (`/index.html` отсутствует),
> замените `try_files $uri $uri/ /index.html;` на `try_files $uri $uri/ /index.php?$query_string;`.

Активируйте конфиг и перезапустите nginx:

```bash
ln -s /etc/nginx/sites-available/eklimiks /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
systemctl enable nginx php8.2-fpm
```

### 9.10. Кэширование и финальные команды

```bash
cd /var/www/eklimiks

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

sudo -u www-data php artisan storage:link
```

Проверка:

```bash
curl http://localhost/api/settings/public
curl http://<IP-адрес-сервера>/health
```

### 9.11. HTTPS через certbot (по желанию)

Если у вас есть домен, направленный на IP сервера:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
certbot renew --dry-run
```

После включения HTTPS обновите `.env`:

```env
APP_URL=https://ваш-домен.ru
FRONTEND_URL=https://ваш-домен.ru
CORS_ALLOWED_ORIGINS=https://ваш-домен.ru
SANCTUM_STATEFUL_DOMAINS=ваш-домен.ru
```

и выполните `php artisan config:cache`.

### 9.12. Обновление проекта

```bash
cd /var/www/eklimiks
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize
chown -R www-data:www-data storage bootstrap/cache
systemctl reload nginx php8.2-fpm
```

---

## 10. Частые проблемы

| Симптом | Решение |
|---|---|
| `SQLSTATE[HY000] [1049] Unknown database 'eklimiks'` | создайте базу `eklimiks` (см. 3.2) и проверьте `DB_DATABASE` в `.env` |
| `Access denied for user 'root'@'localhost'` | проверьте `DB_USERNAME`/`DB_PASSWORD`; в OSPanel у `root` обычно пустой пароль |
| `could not find driver` | включите расширение `pdo_mysql` в OSPanel (Настройки → PHP → Расширения) |
| `Class "Laravel\Sanctum\..." not found` | выполните `composer install` |
| Страница пустая, ошибка 500 | `APP_DEBUG=true`, затем `storage/logs/laravel.log` |
| Нет прав на запись | `chmod -R 775 storage bootstrap/cache` (Linux) |
| CORS-ошибка в браузере | добавьте адрес фронтенда в `CORS_ALLOWED_ORIGINS` и выполните `php artisan config:clear` |
| 401 при запросе из React | передавайте `Authorization: Bearer <token>` и заголовок `Accept: application/json` |
| 419 / CSRF при SPA-cookie | используйте Bearer-токен либо сначала вызовите `GET /sanctum/csrf-cookie` |
| Заказ не создаётся: «на складе осталось 0 шт.» | уменьшите количество — остаток проверяется на сервере |
| Слот занят (409) | обновите список слотов запросом `GET /api/masters/{id}/slots?date=...` |

---

## Лицензия

Учебный проект. Код можно свободно использовать в рамках дипломной работы.
Все названия продуктов Apple принадлежат Apple Inc. и приведены исключительно
в демонстрационных целях.
