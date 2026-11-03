<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Заявка Trade-In: оценка старого устройства с зачётом в счёт нового.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $device_model
 * @property string|null $storage
 * @property string $device_condition
 * @property int|null $battery_health
 * @property string $estimated_price
 * @property string|null $final_price
 * @property string $status
 * @property string $customer_name
 * @property string $customer_phone
 */
class TradeIn extends Model
{
    use HasFactory;

    public const CONDITION_PERFECT = 'perfect';
    public const CONDITION_GOOD = 'good';
    public const CONDITION_FAIR = 'fair';
    public const CONDITION_BROKEN = 'broken';

    public const CONDITIONS = [
        self::CONDITION_PERFECT,
        self::CONDITION_GOOD,
        self::CONDITION_FAIR,
        self::CONDITION_BROKEN,
    ];

    public const CONDITION_LABELS = [
        self::CONDITION_PERFECT => 'Идеальное',
        self::CONDITION_GOOD => 'Хорошее',
        self::CONDITION_FAIR => 'Удовлетворительное',
        self::CONDITION_BROKEN => 'С дефектами',
    ];

    public const STATUS_NEW = 'new';
    public const STATUS_EVALUATED = 'evaluated';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_COMPLETED = 'completed';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_EVALUATED,
        self::STATUS_ACCEPTED,
        self::STATUS_REJECTED,
        self::STATUS_COMPLETED,
    ];

    public const STATUS_LABELS = [
        self::STATUS_NEW => 'Новая',
        self::STATUS_EVALUATED => 'Оценена',
        self::STATUS_ACCEPTED => 'Принята',
        self::STATUS_REJECTED => 'Отклонена',
        self::STATUS_COMPLETED => 'Завершена',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'device_model',
        'storage',
        'device_condition',
        'battery_health',
        'estimated_price',
        'final_price',
        'status',
        'customer_name',
        'customer_phone',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'battery_health' => 'integer',
            'estimated_price' => 'decimal:2',
            'final_price' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function getConditionLabelAttribute(): string
    {
        return self::CONDITION_LABELS[$this->device_condition] ?? $this->device_condition;
    }

    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }
}
