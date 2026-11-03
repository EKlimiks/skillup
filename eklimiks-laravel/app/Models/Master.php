<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Мастер сервисного центра (специалист по ремонту).
 *
 * @property int $id
 * @property string $name
 * @property string $specialization
 * @property int $experience_years
 * @property string $rating
 * @property bool $is_active
 */
class Master extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'specialization',
        'experience_years',
        'rating',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
            'rating' => 'decimal:1',
            'is_active' => 'boolean',
        ];
    }

    /** Слоты мастера. */
    public function slots(): HasMany
    {
        return $this->hasMany(MasterSlot::class);
    }

    /** Заявки на ремонт, закреплённые за мастером. */
    public function repairRequests(): HasMany
    {
        return $this->hasMany(RepairRequest::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderByDesc('rating')->orderBy('name');
    }
}
