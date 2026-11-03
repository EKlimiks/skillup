<?php

namespace Database\Seeders;

use App\Models\Master;
use Illuminate\Database\Seeder;

/**
 * Мастера сервисного центра.
 */
class MasterSeeder extends Seeder
{
    public function run(): void
    {
        $masters = [
            [
                'name' => 'Дмитрий Ковалёв',
                'specialization' => 'Ремонт iPhone',
                'experience_years' => 9,
                'rating' => 4.9,
                'is_active' => true,
            ],
            [
                'name' => 'Артём Сафин',
                'specialization' => 'Ремонт Mac и MacBook',
                'experience_years' => 12,
                'rating' => 5.0,
                'is_active' => true,
            ],
            [
                'name' => 'Елена Морозова',
                'specialization' => 'Ремонт iPad и Apple Watch',
                'experience_years' => 6,
                'rating' => 4.8,
                'is_active' => true,
            ],
            [
                'name' => 'Сергей Лапин',
                'specialization' => 'Диагностика и компонентный ремонт',
                'experience_years' => 14,
                'rating' => 4.9,
                'is_active' => true,
            ],
        ];

        foreach ($masters as $master) {
            Master::query()->updateOrCreate(
                ['name' => $master['name']],
                $master
            );
        }
    }
}
