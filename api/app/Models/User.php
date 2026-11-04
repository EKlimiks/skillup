<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Пользователь SkillUp.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 */
class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    /** Роль обычного пользователя (колонка осталась от общей схемы). */
    public const ROLE_CLIENT = 'client';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'bonus_points',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /** Прогресс приложения: один JSON-объект на пользователя. */
    public function skillupProgress(): HasOne
    {
        return $this->hasOne(SkillupProgress::class);
    }
}
