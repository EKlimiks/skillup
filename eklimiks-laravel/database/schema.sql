-- ============================================================================
--  EKlimiks — схема базы данных интернет-магазина техники Apple
--  MySQL 8.0+ / MariaDB 10.4+   Кодировка: utf8mb4
-- ----------------------------------------------------------------------------
--  Использование в OSPanel / MySQL:
--    1) Создать базу:            CREATE DATABASE eklimiks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--    2) Импортировать этот файл: mysql -u root eklimiks < database/schema.sql
--       (в OSPanel: phpMyAdmin → база eklimiks → Импорт → выбрать schema.sql)
--    3) В .env указать DB_DATABASE=eklimiks
--
--  Файл полностью заменяет `php artisan migrate --seed`:
--  создаёт все таблицы и заполняет их демонстрационными данными.
--
--  ВНИМАНИЕ: скрипт удаляет существующие таблицы с такими же именами.
--
--  Тестовые учётные записи (пароли захешированы bcrypt):
--    admin@eklimiks.ru   / admin123    — администратор
--    manager@eklimiks.ru / manager123  — менеджер
--    client@eklimiks.ru  / client123   — клиент
--
--  Хеши ниже соответствуют именно этим паролям. Если после импорта вход
--  не выполняется — сгенерируйте свой хеш и подставьте его в INSERT:
--    php artisan tinker
--    >>> Illuminate\Support\Facades\Hash::make('admin123')
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+03:00';

-- ----------------------------------------------------------------------------
-- Удаление таблиц (порядок обратный зависимостям)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `promos`;
DROP TABLE IF EXISTS `leads`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `trade_ins`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `repair_requests`;
DROP TABLE IF EXISTS `repair_services`;
DROP TABLE IF EXISTS `master_slots`;
DROP TABLE IF EXISTS `masters`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `stores`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `personal_access_tokens`;
DROP TABLE IF EXISTS `failed_jobs`;
DROP TABLE IF EXISTS `job_batches`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `cache_locks`;
DROP TABLE IF EXISTS `cache`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `users`;

-- ============================================================================
-- 1. Пользователи и системные таблицы Laravel
-- ============================================================================

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(32) NULL DEFAULT NULL,
  `role` ENUM('client','manager','admin') NOT NULL DEFAULT 'client',
  `bonus_points` INT NOT NULL DEFAULT 0,
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_index` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL DEFAULT NULL,
  `payload` LONGTEXT NOT NULL,
  `last_activity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache` (
  `key` VARCHAR(255) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` VARCHAR(255) NOT NULL,
  `owner` VARCHAR(255) NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `attempts` TINYINT UNSIGNED NOT NULL,
  `reserved_at` INT UNSIGNED NULL DEFAULT NULL,
  `available_at` INT UNSIGNED NOT NULL,
  `created_at` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `total_jobs` INT NOT NULL,
  `pending_jobs` INT NOT NULL,
  `failed_jobs` INT NOT NULL,
  `failed_job_ids` LONGTEXT NOT NULL,
  `options` MEDIUMTEXT NULL DEFAULT NULL,
  `cancelled_at` INT NULL DEFAULT NULL,
  `created_at` INT NOT NULL,
  `finished_at` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(255) NOT NULL,
  `connection` TEXT NOT NULL,
  `queue` TEXT NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `exception` LONGTEXT NOT NULL,
  `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `abilities` TEXT NULL DEFAULT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. Каталог: категории и товары
-- ============================================================================

CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(255) NULL DEFAULT NULL,
  `sort` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  KEY `categories_sort_index` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL DEFAULT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `old_price` DECIMAL(10,2) NULL DEFAULT NULL,
  `condition` ENUM('new','refurbished') NOT NULL DEFAULT 'new',
  `storage` VARCHAR(64) NULL DEFAULT NULL,
  `colors` JSON NULL DEFAULT NULL,
  `specs` JSON NULL DEFAULT NULL,
  `images` JSON NULL DEFAULT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  `reviews_count` INT NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_category_id_is_active_index` (`category_id`,`is_active`),
  KEY `products_price_index` (`price`),
  KEY `products_condition_index` (`condition`),
  KEY `products_is_featured_index` (`is_featured`),
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. Магазины (точки самовывоза)
-- ============================================================================

CREATE TABLE `stores` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `work_hours` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. Заказы и позиции заказов
-- ============================================================================

CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `number` VARCHAR(255) NOT NULL,
  `status` ENUM('new','confirmed','assembled','delivered','cancelled') NOT NULL DEFAULT 'new',
  `total` DECIMAL(10,2) NOT NULL,
  `delivery_type` ENUM('pickup','courier') NOT NULL DEFAULT 'pickup',
  `address` VARCHAR(255) NULL DEFAULT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(32) NOT NULL,
  `comment` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_number_unique` (`number`),
  KEY `orders_user_id_status_index` (`user_id`,`status`),
  KEY `orders_status_index` (`status`),
  CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_product_id_index` (`product_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. Сервисный центр: мастера, слоты, услуги, заявки
-- ============================================================================

CREATE TABLE `masters` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `specialization` VARCHAR(255) NOT NULL,
  `experience_years` INT NOT NULL DEFAULT 0,
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `masters_is_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `master_slots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `master_id` BIGINT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `is_booked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `master_slots_unique` (`master_id`,`date`,`time`),
  KEY `master_slots_master_id_date_is_booked_index` (`master_id`,`date`,`is_booked`),
  CONSTRAINT `master_slots_master_id_foreign` FOREIGN KEY (`master_id`) REFERENCES `masters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repair_services` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `price_from` DECIMAL(10,2) NOT NULL,
  `duration_minutes` INT NOT NULL DEFAULT 60,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `repair_services_slug_unique` (`slug`),
  KEY `repair_services_price_from_index` (`price_from`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repair_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `repair_service_id` BIGINT UNSIGNED NOT NULL,
  `master_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `master_slot_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `device_model` VARCHAR(255) NOT NULL,
  `issue` TEXT NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(32) NOT NULL,
  `status` ENUM('new','diagnostics','approved','in_progress','ready','done','cancelled') NOT NULL DEFAULT 'new',
  `price` DECIMAL(10,2) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `repair_requests_status_created_at_index` (`status`,`created_at`),
  KEY `repair_requests_user_id_index` (`user_id`),
  KEY `repair_requests_repair_service_id_foreign` (`repair_service_id`),
  KEY `repair_requests_master_id_foreign` (`master_id`),
  KEY `repair_requests_master_slot_id_foreign` (`master_slot_id`),
  CONSTRAINT `repair_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `repair_requests_repair_service_id_foreign` FOREIGN KEY (`repair_service_id`) REFERENCES `repair_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `repair_requests_master_id_foreign` FOREIGN KEY (`master_id`) REFERENCES `masters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `repair_requests_master_slot_id_foreign` FOREIGN KEY (`master_slot_id`) REFERENCES `master_slots` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. Бронирование визита в магазин
-- ============================================================================

CREATE TABLE `bookings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `store_id` BIGINT UNSIGNED NOT NULL,
  `slot_date` DATE NOT NULL,
  `slot_time` TIME NOT NULL,
  `status` ENUM('new','confirmed','completed','cancelled') NOT NULL DEFAULT 'new',
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(32) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookings_store_slot_unique` (`store_id`,`slot_date`,`slot_time`),
  KEY `bookings_user_id_status_index` (`user_id`,`status`),
  KEY `bookings_product_id_foreign` (`product_id`),
  CONSTRAINT `bookings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. Trade-In
-- ============================================================================

CREATE TABLE `trade_ins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `device_model` VARCHAR(255) NOT NULL,
  `storage` VARCHAR(64) NULL DEFAULT NULL,
  `device_condition` ENUM('perfect','good','fair','broken') NOT NULL,
  `battery_health` INT NULL DEFAULT NULL,
  `estimated_price` DECIMAL(10,2) NOT NULL,
  `final_price` DECIMAL(10,2) NULL DEFAULT NULL,
  `status` ENUM('new','evaluated','accepted','rejected','completed') NOT NULL DEFAULT 'new',
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(32) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `trade_ins_status_created_at_index` (`status`,`created_at`),
  KEY `trade_ins_user_id_foreign` (`user_id`),
  CONSTRAINT `trade_ins_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. Отзывы, лиды, промокоды, настройки, избранное
-- ============================================================================

CREATE TABLE `reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `author_name` VARCHAR(255) NOT NULL,
  `rating` TINYINT NOT NULL DEFAULT 5,
  `text` TEXT NOT NULL,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reviews_product_id_is_approved_index` (`product_id`,`is_approved`),
  KEY `reviews_is_approved_index` (`is_approved`),
  KEY `reviews_user_id_foreign` (`user_id`),
  CONSTRAINT `reviews_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leads` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `type` ENUM('callback','question','trade_in','repair') NOT NULL DEFAULT 'callback',
  `message` TEXT NULL DEFAULT NULL,
  `status` ENUM('new','in_progress','done') NOT NULL DEFAULT 'new',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leads_status_type_index` (`status`,`type`),
  KEY `leads_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `promos` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255) NOT NULL,
  `discount_percent` TINYINT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `promos_code_unique` (`code`),
  KEY `promos_is_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(255) NOT NULL,
  `value` TEXT NULL DEFAULT NULL,
  `group` VARCHAR(64) NOT NULL DEFAULT 'common',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`),
  KEY `settings_group_index` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_user_product_unique` (`user_id`,`product_id`),
  KEY `favorites_product_id_foreign` (`product_id`),
  CONSTRAINT `favorites_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
