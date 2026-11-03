-- SkillUp progress storage.
-- Applied directly because `php artisan migrate` is broken in this project
-- (Call to a member function make() on null), so the migration file in
-- database/migrations is documentation only.

CREATE TABLE IF NOT EXISTS `skillup_progress` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `progress` JSON NOT NULL,
  `client_updated_at` TIMESTAMP NULL DEFAULT NULL,
  `revision` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skillup_progress_user_unique` (`user_id`),
  CONSTRAINT `skillup_progress_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'table created' AS status;
DESCRIBE skillup_progress;
