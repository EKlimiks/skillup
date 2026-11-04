<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Фабрика пользователей.
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'phone' => fake()->numerify('+7 (9##) ###-##-##'),
            'role' => User::ROLE_CLIENT,
            'bonus_points' => 0,
            'remember_token' => Str::random(10),
        ];
    }

    /** Администратор. */
    public function admin(): static
    {
        return $this->state(fn () => ['role' => User::ROLE_ADMIN]);
    }

    /** Менеджер. */
    public function manager(): static
    {
        return $this->state(fn () => ['role' => User::ROLE_MANAGER]);
    }
}
