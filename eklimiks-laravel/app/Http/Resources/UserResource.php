<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'role_label' => $this->roleLabel(),
            'is_admin' => $this->isAdmin(),
            'is_staff' => $this->isStaff(),
            'bonus_points' => (int) $this->bonus_points,
            'bonus_rubles' => round((int) $this->bonus_points, 2),
            'orders_count' => $this->whenCounted('orders'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /** Русское название роли. */
    private function roleLabel(): string
    {
        return match ($this->role) {
            'admin' => 'Администратор',
            'manager' => 'Менеджер',
            default => 'Клиент',
        };
    }
}
