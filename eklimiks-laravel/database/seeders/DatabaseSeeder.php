<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Основной сидер EKlimiks.
 * Запуск: php artisan migrate --seed
 * Порядок важен: сначала справочники, затем товары и связанные данные.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            UserSeeder::class,
            StoreSeeder::class,
            RepairServiceSeeder::class,
            ProductSeeder::class,
            MasterSeeder::class,
            MasterSlotSeeder::class,
            ReviewSeeder::class,
            SettingSeeder::class,
            PromoSeeder::class,
        ]);
    }
}
