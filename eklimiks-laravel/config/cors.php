<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS)
|--------------------------------------------------------------------------
|
| React-приложение (Vite) ходит на API с другого порта, поэтому CORS нужен
| обязательно. Разрешённые источники задаются в .env (CORS_ALLOWED_ORIGINS).
|
*/

$origins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
)));

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    // Указываем конкретные источники, потому что supports_credentials = true
    'allowed_origins' => $origins ?: ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['X-Order-Number'],

    'max_age' => 86400,

    // Cookie-аутентификация Sanctum SPA
    'supports_credentials' => true,

];
