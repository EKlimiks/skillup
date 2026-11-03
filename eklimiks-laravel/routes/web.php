<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web маршруты
|--------------------------------------------------------------------------
|
| Приложение EKlimiks — SPA на React + REST API на Laravel.
| Здесь остаются только служебные страницы: health-check и заглушка API.
|
*/

Route::get('/', function () {
    return response()->json([
        'app' => 'EKlimiks API',
        'description' => 'REST API интернет-магазина техники Apple',
        'version' => '1.0.0',
        'docs' => url('/api/health'),
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
        'app' => config('app.name', 'EKlimiks'),
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
