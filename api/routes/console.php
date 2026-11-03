<?php

use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console-маршруты
|--------------------------------------------------------------------------
|
| Служебная команда со сведениями о приложении.
|
*/

Artisan::command('skillup:about', function () {
    $this->info('SkillUp API — развивайте навыки короткими уроками.');
    $this->line('Laravel: ' . app()->version());
    $this->line('PHP: ' . PHP_VERSION);
    $this->line('Окружение: ' . app()->environment());
})->purpose('Показать информацию о проекте SkillUp');
