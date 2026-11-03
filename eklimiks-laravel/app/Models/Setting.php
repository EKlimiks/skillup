<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Настройка сайта в формате ключ → значение.
 * Позволяет администратору менять тексты, телефон, адрес без пересборки фронта.
 *
 * @property int $id
 * @property string $key
 * @property string|null $value
 * @property string|null $group
 */
class Setting extends Model
{
    use HasFactory;

    public const GROUP_COMMON = 'common';
    public const GROUP_CONTACTS = 'contacts';
    public const GROUP_DELIVERY = 'delivery';
    public const GROUP_TEXT = 'text';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
        'group',
    ];

    /** Получить значение по ключу. */
    public static function value(string $key, ?string $default = null): ?string
    {
        $setting = static::query()->where('key', $key)->first();

        return $setting?->value ?? $default;
    }

    /** Все настройки группы в виде массива ключ → значение. */
    public static function groupValues(string $group): array
    {
        return static::query()
            ->where('group', $group)
            ->pluck('value', 'key')
            ->toArray();
    }

    public function scopeGroup(Builder $query, string $group): Builder
    {
        return $query->where('group', $group);
    }
}
