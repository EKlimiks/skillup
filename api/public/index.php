<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Режим обслуживания (php artisan down)
if (file_exists($maintenance = __DIR__ . '/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Автозагрузка Composer
require __DIR__ . '/../vendor/autoload.php';

// Запуск приложения
/** @var \Illuminate\Foundation\Application $app */
$app = require_once __DIR__ . '/../bootstrap/app.php';

$app->handleRequest(Request::capture());
