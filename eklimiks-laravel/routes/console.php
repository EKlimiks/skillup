<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| Здесь описываются консольные команды приложения. В дипломном проекте
| дополнительных artisan-команд нет, файл нужен для полноты скелета.
|
*/

Artisan::command('eklimiks:about', function () {
    /** @var Application $app */
    $app = app();
    $this->info('EKlimiks API — магазин техники Apple.');
    $this->line('Laravel: ' . $app->version());
    $this->line('PHP: ' . PHP_VERSION);
    $this->line('Окружение: ' . $app->environment());
})->purpose('Показать информацию о проекте EKlimiks');
