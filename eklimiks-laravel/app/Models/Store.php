<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Физический магазин (точка самовывоза), где можно забронировать визит.
 *
 * @property int $id
 * @property string $name
 * @property string $address
 * @property string $phone
 * @property string $work_hours
 */
class Store extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'address',
        'phone',
        'work_hours',
    ];

    /** Бронирования в этом магазине. */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
