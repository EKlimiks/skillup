<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Заявка на ремонт устройства.
 *
 * @property int $id
 * @property int|null $user_id
 * @property int $repair_service_id
 * @property int|null $master_id
 * @property int|null $master_slot_id
 * @property string $device_model
 * @property string $issue
 * @property string $customer_name
 * @property string $customer_phone
 * @property string $status
 * @property string|null $price
 */
class RepairRequest extends Model
{
    use HasFactory;

    public const STATUS_NEW = 'new';
    public const STATUS_DIAGNOSTICS = 'diagnostics';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_READY = 'ready';
    public const STATUS_DONE = 'done';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_DIAGNOSTICS,
        self::STATUS_APPROVED,
        self::STATUS_IN_PROGRESS,
        self::STATUS_READY,
        self::STATUS_DONE,
        self::STATUS_CANCELLED,
    ];

    public const STATUS_LABELS = [
        self::STATUS_NEW => 'Новая',
        self::STATUS_DIAGNOSTICS => 'Диагностика',
        self::STATUS_APPROVED => 'Согласована',
        self::STATUS_IN_PROGRESS => 'В работе',
        self::STATUS_READY => 'Готова к выдаче',
        self::STATUS_DONE => 'Выполнена',
        self::STATUS_CANCELLED => 'Отменена',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'repair_service_id',
        'master_id',
        'master_slot_id',
        'device_model',
        'issue',
        'customer_name',
        'customer_phone',
        'status',
        'price',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    /** Клиент (может быть null для гостевой заявки). */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Выбранная услуга. */
    public function service(): BelongsTo
    {
        return $this->belongsTo(RepairService::class, 'repair_service_id');
    }

    /** Назначенный мастер. */
    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }

    /** Занятый слот времени. */
    public function slot(): BelongsTo
    {
        return $this->belongsTo(MasterSlot::class, 'master_slot_id');
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }
}
