<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web-маршруты
|--------------------------------------------------------------------------
|
| SkillUp — это PWA, которую отдаёт nginx. Laravel отвечает только за API,
| поэтому здесь остаются служебные страницы: справка и health-check.
|
*/

Route::get('/', function () {
    return response()->json([
        'app' => 'SkillUp API',
        'description' => 'API приложения SkillUp: уроки, карточки и прогресс',
        'version' => '1.0.0',
    ]);
});

Route::get('/health', function () {
    $database = 'ok';

    try {
        DB::connection()->getPdo();
    } catch (\Throwable $e) {
        $database = 'error';
    }

    return response()->json([
        'status' => 'ok',
        'app' => config('app.name', 'SkillUp'),
        'environment' => app()->environment(),
        'php' => PHP_VERSION,
        'laravel' => app()->version(),
        'database' => $database,
        'time' => now()->toIso8601String(),
    ]);
});

Route::get('/api/health', function () {
    $database = 'ok';

    try {
        DB::connection()->getPdo();
    } catch (\Throwable $e) {
        $database = 'error';
    }

    return response()->json([
        'status' => 'ok',
        'database' => $database,
        'time' => now()->toIso8601String(),
    ]);
});
