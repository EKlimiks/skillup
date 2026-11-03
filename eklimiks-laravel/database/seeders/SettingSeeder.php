<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Настройки сайта: контакты, тексты, условия доставки и бонусной программы.
 * Администратор может менять их в админ-панели (раздел «Настройки»).
 */
class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // --- Общие ---
            ['key' => 'site_name', 'value' => 'EKlimiks', 'group' => 'common'],
            ['key' => 'site_tagline', 'value' => 'Только техника Apple. Оригинал, гарантия, Trade-In.', 'group' => 'common'],
            ['key' => 'site_description', 'value' => 'EKlimiks — фирменный магазин техники Apple: iPhone, Mac, iPad, Apple Watch, AirPods, Vision Pro и аксессуары. Trade-In, ремонт и бронирование визита в магазин.', 'group' => 'common'],
            ['key' => 'currency', 'value' => '₽', 'group' => 'common'],
            ['key' => 'bonus_percent', 'value' => '2', 'group' => 'common'],
            ['key' => 'bonus_max_pay_percent', 'value' => '30', 'group' => 'common'],

            // --- Контакты ---
            ['key' => 'phone', 'value' => '+7 (3522) 45-67-89', 'group' => 'contacts'],
            ['key' => 'email', 'value' => 'shop@eklimiks.ru', 'group' => 'contacts'],
            ['key' => 'address', 'value' => 'г. Курган, ул. Тверская, 18, ТЦ «Галерея», 2 этаж', 'group' => 'contacts'],
            ['key' => 'work_hours', 'value' => 'Ежедневно с 10:00 до 21:00', 'group' => 'contacts'],
            ['key' => 'telegram', 'value' => '@eklimiks_store', 'group' => 'contacts'],
            ['key' => 'whatsapp', 'value' => '+7 (916) 555-12-34', 'group' => 'contacts'],
            ['key' => 'vk', 'value' => 'vk.com/eklimiks', 'group' => 'contacts'],

            // --- Доставка ---
            ['key' => 'delivery_text', 'value' => 'Самовывоз из магазина — бесплатно, уже через 2 часа после подтверждения. Курьером по Кургане — 490 ₽, в пределах МКАД на следующий день. По России — СДЭК от 390 ₽, 2–5 рабочих дней.', 'group' => 'delivery'],
            ['key' => 'delivery_courier_price', 'value' => '490', 'group' => 'delivery'],
            ['key' => 'delivery_free_from', 'value' => '50000', 'group' => 'delivery'],
            ['key' => 'pickup_text', 'value' => 'Заберите заказ в одном из двух магазинов EKlimiks в Кургане. Проверим устройство вместе с вами и поможем с настройкой.', 'group' => 'delivery'],
            ['key' => 'warranty_text', 'value' => 'Официальная гарантия Apple 12 месяцев на все устройства. Собственный сервисный центр EKlimiks: ремонт по записи, оригинальные запчасти.', 'group' => 'delivery'],

            // --- Тексты ---
            ['key' => 'about_text', 'value' => 'EKlimiks работает с 2019 года и продаёт только технику Apple. Мы не торгуем серыми поставками: каждое устройство проходит проверку по серийному номеру, а Trade-In и ремонт выполняем в собственном сервисном центре.', 'group' => 'text'],
            ['key' => 'trade_in_text', 'value' => 'Оцените своё устройство онлайн за минуту и получите скидку на новое. Принимаем iPhone, iPad, Mac, Apple Watch и AirPods в любом состоянии — от идеального до требующего ремонта.', 'group' => 'text'],
            ['key' => 'repair_text', 'value' => 'Онлайн-запись в сервисный центр: выберите услугу, мастера и удобное свободное время. Диагностика бесплатна при согласии на ремонт.', 'group' => 'text'],
            ['key' => 'bonus_text', 'value' => 'Начисляем 2% бонусами от суммы каждого заказа. 1 бонус = 1 ₽, оплатить бонусами можно до 30% покупки.', 'group' => 'text'],

            // --- SEO ---
            ['key' => 'meta_title', 'value' => 'EKlimiks — магазин техники Apple в Кургане', 'group' => 'common'],
            ['key' => 'meta_description', 'value' => 'Купить iPhone, MacBook, iPad, Apple Watch и AirPods с официальной гарантией. Trade-In, ремонт и бронирование визита в магазин EKlimiks.', 'group' => 'common'],
        ];

        foreach ($settings as $setting) {
            Setting::query()->updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'group' => $setting['group']]
            );
        }
    }
}
