<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Слот свободного времени мастера.
 * Именно из этой таблицы фронтенд получает список свободных дат и времени.
 *
 * @property int $id
 * @property int $master_id
 * @property \Illuminate\Support\Carbon $date
 * @property string $time
 * @property bool $is_booked
 */
class MasterSlot extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'master_id',
        'date',
        'time',
        'is_booked',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_booked' => 'boolean',
        ];
    }

    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }

    /** Заявка на ремонт, занявшая слот. */
    public function repairRequest(): HasOne
    {
        return $this->hasOne(RepairRequest::class);
    }

    public function scopeFree(Builder $query): Builder
    {
        return $query->where('is_booked', false);
    }

    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->whereDate('date', $date);
    }

    /** Человекочитаемое время без секунд: 10:00. */
    public function getTimeShortAttribute(): string
    {
        return substr((string) $this->time, 0, 5);
    }
}
