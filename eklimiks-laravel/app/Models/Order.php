<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Заказ покупателя.
 *
 * @property int $id
 * @property int $user_id
 * @property string $number
 * @property string $status
 * @property string $total
 * @property string $delivery_type
 * @property string|null $address
 * @property string $customer_name
 * @property string $customer_phone
 * @property string|null $comment
 */
class Order extends Model
{
    use HasFactory;

    public const STATUS_NEW = 'new';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_ASSEMBLED = 'assembled';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_CONFIRMED,
        self::STATUS_ASSEMBLED,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
    ];

    /** Человекочитаемые названия статусов (для админки и писем). */
    public const STATUS_LABELS = [
        self::STATUS_NEW => 'Новый',
        self::STATUS_CONFIRMED => 'Подтверждён',
        self::STATUS_ASSEMBLED => 'Собран',
        self::STATUS_DELIVERED => 'Доставлен',
        self::STATUS_CANCELLED => 'Отменён',
    ];

    public const DELIVERY_PICKUP = 'pickup';
    public const DELIVERY_COURIER = 'courier';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'number',
        'status',
        'total',
        'delivery_type',
        'address',
        'customer_name',
        'customer_phone',
        'comment',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
        ];
    }

    /** Покупатель. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Позиции заказа. */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** Товары заказа (many-to-many через order_items). */
    public function products(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'order_items')
            ->withPivot(['qty', 'price'])
            ->withTimestamps();
    }

    /** Русское название статуса. */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }
}
