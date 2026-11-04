<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Сохранённый прогресс SkillUp — одна строка на пользователя.
 *
 * @property int $id
 * @property int $user_id
 * @property array<string, mixed> $progress
 * @property \Illuminate\Support\Carbon|null $client_updated_at
 * @property int $revision
 */
class SkillupProgress extends Model
{
    protected $table = 'skillup_progress';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'progress',
        'client_updated_at',
        'revision',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'progress' => 'array',
            'client_updated_at' => 'datetime',
            'revision' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
