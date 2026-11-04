<?php

namespace App\Providers;

use App\Services\BookingService;
use App\Services\TradeInCalculator;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Регистрация сервисов приложения.
     */
    public function register(): void
    {
        // Калькулятор Trade-In и сервис записи — singleton'ы, состояние не хранят
        $this->app->singleton(TradeInCalculator::class);
        $this->app->singleton(BookingService::class);
    }

    /**
     * Запуск сервисов приложения.
     */
    public function boot(): void
    {
        // В продакшене (за nginx) все ссылки должны быть https
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
