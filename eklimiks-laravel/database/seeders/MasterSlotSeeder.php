<?php

namespace Database\Seeders;

use App\Models\Master;
use App\Models\MasterSlot;
use App\Services\BookingService;
use Illuminate\Database\Seeder;

/**
 * Расписание мастеров на ближайшие 14 дней: 10:00–19:00 каждый час.
 * Воскресенья пропускаются — сервисный центр не работает.
 * Часть слотов помечена занятыми, чтобы интерфейс записи был наглядным.
 */
class MasterSlotSeeder extends Seeder
{
    private const TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

    public function run(BookingService $bookingService): void
    {
        $from = now()->toDateString();
        $to = now()->addDays(13)->toDateString();

        $masters = Master::query()->orderBy('id')->get();

        foreach ($masters as $index => $master) {
            $bookingService->generateSlots($master, $from, $to, self::TIMES);

            // Для демонстрации займём несколько слотов у каждого мастера
            $busyDates = [
                now()->addDay()->toDateString(),
                now()->addDays(3)->toDateString(),
            ];

            foreach ($busyDates as $busyDateOffset => $date) {
                foreach (self::TIMES as $timeIndex => $time) {
                    if (($timeIndex + $index + $busyDateOffset) % 4 !== 0) {
                        continue;
                    }

                    MasterSlot::query()
                        ->where('master_id', $master->id)
                        ->whereDate('date', $date)
                        ->where('time', $time . ':00')
                        ->update(['is_booked' => true]);
                }
            }
        }
    }
}
