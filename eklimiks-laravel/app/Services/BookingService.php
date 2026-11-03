<?php

namespace App\Services;

use App\Models\Master;
use App\Models\MasterSlot;
use App\Models\RepairRequest;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Логика онлайн-записи к мастеру: свободные слоты и бронирование.
 */
class BookingService
{
    /**
     * Свободные слоты мастера на конкретную дату.
     * Возвращаются только записи с is_booked = false (данные берутся из БД).
     *
     * @return EloquentCollection<int, MasterSlot>
     */
    public function availableSlots(Master $master, string $date): EloquentCollection
    {
        return MasterSlot::query()
            ->where('master_id', $master->id)
            ->whereDate('date', $date)
            ->where('is_booked', false)
            ->orderBy('time')
            ->get();
    }

    /**
     * Все слоты мастера на дату (и свободные, и занятые) — для админки.
     *
     * @return EloquentCollection<int, MasterSlot>
     */
    public function allSlots(Master $master, string $date): EloquentCollection
    {
        return MasterSlot::query()
            ->where('master_id', $master->id)
            ->whereDate('date', $date)
            ->orderBy('time')
            ->get();
    }

    /**
     * Занять слот под заявку на ремонт.
     *
     * Внутри транзакции берём блокировку строки (lockForUpdate), проверяем,
     * что слот ещё свободен и принадлежит нужному мастеру, затем помечаем его
     * занятым и привязываем к заявке.
     *
     * @throws RuntimeException если слот уже занят или не найден
     */
    public function book(RepairRequest $repairRequest, int $slotId): MasterSlot
    {
        return DB::transaction(function () use ($repairRequest, $slotId): MasterSlot {
            /** @var MasterSlot|null $slot */
            $slot = MasterSlot::query()
                ->whereKey($slotId)
                ->lockForUpdate()
                ->first();

            if (! $slot) {
                throw new RuntimeException('Выбранное время приёма не найдено.');
            }

            if ($slot->is_booked) {
                throw new RuntimeException('Это время уже занято. Пожалуйста, выберите другое.');
            }

            if ($repairRequest->master_id !== null && (int) $repairRequest->master_id !== (int) $slot->master_id) {
                throw new RuntimeException('Выбранное время не принадлежит выбранному мастеру.');
            }

            $slot->is_booked = true;
            $slot->save();

            $repairRequest->forceFill([
                'master_id' => $slot->master_id,
                'master_slot_id' => $slot->id,
            ])->save();

            return $slot->refresh();
        });
    }

    /**
     * Освободить слот (например, при отмене заявки администратором).
     */
    public function release(MasterSlot $slot): MasterSlot
    {
        $slot->forceFill(['is_booked' => false])->save();

        return $slot;
    }

    /**
     * Сгенерировать слоты мастеру на диапазон дат.
     * Воскресенья пропускаются — сервисный центр не работает.
     *
     * @param  array<int, string>  $times  Список времени в формате H:i
     * @return int количество созданных слотов
     */
    public function generateSlots(Master $master, string $fromDate, string $toDate, array $times = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']): int
    {
        $created = 0;
        $cursor = \Illuminate\Support\Carbon::parse($fromDate)->startOfDay();
        $end = \Illuminate\Support\Carbon::parse($toDate)->startOfDay();

        while ($cursor->lessThanOrEqualTo($end)) {
            // 0 = воскресенье
            if ($cursor->dayOfWeek !== 0) {
                foreach ($times as $time) {
                    $slot = MasterSlot::query()->firstOrCreate(
                        [
                            'master_id' => $master->id,
                            'date' => $cursor->toDateString(),
                            'time' => strlen($time) === 5 ? $time . ':00' : $time,
                        ],
                        ['is_booked' => false]
                    );

                    if ($slot->wasRecentlyCreated) {
                        $created++;
                    }
                }
            }

            $cursor->addDay();
        }

        return $created;
    }

    /**
     * Сводка свободных слотов по дням (для календаря на фронтенде).
     *
     * @return array<int, array{date: string, free_slots: int}>
     */
    public function availabilityCalendar(Master $master, int $days = 14): array
    {
        $from = now()->toDateString();
        $to = now()->addDays($days)->toDateString();

        $rows = MasterSlot::query()
            ->selectRaw('date, COUNT(*) as free_slots')
            ->where('master_id', $master->id)
            ->whereBetween('date', [$from, $to])
            ->where('is_booked', false)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $rows->map(fn ($row) => [
            'date' => \Illuminate\Support\Carbon::parse($row->date)->toDateString(),
            'free_slots' => (int) $row->free_slots,
        ])->all();
    }
}
