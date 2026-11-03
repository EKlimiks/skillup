<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Товар магазина (устройство Apple или аксессуар).
 *
 * @property int $id
 * @property int $category_id
 * @property string $slug
 * @property string $name
 * @property string|null $subtitle
 * @property string $description
 * @property string $price
 * @property string|null $old_price
 * @property string $condition
 * @property string|null $storage
 * @property array|null $colors
 * @property array|null $specs
 * @property array|null $images
 * @property int $stock
 * @property string $rating
 * @property int $reviews_count
 * @property bool $is_featured
 * @property bool $is_active
 */
class Product extends Model
{
    use HasFactory;

    public const CONDITION_NEW = 'new';
    public const CONDITION_REFURBISHED = 'refurbished';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'slug',
        'name',
        'subtitle',
        'description',
        'price',
        'old_price',
        'condition',
        'storage',
        'colors',
        'specs',
        'images',
        'stock',
        'rating',
        'reviews_count',
        'is_featured',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'old_price' => 'decimal:2',
            'colors' => 'array',
            'specs' => 'array',
            'images' => 'array',
            'stock' => 'integer',
            'rating' => 'decimal:1',
            'reviews_count' => 'integer',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ---------------------------------------------------------------------
    // Связи
    // ---------------------------------------------------------------------

    /** Категория товара. */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** Отзывы о товаре. */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** Только одобренные отзывы. */
    public function approvedReviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }

    /** Позиции заказов с этим товаром. */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** Заказы, в которых встречается товар. */
    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'order_items')
            ->withPivot(['qty', 'price'])
            ->withTimestamps();
    }

    /** Пользователи, добавившие товар в избранное. */
    public function favoredByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    /** Бронирования этого товара. */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    // ---------------------------------------------------------------------
    // Скоупы
    // ---------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeInStock(Builder $query): Builder
    {
        return $query->where('stock', '>', 0);
    }

    // ---------------------------------------------------------------------
    // Аксессоры
    // ---------------------------------------------------------------------

    /** Ссылка на главное изображение товара. */
    public function getMainImageAttribute(): ?string
    {
        $images = $this->images ?? [];

        return $images[0] ?? null;
    }

    /** Есть ли скидка. */
    public function getHasDiscountAttribute(): bool
    {
        return $this->old_price !== null && (float) $this->old_price > (float) $this->price;
    }

    /** Пересчёт рейтинга и количества отзывов по одобренным отзывам. */
    public function recalculateRating(): void
    {
        $approved = $this->reviews()->where('is_approved', true);

        $this->forceFill([
            'reviews_count' => (clone $approved)->count(),
            'rating' => round((float) (clone $approved)->avg('rating'), 1),
        ])->save();
    }
}
