<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Услуга сервисного центра (ремонт), например «Замена дисплея iPhone».
 *
 * @property int $id
 * @property string $slug
 * @property string $name
 * @property string $description
 * @property string $price_from
 * @property int $duration_minutes
 */
class RepairService extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'description',
        'price_from',
        'duration_minutes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_from' => 'decimal:2',
            'duration_minutes' => 'integer',
        ];
    }

    /** Заявки на эту услугу. */
    public function repairRequests(): HasMany
    {
        return $this->hasMany(RepairRequest::class);
    }

    /** Длительность в часах, например «2 ч». */
    public function getDurationLabelAttribute(): string
    {
        $minutes = (int) $this->duration_minutes;

        if ($minutes < 60) {
            return $minutes . ' мин';
        }

        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;

        return $rest > 0 ? $hours . ' ч ' . $rest . ' мин' : $hours . ' ч';
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('price_from');
    }
}
