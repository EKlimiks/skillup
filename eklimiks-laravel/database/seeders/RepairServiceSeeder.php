<?php

namespace Database\Seeders;

use App\Models\RepairService;
use Illuminate\Database\Seeder;

/**
 * Услуги сервисного центра EKlimiks.
 */
class RepairServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'slug' => 'zamena-displeya-iphone',
                'name' => 'Замена дисплея iPhone',
                'description' => 'Оригинальный модуль дисплея Apple, калибровка True Tone, гарантия 12 месяцев. Работа занимает около двух часов.',
                'price_from' => 12990,
                'duration_minutes' => 120,
            ],
            [
                'slug' => 'zamena-akkumulyatora',
                'name' => 'Замена аккумулятора',
                'description' => 'Замена АКБ на оригинальную батарею Apple с проверкой ёмкости до и после ремонта. Для iPhone, iPad и MacBook.',
                'price_from' => 5990,
                'duration_minutes' => 60,
            ],
            [
                'slug' => 'remont-posle-popadaniya-vody',
                'name' => 'Ремонт после попадания воды',
                'description' => 'Полная разборка, ультразвуковая чистка платы, замена повреждённых компонентов и проверка всех узлов устройства.',
                'price_from' => 8900,
                'duration_minutes' => 180,
            ],
            [
                'slug' => 'chip-reball-macbook',
                'name' => 'Компонентный ремонт MacBook',
                'description' => 'Диагностика и ремонт материнской платы MacBook: реболлинг чипов, восстановление цепей питания, замена контроллеров.',
                'price_from' => 15900,
                'duration_minutes' => 240,
            ],
            [
                'slug' => 'zamena-stekla-ipad',
                'name' => 'Замена стекла iPad',
                'description' => 'Замена тач-стекла планшета с сохранением оригинального дисплея. Клей OCA, профессиональная ламинация.',
                'price_from' => 9900,
                'duration_minutes' => 150,
            ],
            [
                'slug' => 'diagnostika-ustroystva',
                'name' => 'Диагностика устройства',
                'description' => 'Аппаратная и программная диагностика 40 минут. При согласии на ремонт стоимость диагностики не берётся.',
                'price_from' => 0,
                'duration_minutes' => 40,
            ],
        ];

        foreach ($services as $service) {
            RepairService::query()->updateOrCreate(
                ['slug' => $service['slug']],
                $service
            );
        }
    }
}
