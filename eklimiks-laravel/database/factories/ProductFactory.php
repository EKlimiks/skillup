<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Фабрика товаров — используется в тестах и для быстрого наполнения БД.
 *
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'Apple ' . fake()->unique()->word() . ' ' . fake()->numberBetween(10, 20);

        return [
            'category_id' => Category::query()->inRandomOrder()->value('id') ?? Category::factory(),
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1, 99999),
            'name' => $name,
            'subtitle' => 'Тестовое устройство Apple',
            'description' => fake()->paragraph(),
            'price' => fake()->numberBetween(19990, 349990),
            'old_price' => null,
            'condition' => Product::CONDITION_NEW,
            'storage' => fake()->randomElement(['128 ГБ', '256 ГБ', '512 ГБ', '1 ТБ']),
            'colors' => [
                ['name' => 'Чёрный', 'hex' => '#1f1f22'],
                ['name' => 'Белый', 'hex' => '#f5f5f3'],
            ],
            'specs' => [
                ['key' => 'Чип', 'value' => 'Apple M5'],
                ['key' => 'Дисплей', 'value' => 'Liquid Retina'],
            ],
            'images' => [],
            'stock' => fake()->numberBetween(1, 50),
            'rating' => 0,
            'reviews_count' => 0,
            'is_featured' => fake()->boolean(25),
            'is_active' => true,
        ];
    }
}
