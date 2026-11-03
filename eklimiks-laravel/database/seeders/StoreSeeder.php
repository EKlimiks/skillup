<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Seeder;

/**
 * Три салона EKlimiks в Кургане.
 */
class StoreSeeder extends Seeder
{
    public function run(): void
    {
        $stores = [
            [
                'name' => 'EKlimiks на Гоголя',
                'address' => 'Курган, ул. Гоголя, 55',
                'phone' => '+7 (3522) 45-67-89',
                'work_hours' => 'Пн–Вс 10:00–21:00',
            ],
            [
                'name' => 'EKlimiks в Заозёрном',
                'address' => 'Курган, ул. Коли Мяготина, 78',
                'phone' => '+7 (3522) 45-67-90',
                'work_hours' => 'Пн–Вс 10:00–22:00',
            ],
            [
                'name' => 'EKlimiks на Машиностроителей',
                'address' => 'Курган, пр. Машиностроителей, 21',
                'phone' => '+7 (3522) 45-67-91',
                'work_hours' => 'Пн–Сб 10:00–20:00',
            ],
        ];

        foreach ($stores as $store) {
            Store::query()->updateOrCreate(
                ['name' => $store['name']],
                $store
            );
        }
    }
}
