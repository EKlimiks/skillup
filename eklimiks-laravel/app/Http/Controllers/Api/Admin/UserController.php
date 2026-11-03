<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Управление пользователями: роли, бонусы, блокировка (через смену роли на client).
 */
class UserController extends Controller
{
    /**
     * GET /api/admin/users
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()->withCount('orders');

        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = max(1, min((int) $request->query('per_page', 20), 100));

        return UserResource::collection(
            $query->orderByDesc('created_at')->paginate($perPage)->withQueryString()
        );
    }

    /**
     * POST /api/admin/users
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email', 'max:191', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'phone' => ['nullable', 'string', 'max:32'],
            'role' => ['required', Rule::in(User::ROLES)],
            'bonus_points' => ['nullable', 'integer', 'min:0'],
        ], [
            'name.required' => 'Укажите имя пользователя.',
            'email.unique' => 'Пользователь с таким e-mail уже существует.',
            'password.min' => 'Пароль должен содержать минимум 6 символов.',
            'role.required' => 'Выберите роль пользователя.',
            'role.in' => 'Недопустимая роль.',
        ]);

        /** @var User $user */
        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
            'bonus_points' => $data['bonus_points'] ?? 0,
        ]);

        return response()->json([
            'message' => "Пользователь {$user->name} создан.",
            'data' => (new UserResource($user))->resolve(),
        ], 201);
    }

    /**
     * GET /api/admin/users/{user}
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => (new UserResource($user->loadCount(['orders', 'repairRequests', 'tradeIns'])))->resolve(),
        ]);
    }

    /**
     * PUT/PATCH /api/admin/users/{user}
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'email' => ['sometimes', 'email', 'max:191', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'role' => ['sometimes', Rule::in(User::ROLES)],
            'bonus_points' => ['sometimes', 'integer', 'min:0'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
        ], [
            'email.unique' => 'Этот e-mail уже занят.',
            'role.in' => 'Недопустимая роль.',
            'bonus_points.min' => 'Количество бонусов не может быть отрицательным.',
        ]);

        // Защита от потери последнего администратора
        if (array_key_exists('role', $data) && $data['role'] !== User::ROLE_ADMIN && $user->isAdmin()) {
            $adminsLeft = User::query()
                ->where('role', User::ROLE_ADMIN)
                ->whereKeyNot($user->id)
                ->count();

            if ($adminsLeft === 0) {
                return response()->json([
                    'message' => 'Нельзя снять роль: это единственный администратор системы.',
                ], 409);
            }
        }

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->fill(collect($data)->except('password')->all())->save();

        return response()->json([
            'message' => 'Пользователь обновлён.',
            'data' => (new UserResource($user->fresh()->loadCount('orders')))->resolve(),
        ]);
    }

    /**
     * DELETE /api/admin/users/{user}
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()?->id === $user->id) {
            return response()->json([
                'message' => 'Нельзя удалить собственную учётную запись.',
            ], 409);
        }

        if ($user->isAdmin()) {
            $adminsLeft = User::query()->where('role', User::ROLE_ADMIN)->whereKeyNot($user->id)->count();

            if ($adminsLeft === 0) {
                return response()->json([
                    'message' => 'Нельзя удалить единственного администратора системы.',
                ], 409);
            }
        }

        $name = $user->name;
        $user->delete();

        return response()->json([
            'message' => "Пользователь {$name} удалён.",
        ]);
    }
}
