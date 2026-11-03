<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Категория каталога: iPhone, Mac, iPad и т.д.
 *
 * @property int $id
 * @property string $slug
 * @property string $name
 * @property string|null $icon
 * @property int $sort
 */
class Category extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'icon',
        'sort',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort' => 'integer',
        ];
    }

    /** Товары категории. */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /** Сортировка по полю sort. */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort')->orderBy('name');
    }
}
