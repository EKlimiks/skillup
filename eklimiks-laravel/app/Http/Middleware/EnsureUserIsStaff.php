<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Доступ для сотрудников магазина: admin или manager.
 * Возвращает JSON 403 для клиентов.
 */
class EnsureUserIsStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Требуется авторизация. Войдите в аккаунт.',
            ], 401);
        }

        if (! $user->isStaff()) {
            return response()->json([
                'message' => 'Доступ запрещён: раздел доступен только сотрудникам магазина.',
            ], 403);
        }

        return $next($request);
    }
}
