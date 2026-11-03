<?php

namespace App\Services;

use App\Models\Order;

/**
 * Генерация человекочитаемых номеров заказов.
 * Формат: EK-2026-000123 — префикс магазина, год и порядковый номер.
 */
class OrderNumberGenerator
{
    public function generate(): string
    {
        $year = (int) now()->year;
        $next = (int) Order::query()->whereYear('created_at', $year)->count() + 1;

        do {
            $number = sprintf('EK-%d-%06d', $year, $next);
            $next++;
        } while (Order::query()->where('number', $number)->exists());

        return $number;
    }
}
