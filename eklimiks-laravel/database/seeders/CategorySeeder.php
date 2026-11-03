<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

/**
 * 8 категорий каталога: iPhone, Mac, iPad, Watch, Audio, TV, Vision, Аксессуары.
 */
class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'slug' => 'iphone',
                'name' => 'iPhone',
                'icon' => 'iphone',
                'sort' => 1,
            ],
            [
                'slug' => 'mac',
                'name' => 'Mac',
                'icon' => 'macbook',
                'sort' => 2,
            ],
            [
                'slug' => 'ipad',
                'name' => 'iPad',
                'icon' => 'ipad',
                'sort' => 3,
            ],
            [
                'slug' => 'watch',
                'name' => 'Apple Watch',
                'icon' => 'watch',
                'sort' => 4,
            ],
            [
                'slug' => 'audio',
                'name' => 'Аудио',
                'icon' => 'airpods',
                'sort' => 5,
            ],
            [
                'slug' => 'tv',
                'name' => 'TV и Дом',
                'icon' => 'tv',
                'sort' => 6,
            ],
            [
                'slug' => 'vision',
                'name' => 'Vision Pro',
                'icon' => 'vision',
                'sort' => 7,
            ],
            [
                'slug' => 'accessories',
                'name' => 'Аксессуары',
                'icon' => 'accessory',
                'sort' => 8,
            ],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
