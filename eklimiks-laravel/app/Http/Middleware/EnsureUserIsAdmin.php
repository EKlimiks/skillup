<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Доступ только для администратора (role = admin).
 * Возвращает JSON 403 для остальных пользователей.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Требуется авторизация. Войдите в аккаунт.',
            ], 401);
        }

        if (! $user->isAdmin()) {
            return response()->json([
                'message' => 'Доступ запрещён: требуются права администратора.',
            ], 403);
        }

        return $next($request);
    }
}
