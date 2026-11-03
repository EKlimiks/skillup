<?php

namespace Database\Seeders;

use App\Models\Promo;
use Illuminate\Database\Seeder;

/**
 * Промокоды EKlimiks.
 */
class PromoSeeder extends Seeder
{
    public function run(): void
    {
        $promos = [
            [
                'code' => 'EKLIMIKS10',
                'discount_percent' => 10,
                'is_active' => true,
                'expires_at' => now()->addMonths(3)->endOfDay(),
            ],
            [
                'code' => 'APPLE2026',
                'discount_percent' => 7,
                'is_active' => true,
                'expires_at' => now()->addYear()->endOfDay(),
            ],
            [
                'code' => 'STUDENT15',
                'discount_percent' => 15,
                'is_active' => true,
                'expires_at' => now()->addMonths(6)->endOfDay(),
            ],
        ];

        foreach ($promos as $promo) {
            Promo::query()->updateOrCreate(
                ['code' => $promo['code']],
                $promo
            );
        }
    }
}
