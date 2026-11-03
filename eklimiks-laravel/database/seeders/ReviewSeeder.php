<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Отзывы о товарах. Большинство уже одобрены, два ждут модерации —
 * чтобы в админ-панели был виден раздел проверки отзывов.
 */
class ReviewSeeder extends Seeder
{
    /**
     * @var array<int, array{slug: string, author: string, email: string|null, rating: int, text: string, approved: bool, days_ago: int}>
     */
    private const REVIEWS = [
        [
            'slug' => 'iphone-18-pro-max',
            'author' => 'Иван Петров',
            'email' => 'client@eklimiks.ru',
            'rating' => 5,
            'text' => 'Перешёл с 16 Pro Max — разница ощутима. Камера с 8-кратным зумом снимает тексты с досок идеально, батарея держит два дня при активном использовании. В EKlimiks оформили Trade-In старого телефона за 15 минут.',
            'approved' => true,
            'days_ago' => 6,
        ],
        [
            'slug' => 'iphone-18-pro-max',
            'author' => 'Марина Соколова',
            'email' => null,
            'rating' => 5,
            'text' => 'Заказывала в подарок мужу. Доставили курьером на следующий день, коробка запечатана, чек и гарантия в комплекте. Титан почти не собирает отпечатки, экран на солнце читается без проблем.',
            'approved' => true,
            'days_ago' => 21,
        ],
        [
            'slug' => 'iphone-18-pro-max',
            'author' => 'Андрей Л.',
            'email' => null,
            'rating' => 4,
            'text' => 'Телефон отличный, но цена кусается. Зато в рассрочку на 12 месяцев вышло комфортно. Из минусов — новый чехол под тетрапризму пока найти сложно.',
            'approved' => true,
            'days_ago' => 33,
        ],
        [
            'slug' => 'iphone-18-pro',
            'author' => 'Дмитрий Ковалёв',
            'email' => null,
            'rating' => 5,
            'text' => 'Идеальный размер — в руке лежит лучше Max, а возможностей столько же. Снимаю видео в 4K 120 к/с, перегрева нет даже на улице.',
            'approved' => true,
            'days_ago' => 11,
        ],
        [
            'slug' => 'iphone-duo',
            'author' => 'Ольга Северина',
            'email' => null,
            'rating' => 5,
            'text' => 'Складной iPhone наконец-то вышел! Складка на внутреннем экране практически не видна под углом, шарнир плотный. Планшет и телефон в одном устройстве — для работы идеально.',
            'approved' => true,
            'days_ago' => 4,
        ],
        [
            'slug' => 'macbook-air-13',
            'author' => 'Иван Петров',
            'email' => 'client@eklimiks.ru',
            'rating' => 5,
            'text' => 'Взял для учёбы: 16 ГБ памяти и M5 тянут Docker, VS Code и десяток вкладок Chrome одновременно. Ноутбук холодный и абсолютно тихий.',
            'approved' => true,
            'days_ago' => 14,
        ],
        [
            'slug' => 'macbook-pro-16',
            'author' => 'Артём Сафин',
            'email' => null,
            'rating' => 5,
            'text' => 'Монтирую 8K в Final Cut — экспорт в два раза быстрее, чем на M3 Max. Экран 1600 нит позволяет работать у окна без внешнего монитора. Тяжёлый, но это цена мощности.',
            'approved' => true,
            'days_ago' => 18,
        ],
        [
            'slug' => 'ipad-pro-13',
            'author' => 'Елена Морозова',
            'email' => null,
            'rating' => 5,
            'text' => 'Tandem OLED — это космос: чёрный действительно чёрный, HDR в фильмах выглядит как в кинотеатре. С Apple Pencil Pro рисую прямо на планшете, задержки нет вообще.',
            'approved' => true,
            'days_ago' => 9,
        ],
        [
            'slug' => 'watch-ultra',
            'author' => 'Сергей Лапин',
            'email' => null,
            'rating' => 5,
            'text' => 'Бегаю марафоны, Ultra 4 держит 3 дня с GPS-тренировками. Спутниковая связь — та функция, которая однажды реально спасает. Экран читается на ярком солнце.',
            'approved' => true,
            'days_ago' => 27,
        ],
        [
            'slug' => 'airpods-pro-3',
            'author' => 'Марина Соколова',
            'email' => null,
            'rating' => 5,
            'text' => 'Шумоподавление глушит метро полностью. Функция измерения пульса во время тренировок неожиданно точная — совпадает с часами. В ушах сидят плотно, не выпадают.',
            'approved' => true,
            'days_ago' => 8,
        ],
        [
            'slug' => 'vision-pro',
            'author' => 'Андрей Л.',
            'email' => null,
            'rating' => 4,
            'text' => 'Устройство будущего: смотреть фильмы и работать с несколькими окнами — невероятно. Минус — вес и цена, за пару часов шея устаёт. Но эмоции от покупки перекрывают всё.',
            'approved' => true,
            'days_ago' => 30,
        ],
        [
            'slug' => 'imac-24',
            'author' => 'Наталья Гринёва',
            'email' => null,
            'rating' => 5,
            'text' => 'Купили iMac в офис — цвет корпуса радует глаз, экран 4,5K откалиброван из коробки. Дизайнеры довольны, шума от компьютера нет совсем.',
            'approved' => false,
            'days_ago' => 1,
        ],
        [
            'slug' => 'ipad-air-11',
            'author' => 'Павел Дорохов',
            'email' => null,
            'rating' => 4,
            'text' => 'Отличный планшет за свои деньги. Хотелось бы 120 Гц, но для конспектов и фильмов хватает с запасом. Магазин приятно удивил: помогли настроить и перенести данные.',
            'approved' => false,
            'days_ago' => 2,
        ],
    ];

    public function run(): void
    {
        /** @var array<string, int> $productIds */
        $productIds = Product::query()->pluck('id', 'slug')->all();

        /** @var array<string, int> $userIds */
        $userIds = User::query()->pluck('id', 'email')->all();

        foreach (self::REVIEWS as $data) {
            if (! isset($productIds[$data['slug']])) {
                continue;
            }

            $createdAt = now()->subDays($data['days_ago'])->setTime(12, 30);

            Review::query()->updateOrCreate(
                [
                    'product_id' => $productIds[$data['slug']],
                    'author_name' => $data['author'],
                    'text' => $data['text'],
                ],
                [
                    'user_id' => $data['email'] !== null ? ($userIds[$data['email']] ?? null) : null,
                    'rating' => $data['rating'],
                    'is_approved' => $data['approved'],
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]
            );
        }

        // Пересчитываем рейтинг и количество отзывов у товаров
        Product::query()->each(fn (Product $product) => $product->recalculateRating());
    }
}
