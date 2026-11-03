<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Пользователь магазина EKlimiks.
 *
 * Роли: client (покупатель), manager (менеджер — доступ в админку),
 * admin (полный доступ).
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property int $bonus_points
 * @property string|null $phone
 */
class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    public const ROLE_CLIENT = 'client';
    public const ROLE_MANAGER = 'manager';
    public const ROLE_ADMIN = 'admin';

    public const ROLES = [
        self::ROLE_CLIENT,
        self::ROLE_MANAGER,
        self::ROLE_ADMIN,
    ];

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
            'bonus_points' => 'integer',
        ];
    }

    // ---------------------------------------------------------------------
    // Роли
    // ---------------------------------------------------------------------

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isManager(): bool
    {
        return $this->role === self::ROLE_MANAGER;
    }

    public function isStaff(): bool
    {
        return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_MANAGER], true);
    }

    // ---------------------------------------------------------------------
    // Связи
    // ---------------------------------------------------------------------

    /** Заказы пользователя. */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** Заявки на ремонт. */
    public function repairRequests(): HasMany
    {
        return $this->hasMany(RepairRequest::class);
    }

    /** Бронирования визита в магазин. */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /** Заявки Trade-In. */
    public function tradeIns(): HasMany
    {
        return $this->hasMany(TradeIn::class);
    }

    /** Отзывы пользователя. */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** Избранные товары (записи таблицы favorites). */
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    /** Избранные товары (many-to-many). */
    public function favoriteProducts(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'favorites')->withTimestamps();
    }
}
