<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Лид — заявка с сайта: «заказать звонок», вопрос, Trade-In, ремонт.
 *
 * @property int $id
 * @property string $name
 * @property string $phone
 * @property string $type
 * @property string|null $message
 * @property string $status
 */
class Lead extends Model
{
    use HasFactory;

    public const TYPE_CALLBACK = 'callback';
    public const TYPE_QUESTION = 'question';
    public const TYPE_TRADE_IN = 'trade_in';
    public const TYPE_REPAIR = 'repair';

    public const TYPES = [
        self::TYPE_CALLBACK,
        self::TYPE_QUESTION,
        self::TYPE_TRADE_IN,
        self::TYPE_REPAIR,
    ];

    public const TYPE_LABELS = [
        self::TYPE_CALLBACK => 'Заказать звонок',
        self::TYPE_QUESTION => 'Вопрос',
        self::TYPE_TRADE_IN => 'Trade-In',
        self::TYPE_REPAIR => 'Ремонт',
    ];

    public const STATUS_NEW = 'new';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_DONE = 'done';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_IN_PROGRESS,
        self::STATUS_DONE,
    ];

    public const STATUS_LABELS = [
        self::STATUS_NEW => 'Новая',
        self::STATUS_IN_PROGRESS => 'В работе',
        self::STATUS_DONE => 'Обработана',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'phone',
        'type',
        'message',
        'status',
    ];

    public function getTypeLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->type] ?? $this->type;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function scopeNew(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_NEW);
    }
}
