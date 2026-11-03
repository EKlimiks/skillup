<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SkillupController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API SkillUp (Laravel 11)
|--------------------------------------------------------------------------
|
| Публичные маршруты — регистрация и вход.
| Маршруты auth:sanctum — профиль, прогресс, лига и удаление аккаунта.
|
*/

Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Прогресс приложения, объединение с другого устройства, лига
    Route::get('skillup/progress', [SkillupController::class, 'show']);
    Route::put('skillup/progress', [SkillupController::class, 'update']);
    Route::post('skillup/merge', [SkillupController::class, 'merge']);
    Route::get('skillup/league', [SkillupController::class, 'league']);
    Route::delete('skillup/account', [SkillupController::class, 'destroyAccount']);
});

Route::fallback(function () {
    return response()->json([
        'message' => 'Запрашиваемый эндпоинт API не найден.',
    ], 404);
});
