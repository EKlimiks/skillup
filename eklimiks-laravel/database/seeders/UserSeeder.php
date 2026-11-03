<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Тестовые учётные записи для защиты проекта.
 *
 * admin@eklimiks.ru   / admin123   — администратор (полный доступ)
 * manager@eklimiks.ru / manager123 — менеджер (заказы, заявки, лиды)
 * client@eklimiks.ru  / client123  — клиент магазина
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Алексей Екимов',
                'email' => 'admin@eklimiks.ru',
                'password' => 'admin123',
                'phone' => '+7 (3522) 45-67-89',
                'role' => User::ROLE_ADMIN,
                'bonus_points' => 0,
            ],
            [
                'name' => 'Марина Соколова',
                'email' => 'manager@eklimiks.ru',
                'password' => 'manager123',
                'phone' => '+7 (3522) 45-67-90',
                'role' => User::ROLE_MANAGER,
                'bonus_points' => 0,
            ],
            [
                'name' => 'Иван Петров',
                'email' => 'client@eklimiks.ru',
                'password' => 'client123',
                'phone' => '+7 (916) 555-12-34',
                'role' => User::ROLE_CLIENT,
                'bonus_points' => 1250,
            ],
        ];

        foreach ($users as $data) {
            User::query()->updateOrCreate(
                ['email' => $data['email']],
                $data // каст 'hashed' захеширует пароль автоматически
            );
        }
    }
}
