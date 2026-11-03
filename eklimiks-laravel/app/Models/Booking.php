<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Бронирование визита в магазин: товар + точка + дата и время.
 *
 * @property int $id
 * @property int $user_id
 * @property int $product_id
 * @property int $store_id
 * @property \Illuminate\Support\Carbon $slot_date
 * @property string $slot_time
 * @property string $status
 * @property string $customer_name
 * @property string $customer_phone
 */
class Booking extends Model
{
    use HasFactory;

    public const STATUS_NEW = 'new';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_CONFIRMED,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    public const STATUS_LABELS = [
        self::STATUS_NEW => 'Новое',
        self::STATUS_CONFIRMED => 'Подтверждено',
        self::STATUS_COMPLETED => 'Завершено',
        self::STATUS_CANCELLED => 'Отменено',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'product_id',
        'store_id',
        'slot_date',
        'slot_time',
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
            'slot_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->whereDate('slot_date', '>=', now()->toDateString())
            ->orderBy('slot_date')
            ->orderBy('slot_time');
    }
}
