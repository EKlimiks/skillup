<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Каталог товаров EKlimiks: 37 устройств Apple актуальной линейки.
 *
 * Данные лежат в database/data/products.php. Изображения формируются
 * автоматически по шаблону public/img/products/<slug>--<color_id>.webp —
 * он полностью совпадает с именами файлов React-приложения.
 */
class ProductSeeder extends Seeder
{
    /**
     * Резервная карта: русское название цвета → id цвета для имени файла.
     * Используется только если у цвета не задан явный ключ id.
     *
     * @var array<string, string>
     */
    private const COLOR_SLUGS = [
        'чёрный' => 'black',
        'чёрный титан' => 'black',
        'бордовый' => 'burgundy',
        'бордовый титан' => 'burgundy',
        'ледяной' => 'glacier',
        'ледниковый' => 'glacier',
        'серебристый' => 'silver',
        'ночное небо' => 'nightsky',
        'звёздный белый' => 'starwhite',
        'облачный белый' => 'cloudwhite',
        'облачно-белый' => 'cloudwhite',
        'светлое золото' => 'lightgold',
        'небесно-голубой' => 'skyblue',
        'космический чёрный' => 'spaceblack',
        'лавандовый' => 'lavender',
        'дымчато-синий' => 'mistblue',
        'дымчато-голубой' => 'mistblue',
        'шалфейный' => 'sage',
        'белый' => 'white',
        'нежно-розовый' => 'softpink',
        'розовый' => 'pink',
        'бирюзовый' => 'teal',
        'ультрамарин' => 'ultramarine',
        'ультрамариновый' => 'ultramarine',
        'полночный' => 'midnight',
        'полночь' => 'midnight',
        'звёздный свет' => 'starlight',
        'сияющая звезда' => 'starlight',
        'синий' => 'blue',
        'голубой' => 'blue',
        'зелёный' => 'green',
        'оранжевый' => 'orange',
        'фиолетовый' => 'purple',
        'жёлтый' => 'yellow',
        'серый космос' => 'spacegray',
        'натуральный титан' => 'natural',
    ];

    public function run(): void
    {
        /** @var array<int, array<string, mixed>> $products */
        $products = require database_path('data/products.php');

        /** @var array<string, int> $categoryIds */
        $categoryIds = Category::query()->pluck('id', 'slug')->all();

        foreach ($products as $data) {
            $categorySlug = $data['category'] ?? 'accessories';

            if (! isset($categoryIds[$categorySlug])) {
                $this->command?->warn("Категория {$categorySlug} не найдена, пропускаем {$data['slug']}");

                continue;
            }

            $colors = $data['colors'] ?? [];

            Product::query()->updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'category_id' => $categoryIds[$categorySlug],
                    'name' => $data['name'],
                    'subtitle' => $data['subtitle'] ?? null,
                    'description' => $data['description'],
                    'price' => $data['price'],
                    'old_price' => $data['old_price'] ?? null,
                    'condition' => $data['condition'] ?? Product::CONDITION_NEW,
                    'storage' => $data['storage'] ?? null,
                    'colors' => $colors,
                    'specs' => $data['specs'] ?? [],
                    'images' => $data['images'] ?? $this->imagesFor($data['slug'], $colors),
                    'stock' => $data['stock'] ?? 0,
                    'rating' => $data['rating'] ?? 0,
                    'reviews_count' => 0,
                    'is_featured' => (bool) ($data['is_featured'] ?? false),
                    'is_active' => (bool) ($data['is_active'] ?? true),
                ]
            );
        }
    }

    /**
     * Пути к изображениям: img/products/<slug>--<color_id>.webp
     *
     * @param  array<int, array{id?: string, name: string, hex: string}>  $colors
     * @return array<int, string>
     */
    private function imagesFor(string $slug, array $colors): array
    {
        $images = [];

        foreach ($colors as $color) {
            $colorId = $color['id'] ?? $this->colorSlug($color['name'] ?? '');

            if ($colorId === '') {
                continue;
            }

            $images[] = 'img/products/' . $slug . '--' . $colorId . '.webp';
        }

        return $images;
    }

    /**
     * Русское название цвета → id для имени файла (резервный путь).
     */
    private function colorSlug(string $name): string
    {
        $key = mb_strtolower(trim($name));

        if (isset(self::COLOR_SLUGS[$key])) {
            return self::COLOR_SLUGS[$key];
        }

        // Фолбэк: транслитерация в slug
        $translit = str_replace(
            ['а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ы', 'э', 'ю', 'я', ' '],
            ['a', 'b', 'v', 'g', 'd', 'e', 'zh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'h', 'c', 'ch', 'sh', 'sch', 'y', 'e', 'yu', 'ya', '-'],
            $key
        );

        return trim(preg_replace('/[^a-z0-9\-]+/', '', $translit) ?? '', '-');
    }
}