--  ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Пользователи (пароли: admin123 / manager123 / client123)
-- ----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `bonus_points`, `created_at`, `updated_at`) VALUES
(1, 'Алексей Екимов', 'admin@eklimiks.ru', '$2y$12$vvY7BGcR.6CQ0U0Np9WOQeY2zr6iDjQKjDqKfTHU4kqU8CJZzFyBa', '+7 (3522) 45-67-89', 'admin', 0, NOW(), NOW()),
(2, 'Марина Соколова', 'manager@eklimiks.ru', '$2y$12$vvY7BGcR.6CQ0U0Np9WOQeY2zr6iDjQKjDqKfTHU4kqU8CJZzFyBa', '+7 (3522) 45-67-90', 'manager', 0, NOW(), NOW()),
(3, 'Иван Петров', 'client@eklimiks.ru', '$2y$12$vvY7BGcR.6CQ0U0Np9WOQeY2zr6iDjQKjDqKfTHU4kqU8CJZzFyBa', '+7 (916) 555-12-34', 'client', 1250, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Категории
-- ----------------------------------------------------------------------------
INSERT INTO `categories` (`id`, `slug`, `name`, `icon`, `sort`, `created_at`, `updated_at`) VALUES
(1, 'iphone', 'iPhone', 'iphone', 1, NOW(), NOW()),
(2, 'mac', 'Mac', 'macbook', 2, NOW(), NOW()),
(3, 'ipad', 'iPad', 'ipad', 3, NOW(), NOW()),
(4, 'watch', 'Apple Watch', 'watch', 4, NOW(), NOW()),
(5, 'audio', 'Аудио', 'airpods', 5, NOW(), NOW()),
(6, 'tv', 'TV и Дом', 'tv', 6, NOW(), NOW()),
(7, 'vision', 'Vision Pro', 'vision', 7, NOW(), NOW()),
(8, 'accessories', 'Аксессуары', 'accessory', 8, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Товары (представительная выборка каталога; полный список — ProductSeeder)
-- ----------------------------------------------------------------------------
INSERT INTO `products`
(`id`, `category_id`, `slug`, `name`, `subtitle`, `description`, `price`, `old_price`, `condition`, `storage`, `colors`, `specs`, `images`, `stock`, `rating`, `reviews_count`, `is_featured`, `is_active`, `created_at`, `updated_at`)
VALUES
(1, 1, 'iphone-18-pro-max', 'iPhone 18 Pro Max', '6,9" Super Retina XDR, чип A20 Pro',
 'Флагман Apple 2026 года. Титан Grade 5, дисплей ProMotion 120 Гц с пиковой яркостью 3000 нит, тройная камера 48 Мп с тетрапризмой и 8-кратным оптическим зумом. Чип A20 Pro на 2-нм техпроцессе, поддержка Apple Intelligence и спутниковой связи.',
 154990.00, 169990.00, 'new', '256 ГБ',
 '[{"id":"black","name":"Чёрный","hex":"#1d1d1f"},{"id":"burgundy","name":"Бордовый","hex":"#6d2b34"},{"id":"glacier","name":"Ледяной","hex":"#d7dee4"}]',
 '[{"key":"Чип","value":"A20 Pro, 6 ядер CPU / 6 ядер GPU"},{"key":"Дисплей","value":"6,9\\" Super Retina XDR, ProMotion 1–120 Гц"},{"key":"Камера","value":"48 Мп + 48 Мп + 48 Мп, тетрапризма, 8× зум"},{"key":"Аккумулятор","value":"до 39 часов видео"},{"key":"Материал","value":"Титан Grade 5, Ceramic Shield 2"}]',
 '["img/products/iphone-18-pro-max--black.webp","img/products/iphone-18-pro-max--burgundy.webp","img/products/iphone-18-pro-max--glacier.webp"]',
 14, 5.0, 3, 1, 1, NOW(), NOW()),

(2, 1, 'iphone-18-pro', 'iPhone 18 Pro', '6,3" Super Retina XDR, чип A20 Pro',
 'Компактный флагман с титановым корпусом, дисплеем 6,3" ProMotion и той же тройной камерой 48 Мп, что и у Pro Max. Чип A20 Pro, полный набор функций Apple Intelligence и защита IP68.',
 139990.00, 149990.00, 'new', '256 ГБ',
 '[{"id":"black","name":"Чёрный","hex":"#1d1d1f"},{"id":"burgundy","name":"Бордовый","hex":"#6d2b34"},{"id":"glacier","name":"Ледяной","hex":"#d7dee4"},{"id":"silver","name":"Серебристый","hex":"#e2e3e5"}]',
 '[{"key":"Чип","value":"A20 Pro"},{"key":"Дисплей","value":"6,3\\" Super Retina XDR, ProMotion 120 Гц"},{"key":"Камера","value":"48 Мп + 48 Мп + 48 Мп, 5× зум"},{"key":"Аккумулятор","value":"до 33 часов видео"},{"key":"Защита","value":"IP68, Ceramic Shield 2"}]',
 '["img/products/iphone-18-pro--black.webp","img/products/iphone-18-pro--burgundy.webp","img/products/iphone-18-pro--glacier.webp","img/products/iphone-18-pro--silver.webp"]',
 21, 4.9, 1, 1, 1, NOW(), NOW()),

(3, 1, 'iphone-duo', 'iPhone Duo', 'Первый складной iPhone, 7,8" внутри',
 'Первый складной iPhone: внешний дисплей 5,5" и внутренний 7,8" без видимой складки. Шарнир на 400 000 циклов, чип A20, две камеры 48 Мп и режим Flex для многозадачности.',
 219990.00, NULL, 'new', '512 ГБ',
 '[{"id":"nightsky","name":"Ночное небо","hex":"#2b3049"},{"id":"starwhite","name":"Звёздный белый","hex":"#f1efe9"}]',
 '[{"key":"Чип","value":"A20"},{"key":"Дисплей","value":"Внешний 5,5\\" + внутренний 7,8\\" 120 Гц"},{"key":"Камера","value":"48 Мп + 48 Мп"},{"key":"Аккумулятор","value":"до 30 часов видео"},{"key":"Шарнир","value":"400 000 циклов складывания"}]',
 '["img/products/iphone-duo--nightsky.webp","img/products/iphone-duo--starwhite.webp"]',
 7, 4.8, 1, 1, 1, NOW(), NOW()),

(4, 1, 'iphone-air', 'iPhone Air', '5,6 мм и 158 г — самый тонкий iPhone',
 'Самый тонкий iPhone в истории: корпус 5,6 мм из титана, вес 158 г. Дисплей 6,5" ProMotion, чип A19 Pro и поддержка MagSafe. Идеален для тех, кто ценит легкость и дизайн.',
 119990.00, 129990.00, 'new', '256 ГБ',
 '[{"id":"cloudwhite","name":"Облачный белый","hex":"#f3f1ed"},{"id":"lightgold","name":"Светлое золото","hex":"#e7d8bf"},{"id":"skyblue","name":"Небесно-голубой","hex":"#cfe0ea"},{"id":"spaceblack","name":"Космический чёрный","hex":"#2f2f31"}]',
 '[{"key":"Чип","value":"A19 Pro"},{"key":"Дисплей","value":"6,5\\" Super Retina XDR, 120 Гц"},{"key":"Толщина","value":"5,6 мм"},{"key":"Вес","value":"158 г"},{"key":"Аккумулятор","value":"до 27 часов видео"}]',
 '["img/products/iphone-air--cloudwhite.webp","img/products/iphone-air--lightgold.webp","img/products/iphone-air--skyblue.webp","img/products/iphone-air--spaceblack.webp"]',
 18, 4.8, 0, 0, 1, NOW(), NOW()),

(5, 1, 'iphone-17', 'iPhone 17', '6,3" ProMotion, чип A19',
 'Базовый iPhone с долгожданным дисплеем ProMotion 120 Гц, двойной камерой 48 Мп и чипом A19. Отличный баланс цены и возможностей.',
 89990.00, 99990.00, 'new', '128 ГБ',
 '[{"id":"black","name":"Чёрный","hex":"#1d1d1f"},{"id":"lavender","name":"Лавандовый","hex":"#d8cee7"},{"id":"mistblue","name":"Дымчато-синий","hex":"#b8cddd"},{"id":"sage","name":"Шалфейный","hex":"#ccd5c3"},{"id":"white","name":"Белый","hex":"#f4f4f4"}]',
 '[{"key":"Чип","value":"A19"},{"key":"Дисплей","value":"6,3\\" Super Retina XDR, ProMotion 120 Гц"},{"key":"Камера","value":"48 Мп + 12 Мп ультраширокоугольная"},{"key":"Аккумулятор","value":"до 26 часов видео"}]',
 '["img/products/iphone-17--black.webp","img/products/iphone-17--lavender.webp","img/products/iphone-17--mistblue.webp","img/products/iphone-17--sage.webp","img/products/iphone-17--white.webp"]',
 34, 4.7, 0, 1, 1, NOW(), NOW()),

(6, 1, 'iphone-16', 'iPhone 16', '6,1" Super Retina XDR, чип A18',
 'Проверенная модель с чипом A18, кнопкой управления камерой и поддержкой Apple Intelligence. Хороший выбор с привлекательной ценой.',
 69990.00, 79990.00, 'new', '128 ГБ',
 '[{"id":"black","name":"Чёрный","hex":"#1d1d1f"},{"id":"pink","name":"Розовый","hex":"#efc1cd"},{"id":"teal","name":"Бирюзовый","hex":"#a7cec7"},{"id":"ultramarine","name":"Ультрамарин","hex":"#7a8bdf"},{"id":"white","name":"Белый","hex":"#f4f4f4"}]',
 '[{"key":"Чип","value":"A18"},{"key":"Дисплей","value":"6,1\\" Super Retina XDR"},{"key":"Камера","value":"48 Мп + 12 Мп"},{"key":"Аккумулятор","value":"до 22 часов видео"}]',
 '["img/products/iphone-16--black.webp","img/products/iphone-16--pink.webp","img/products/iphone-16--teal.webp","img/products/iphone-16--ultramarine.webp","img/products/iphone-16--white.webp"]',
 27, 4.7, 0, 0, 1, NOW(), NOW()),

(7, 1, 'iphone-16e', 'iPhone 16e', 'Самый доступный iPhone с Face ID',
 'Компактный iPhone с чипом A18, дисплеем 6,1" OLED, Face ID и камерой 48 Мп. Минимум лишнего — максимум производительности за свои деньги.',
 54990.00, NULL, 'new', '128 ГБ',
 '[{"id":"black","name":"Чёрный","hex":"#1d1d1f"},{"id":"white","name":"Белый","hex":"#f4f4f4"}]',
 '[{"key":"Чип","value":"A18"},{"key":"Дисплей","value":"6,1\\" OLED"},{"key":"Камера","value":"48 Мп"},{"key":"Аккумулятор","value":"до 26 часов видео"}]',
 '["img/products/iphone-16e--black.webp","img/products/iphone-16e--white.webp"]',
 38, 4.5, 0, 0, 1, NOW(), NOW()),

(8, 2, 'macbook-pro-16', 'MacBook Pro 16" M5 Pro', '16,2" Liquid Retina XDR, M5 Pro, 24 ГБ',
 'Профессиональный ноутбук для монтажа, 3D и разработки. Чип M5 Pro с 14 ядрами CPU и 20 ядрами GPU, дисплей Liquid Retina XDR 1600 нит, три порта Thunderbolt 5 и до 24 часов автономной работы.',
 329990.00, 359990.00, 'new', '1 ТБ SSD',
 '[{"id":"spaceblack","name":"Космический чёрный","hex":"#2f2f31"},{"id":"silver","name":"Серебристый","hex":"#e2e3e5"}]',
 '[{"key":"Чип","value":"Apple M5 Pro, 14 CPU / 20 GPU"},{"key":"Память","value":"24 ГБ объединённой памяти"},{"key":"Дисплей","value":"16,2\\" Liquid Retina XDR, 120 Гц, 1600 нит"},{"key":"Накопитель","value":"1 ТБ SSD"},{"key":"Автономность","value":"до 24 часов"}]',
 '["img/products/macbook-pro-16--spaceblack.webp","img/products/macbook-pro-16--silver.webp"]',
 9, 5.0, 1, 1, 1, NOW(), NOW()),

(9, 2, 'macbook-air-13', 'MacBook Air 13" M5', '13,6" Liquid Retina, M5, 16 ГБ',
 'Самый популярный Mac: тонкий корпус, чип M5, дисплей 13,6" Liquid Retina и до 20 часов работы. Идеален для учёбы, офиса и путешествий.',
 139990.00, 149990.00, 'new', '256 ГБ SSD',
 '[{"id":"midnight","name":"Полночный","hex":"#24272f"},{"id":"starlight","name":"Звёздный свет","hex":"#e8e1d5"},{"id":"skyblue","name":"Небесно-голубой","hex":"#cfe0ea"},{"id":"silver","name":"Серебристый","hex":"#e2e3e5"}]',
 '[{"key":"Чип","value":"Apple M5"},{"key":"Память","value":"16 ГБ"},{"key":"Дисплей","value":"13,6\\" Liquid Retina"},{"key":"Накопитель","value":"256 ГБ SSD"},{"key":"Вес","value":"1,24 кг"}]',
 '["img/products/macbook-air-13--midnight.webp","img/products/macbook-air-13--silver.webp","img/products/macbook-air-13--skyblue.webp","img/products/macbook-air-13--starlight.webp"]',
 31, 4.9, 1, 1, 1, NOW(), NOW()),

(10, 2, 'imac-24', 'iMac 24" M5', '24" 4,5K Retina, M5, 7 цветов',
 'Моноблок с дисплеем 4,5K Retina на 24 дюйма, чипом M5 и камерой Center Stage 12 Мп. Семь ярких цветов корпуса, в комплекте клавиатура и мышь Magic.',
 179990.00, NULL, 'new', '512 ГБ SSD',
 '[{"id":"blue","name":"Голубой","hex":"#a8c3dc"},{"id":"orange","name":"Оранжевый","hex":"#efa05a"},{"id":"pink","name":"Розовый","hex":"#efc1cd"},{"id":"purple","name":"Фиолетовый","hex":"#cab7dc"},{"id":"green","name":"Зелёный","hex":"#a7d4b4"},{"id":"yellow","name":"Жёлтый","hex":"#efde9f"}]',
 '[{"key":"Чип","value":"Apple M5, 10 CPU / 10 GPU"},{"key":"Дисплей","value":"24\\" 4,5K Retina, 500 нит"},{"key":"Память","value":"16 ГБ"},{"key":"Накопитель","value":"512 ГБ SSD"},{"key":"Камера","value":"12 Мп Center Stage"}]',
 '["img/products/imac-24--blue.webp","img/products/imac-24--green.webp","img/products/imac-24--orange.webp","img/products/imac-24--pink.webp","img/products/imac-24--purple.webp","img/products/imac-24--yellow.webp"]',
 11, 4.8, 0, 0, 1, NOW(), NOW()),

(11, 3, 'ipad-pro-13', 'iPad Pro 13" M5', '13" Ultra Retina XDR, M5, Tandem OLED',
 'Самый мощный планшет Apple: двухслойный OLED Tandem, чип M5, поддержка Apple Pencil Pro и Magic Keyboard. Толщина всего 5,1 мм.',
 149990.00, 159990.00, 'new', '256 ГБ',
 '[{"id":"spaceblack","name":"Космический чёрный","hex":"#2f2f31"},{"id":"silver","name":"Серебристый","hex":"#e2e3e5"}]',
 '[{"key":"Чип","value":"Apple M5"},{"key":"Дисплей","value":"13\\" Ultra Retina XDR, Tandem OLED, 120 Гц"},{"key":"Накопитель","value":"256 ГБ"},{"key":"Толщина","value":"5,1 мм"},{"key":"Аксессуары","value":"Apple Pencil Pro, Magic Keyboard"}]',
 '["img/products/ipad-pro-13--silver.webp","img/products/ipad-pro-13--spaceblack.webp"]',
 13, 4.9, 1, 1, 1, NOW(), NOW()),

(12, 4, 'watch-ultra', 'Apple Watch Ultra 4', '49 мм, титан, LTE, спутник',
 'Самые защищённые часы Apple: титановый корпус 49 мм, дисплей 3000 нит, автономность до 72 часов в режиме энергосбережения и экстренная спутниковая связь.',
 89990.00, NULL, 'new', '64 ГБ',
 '[{"id":"natural","name":"Натуральный титан","hex":"#cec5b7"}]',
 '[{"key":"Корпус","value":"49 мм, титан Grade 5"},{"key":"Дисплей","value":"LTPO3 OLED, 3000 нит"},{"key":"Автономность","value":"до 72 часов"},{"key":"Датчики","value":"ЭКГ, SpO2, глубина 40 м, температура"},{"key":"Связь","value":"LTE, спутник, Wi-Fi 6E"}]',
 '["img/products/watch-ultra--natural.webp"]',
 10, 4.9, 1, 1, 1, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Магазины
-- ----------------------------------------------------------------------------
INSERT INTO `stores` (`id`, `name`, `address`, `phone`, `work_hours`, `created_at`, `updated_at`) VALUES
(1, 'EKlimiks на Гоголя', 'Курган, ул. Гоголя, 55', '+7 (3522) 45-67-89', 'Пн–Вс 10:00–21:00', NOW(), NOW()),
(2, 'EKlimiks в Заозёрном', 'Курган, ул. Коли Мяготина, 78', '+7 (3522) 45-67-90', 'Пн–Вс 10:00–22:00', NOW(), NOW()),
(3, 'EKlimiks на Машиностроителей', 'Курган, пр. Машиностроителей, 21', '+7 (3522) 45-67-91', 'Пн–Сб 10:00–20:00', NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Услуги сервисного центра
-- ----------------------------------------------------------------------------
INSERT INTO `repair_services` (`id`, `slug`, `name`, `description`, `price_from`, `duration_minutes`, `created_at`, `updated_at`) VALUES
(1, 'zamena-displeya-iphone', 'Замена дисплея iPhone', 'Оригинальный модуль дисплея Apple, калибровка True Tone, гарантия 12 месяцев. Работа занимает около двух часов.', 12990.00, 120, NOW(), NOW()),
(2, 'zamena-akkumulyatora', 'Замена аккумулятора', 'Замена АКБ на оригинальную батарею Apple с проверкой ёмкости до и после ремонта. Для iPhone, iPad и MacBook.', 5990.00, 60, NOW(), NOW()),
(3, 'remont-posle-popadaniya-vody', 'Ремонт после попадания воды', 'Полная разборка, ультразвуковая чистка платы, замена повреждённых компонентов и проверка всех узлов устройства.', 8900.00, 180, NOW(), NOW()),
(4, 'chip-reball-macbook', 'Компонентный ремонт MacBook', 'Диагностика и ремонт материнской платы MacBook: реболлинг чипов, восстановление цепей питания, замена контроллеров.', 15900.00, 240, NOW(), NOW()),
(5, 'zamena-stekla-ipad', 'Замена стекла iPad', 'Замена тач-стекла планшета с сохранением оригинального дисплея. Клей OCA, профессиональная ламинация.', 9900.00, 150, NOW(), NOW()),
(6, 'diagnostika-ustroystva', 'Диагностика устройства', 'Аппаратная и программная диагностика 40 минут. При согласии на ремонт стоимость диагностики не берётся.', 0.00, 40, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Мастера
-- ----------------------------------------------------------------------------
INSERT INTO `masters` (`id`, `name`, `specialization`, `experience_years`, `rating`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Дмитрий Ковалёв', 'Ремонт iPhone', 9, 4.9, 1, NOW(), NOW()),
(2, 'Артём Сафин', 'Ремонт Mac и MacBook', 12, 5.0, 1, NOW(), NOW()),
(3, 'Елена Морозова', 'Ремонт iPad и Apple Watch', 6, 4.8, 1, NOW(), NOW()),
(4, 'Сергей Лапин', 'Диагностика и компонентный ремонт', 14, 4.9, 1, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Свободные слоты мастеров: сегодня, завтра и послезавтра, 10:00–19:00
-- (в сидере MasterSlotSeeder расписание строится на 14 дней вперёд)
-- ----------------------------------------------------------------------------
INSERT INTO `master_slots` (`master_id`, `date`, `time`, `is_booked`, `created_at`, `updated_at`) VALUES
(1, CURDATE(), '10:00:00', 0, NOW(), NOW()),
(1, CURDATE(), '11:00:00', 0, NOW(), NOW()),
(1, CURDATE(), '12:00:00', 0, NOW(), NOW()),
(1, CURDATE(), '13:00:00', 1, NOW(), NOW()),
(1, CURDATE(), '14:00:00', 0, NOW(), NOW()),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 0, NOW(), NOW()),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 1, NOW(), NOW()),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 0, NOW(), NOW()),
(1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 0, NOW(), NOW()),
(1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:00:00', 0, NOW(), NOW()),
(2, CURDATE(), '10:00:00', 0, NOW(), NOW()),
(2, CURDATE(), '12:00:00', 0, NOW(), NOW()),
(2, CURDATE(), '16:00:00', 1, NOW(), NOW()),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 0, NOW(), NOW()),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:00:00', 0, NOW(), NOW()),
(2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 0, NOW(), NOW()),
(2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '17:00:00', 0, NOW(), NOW()),
(3, CURDATE(), '11:00:00', 0, NOW(), NOW()),
(3, CURDATE(), '14:00:00', 0, NOW(), NOW()),
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 0, NOW(), NOW()),
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 1, NOW(), NOW()),
(3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '13:00:00', 0, NOW(), NOW()),
(3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '18:00:00', 0, NOW(), NOW()),
(4, CURDATE(), '10:00:00', 0, NOW(), NOW()),
(4, CURDATE(), '15:00:00', 0, NOW(), NOW()),
(4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', 0, NOW(), NOW()),
(4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:00:00', 1, NOW(), NOW()),
(4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 0, NOW(), NOW()),
(4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '16:00:00', 0, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Настройки сайта
-- ----------------------------------------------------------------------------
INSERT INTO `settings` (`key`, `value`, `group`, `created_at`, `updated_at`) VALUES
('site_name', 'EKlimiks', 'common', NOW(), NOW()),
('site_tagline', 'Только техника Apple. Оригинал, гарантия, Trade-In.', 'common', NOW(), NOW()),
('site_description', 'EKlimiks — фирменный магазин техники Apple: iPhone, Mac, iPad, Apple Watch, AirPods, Vision Pro и аксессуары. Trade-In, ремонт и бронирование визита в магазин.', 'common', NOW(), NOW()),
('currency', '₽', 'common', NOW(), NOW()),
('bonus_percent', '2', 'common', NOW(), NOW()),
('bonus_max_pay_percent', '30', 'common', NOW(), NOW()),
('meta_title', 'EKlimiks — магазин техники Apple в Кургане', 'common', NOW(), NOW()),
('meta_description', 'Купить iPhone, MacBook, iPad, Apple Watch и AirPods с официальной гарантией. Trade-In, ремонт и бронирование визита в магазин EKlimiks.', 'common', NOW(), NOW()),
('phone', '+7 (3522) 45-67-89', 'contacts', NOW(), NOW()),
('email', 'shop@eklimiks.ru', 'contacts', NOW(), NOW()),
('address', 'г. Курган, ул. Тверская, 18, ТЦ «Галерея», 2 этаж', 'contacts', NOW(), NOW()),
('work_hours', 'Ежедневно с 10:00 до 21:00', 'contacts', NOW(), NOW()),
('telegram', '@eklimiks_store', 'contacts', NOW(), NOW()),
('whatsapp', '+7 (916) 555-12-34', 'contacts', NOW(), NOW()),
('vk', 'vk.com/eklimiks', 'contacts', NOW(), NOW()),
('delivery_text', 'Самовывоз из магазина — бесплатно, уже через 2 часа после подтверждения. Курьером по Кургане — 490 ₽, в пределах МКАД на следующий день. По России — СДЭК от 390 ₽, 2–5 рабочих дней.', 'delivery', NOW(), NOW()),
('delivery_courier_price', '490', 'delivery', NOW(), NOW()),
('delivery_free_from', '50000', 'delivery', NOW(), NOW()),
('pickup_text', 'Заберите заказ в одном из двух магазинов EKlimiks в Кургане. Проверим устройство вместе с вами и поможем с настройкой.', 'delivery', NOW(), NOW()),
('warranty_text', 'Официальная гарантия Apple 12 месяцев на все устройства. Собственный сервисный центр EKlimiks: ремонт по записи, оригинальные запчасти.', 'delivery', NOW(), NOW()),
('about_text', 'EKlimiks работает с 2019 года и продаёт только технику Apple. Мы не торгуем серыми поставками: каждое устройство проходит проверку по серийному номеру, а Trade-In и ремонт выполняем в собственном сервисном центре.', 'text', NOW(), NOW()),
('trade_in_text', 'Оцените своё устройство онлайн за минуту и получите скидку на новое. Принимаем iPhone, iPad, Mac, Apple Watch и AirPods в любом состоянии — от идеального до требующего ремонта.', 'text', NOW(), NOW()),
('repair_text', 'Онлайн-запись в сервисный центр: выберите услугу, мастера и удобное свободное время. Диагностика бесплатна при согласии на ремонт.', 'text', NOW(), NOW()),
('bonus_text', 'Начисляем 2% бонусами от суммы каждого заказа. 1 бонус = 1 ₽, оплатить бонусами можно до 30% покупки.', 'text', NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Промокоды
-- ----------------------------------------------------------------------------
INSERT INTO `promos` (`code`, `discount_percent`, `is_active`, `expires_at`, `created_at`, `updated_at`) VALUES
('EKLIMIKS10', 10, 1, DATE_ADD(NOW(), INTERVAL 3 MONTH), NOW(), NOW()),
('APPLE2026', 7, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
('STUDENT15', 15, 1, DATE_ADD(NOW(), INTERVAL 6 MONTH), NOW(), NOW());

-- ----------------------------------------------------------------------------
-- Отзывы (одобренные попадают на сайт, неодобренные ждут модерации в админке)
-- ----------------------------------------------------------------------------
INSERT INTO `reviews` (`user_id`, `product_id`, `author_name`, `rating`, `text`, `is_approved`, `created_at`, `updated_at`) VALUES
(3, 1, 'Иван Петров', 5, 'Перешёл с 16 Pro Max — разница ощутима. Камера с 8-кратным зумом снимает тексты с досок идеально, батарея держит два дня при активном использовании. В EKlimiks оформили Trade-In старого телефона за 15 минут.', 1, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(NULL, 1, 'Марина Соколова', 5, 'Заказывала в подарок мужу. Доставили курьером на следующий день, коробка запечатана, чек и гарантия в комплекте. Титан почти не собирает отпечатки, экран на солнце читается без проблем.', 1, DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 21 DAY)),
(NULL, 1, 'Андрей Л.', 4, 'Телефон отличный, но цена кусается. Зато в рассрочку на 12 месяцев вышло комфортно. Из минусов — новый чехол под тетрапризму пока найти сложно.', 1, DATE_SUB(NOW(), INTERVAL 33 DAY), DATE_SUB(NOW(), INTERVAL 33 DAY)),
(NULL, 2, 'Дмитрий Ковалёв', 5, 'Идеальный размер — в руке лежит лучше Max, а возможностей столько же. Снимаю видео в 4K 120 к/с, перегрева нет даже на улице.', 1, DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY)),
(NULL, 3, 'Ольга Северина', 5, 'Складной iPhone наконец-то вышел! Складка на внутреннем экране практически не видна под углом, шарнир плотный. Планшет и телефон в одном устройстве — для работы идеально.', 1, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 9, 'Иван Петров', 5, 'Взял для учёбы: 16 ГБ памяти и M5 тянут Docker, VS Code и десяток вкладок Chrome одновременно. Ноутбук холодный и абсолютно тихий.', 1, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
(NULL, 8, 'Артём Сафин', 5, 'Монтирую 8K в Final Cut — экспорт в два раза быстрее, чем на M3 Max. Экран 1600 нит позволяет работать у окна без внешнего монитора. Тяжёлый, но это цена мощности.', 1, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
(NULL, 11, 'Елена Морозова', 5, 'Tandem OLED — это космос: чёрный действительно чёрный, HDR в фильмах выглядит как в кинотеатре. С Apple Pencil Pro рисую прямо на планшете, задержки нет вообще.', 1, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
(NULL, 12, 'Сергей Лапин', 5, 'Бегаю марафоны, Ultra 4 держит 3 дня с GPS-тренировками. Спутниковая связь — та функция, которая однажды реально спасает. Экран читается на ярком солнце.', 1, DATE_SUB(NOW(), INTERVAL 27 DAY), DATE_SUB(NOW(), INTERVAL 27 DAY)),
(NULL, 10, 'Наталья Гринёва', 5, 'Купили iMac в офис — цвет корпуса радует глаз, экран 4,5K откалиброван из коробки. Дизайнеры довольны, шума от компьютера нет совсем.', 0, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Пересчёт рейтинга и количества отзывов по одобренным отзывам
UPDATE `products` p
SET p.`reviews_count` = (SELECT COUNT(*) FROM `reviews` r WHERE r.`product_id` = p.`id` AND r.`is_approved` = 1),
    p.`rating` = COALESCE((SELECT ROUND(AVG(r.`rating`), 1) FROM `reviews` r WHERE r.`product_id` = p.`id` AND r.`is_approved` = 1), 0);

-- ----------------------------------------------------------------------------
-- Пример лида из формы «Заказать звонок»
-- ----------------------------------------------------------------------------
INSERT INTO `leads` (`name`, `phone`, `type`, `message`, `status`, `created_at`, `updated_at`) VALUES
('Светлана', '+7 (903) 777-11-22', 'callback', 'Интересует iPhone 18 Pro Max в бордовом титане, есть ли в наличии?', 'new', NOW(), NOW()),
('Кирилл', '+7 (925) 341-08-55', 'trade_in', 'Хочу сдать iPhone 15 Pro 256 ГБ, состояние хорошее, батарея 91%.', 'in_progress', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ----------------------------------------------------------------------------
-- Пример заявки на ремонт с записью к мастеру
-- ----------------------------------------------------------------------------
INSERT INTO `repair_requests`
(`user_id`, `repair_service_id`, `master_id`, `master_slot_id`, `device_model`, `issue`, `customer_name`, `customer_phone`, `status`, `price`, `created_at`, `updated_at`)
VALUES
(3, 1, 1, (SELECT id FROM master_slots WHERE master_id = 1 AND is_booked = 1 ORDER BY date, time LIMIT 1),
 'iPhone 16 Pro', 'Разбит дисплей после падения, сенсор работает частично, требуется замена модуля.', 'Иван Петров', '+7 (916) 555-12-34', 'in_progress', 27990.00, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW());

-- ----------------------------------------------------------------------------
-- Пример заявки Trade-In
-- ----------------------------------------------------------------------------
INSERT INTO `trade_ins`
(`user_id`, `device_model`, `storage`, `device_condition`, `battery_health`, `estimated_price`, `final_price`, `status`, `customer_name`, `customer_phone`, `created_at`, `updated_at`)
VALUES
(3, 'iPhone 15 Pro', '256 ГБ', 'good', 91, 30388.00, NULL, 'evaluated', 'Иван Петров', '+7 (916) 555-12-34', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY));

-- ============================================================================
--  Готово. Проверить: SELECT COUNT(*) FROM products; SELECT * FROM settings;
-- ============================================================================
