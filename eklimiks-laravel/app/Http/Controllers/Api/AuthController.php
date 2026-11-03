<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Аутентификация: регистрация, вход, выход, текущий пользователь.
 * Используется Laravel Sanctum (API-токены + SPA cookie).
 */
class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'], // каст 'hashed' хеширует сам
            'phone' => $data['phone'] ?? null,
            'role' => User::ROLE_CLIENT,
            'bonus_points' => 0,
        ]);

        $token = $user->createToken($data['device_name'] ?? 'eklimiks-web')->plainTextToken;

        return response()->json([
            'message' => 'Регистрация прошла успешно. Добро пожаловать в EKlimiks!',
            'token' => $token,
            'user' => new UserResource($user),
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        /** @var User|null $user */
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Неверный e-mail или пароль.'],
            ]);
        }

        $token = $user->createToken($credentials['device_name'] ?? 'eklimiks-web')->plainTextToken;

        return response()->json([
            'message' => 'Вы вошли в аккаунт.',
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => new UserResource($user->loadCount('orders')),
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Удаляем текущий токен, если вход был по Bearer-токену
        $token = $user->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        // Для SPA-режима дополнительно сбрасываем сессию
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Вы вышли из аккаунта.',
        ]);
    }
}
