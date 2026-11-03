<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Master;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Онлайн-бронирование визита в магазин с выбором свободного времени.
 *
 * Свободные слоты магазина формируются из часов работы и уже существующих
 * бронирований: занятое время в списке не появляется.
 */
class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookingService)
    {
    }

    /**
     * GET /api/stores — точки продаж.
     */
    public function stores(): JsonResponse
    {
        $stores = Store::query()->orderBy('id')->get()->map(fn (Store $store) => [
            'id' => $store->id,
            'name' => $store->name,
            'address' => $store->address,
            'phone' => $store->phone,
            'work_hours' => $store->work_hours,
        ]);

        return response()->json(['data' => $stores]);
    }

    /**
     * GET /api/stores/{store}/slots?date=YYYY-MM-DD[&product_id=]
     * Возвращает только свободное время выбранного магазина на дату.
     */
    public function storeSlots(Request $request, Store $store): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ], [
            'date.required' => 'Укажите дату визита в формате ГГГГ-ММ-ДД.',
            'date.date_format' => 'Неверный формат даты, ожидается ГГГГ-ММ-ДД.',
        ]);

        $date = Carbon::parse($data['date'])->startOfDay();

        if ($date->isPast() && ! $date->isToday()) {
            return response()->json([
                'date' => $date->toDateString(),
                'store' => ['id' => $store->id, 'name' => $store->name],
                'slots' => [],
                'message' => 'На прошедшую дату запись недоступна.',
            ]);
        }

        $taken = Booking::query()
            ->where('store_id', $store->id)
            ->whereDate('slot_date', $date->toDateString())
            ->whereNotIn('status', [Booking::STATUS_CANCELLED])
            ->pluck('slot_time')
            ->map(fn ($time) => substr((string) $time, 0, 5))
            ->all();

        $all = $this->slotTimes($store->work_hours);
        $now = now();

        $free = collect($all)
            ->reject(fn (string $time) => in_array($time, $taken, true))
            ->reject(function (string $time) use ($date, $now) {
                // Сегодня прошедшее время не показываем
                return $date->isToday() && Carbon::parse($date->toDateString() . ' ' . $time)->lessThanOrEqualTo($now);
            })
            ->values();

        return response()->json([
            'date' => $date->toDateString(),
            'is_sunday' => $date->dayOfWeek === 0,
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'phone' => $store->phone,
                'work_hours' => $store->work_hours,
            ],
            'slots' => $free->map(fn (string $time) => ['time' => $time, 'is_free' => true]),
            'taken' => array_values($taken),
        ]);
    }

    /**
     * GET /api/booking-slots?date=YYYY-MM-DD[&master_id=]
     * Универсальный эндпоинт: свободные слоты по всем магазинам и мастерам на дату.
     */
    public function slots(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'master_id' => ['nullable', 'integer', 'exists:masters,id'],
        ], [
            'date.required' => 'Укажите дату в формате ГГГГ-ММ-ДД.',
        ]);

        $date = $data['date'];
        $payload = [];

        if (! empty($data['master_id'])) {
            /** @var Master $master */
            $master = Master::query()->findOrFail($data['master_id']);
            $payload['masters'][] = [
                'master_id' => $master->id,
                'master_name' => $master->name,
                'specialization' => $master->specialization,
                'slots' => $this->freeSlotsPayload($master, $date),
            ];
        } else {
            foreach (Master::query()->active()->ordered()->get() as $master) {
                $payload['masters'][] = [
                    'master_id' => $master->id,
                    'master_name' => $master->name,
                    'specialization' => $master->specialization,
                    'slots' => $this->freeSlotsPayload($master, $date),
                ];
            }
        }

        $payload['stores'] = Store::query()->orderBy('id')->get()->map(function (Store $store) use ($date) {
            $taken = Booking::query()
                ->where('store_id', $store->id)
                ->whereDate('slot_date', $date)
                ->whereNotIn('status', [Booking::STATUS_CANCELLED])
                ->pluck('slot_time')
                ->map(fn ($time) => substr((string) $time, 0, 5))
                ->all();

            return [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'free_times' => collect($this->slotTimes($store->work_hours))
                    ->reject(fn (string $time) => in_array($time, $taken, true))
                    ->values(),
            ];
        });

        $payload['date'] = $date;

        return response()->json($payload);
    }

    /**
     * POST /api/bookings — забронировать визит в магазин.
     */
    public function store(StoreBookingRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        /** @var Product $product */
        $product = Product::query()->findOrFail($data['product_id']);

        $time = strlen($data['slot_time']) === 5 ? $data['slot_time'] . ':00' : $data['slot_time'];

        $exists = Booking::query()
            ->where('store_id', $data['store_id'])
            ->whereDate('slot_date', $data['slot_date'])
            ->where('slot_time', $time)
            ->whereNotIn('status', [Booking::STATUS_CANCELLED])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'slot_time' => ['Это время уже занято. Выберите, пожалуйста, другое.'],
            ]);
        }

        /** @var Booking $booking */
        $booking = Booking::query()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'store_id' => $data['store_id'],
            'slot_date' => $data['slot_date'],
            'slot_time' => $time,
            'status' => Booking::STATUS_NEW,
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
        ]);

        // Если выбрано время приёма у мастера — занимаем мастер-слот
        if (! empty($data['master_slot_id'])) {
            $slot = $this->bookingService->availableSlots(
                Master::query()->findOrFail($data['master_id'] ?? 0),
                $data['slot_date']
            )->firstWhere('id', (int) $data['master_slot_id']);

            if ($slot) {
                $slot->forceFill(['is_booked' => true])->save();
            }
        }

        return response()->json([
            'message' => 'Визит забронирован! Мы отправим подтверждение по указанному телефону.',
            'data' => (new BookingResource($booking->load(['product', 'store'])))->resolve(),
        ], 201);
    }

    /**
     * GET /api/profile/bookings — история бронирований пользователя.
     */
    public function myBookings(Request $request): JsonResponse
    {
        $bookings = Booking::query()
            ->with(['product', 'store'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('slot_date')
            ->orderByDesc('slot_time')
            ->get();

        return response()->json([
            'data' => BookingResource::collection($bookings)->resolve(),
        ]);
    }

    // -----------------------------------------------------------------
    // Служебные методы
    // -----------------------------------------------------------------

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function freeSlotsPayload(Master $master, string $date): Collection
    {
        return $this->bookingService->availableSlots($master, $date)
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'date' => $slot->date?->toDateString(),
                'time' => $slot->time_short,
            ])
            ->values();
    }

    /**
     * Часы работы магазина → список времени с шагом в час.
     * «10:00–21:00» → 10:00 … 20:00.
     *
     * @return array<int, string>
     */
    private function slotTimes(?string $workHours): array
    {
        $default = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

        if (! $workHours || ! preg_match('/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/u', $workHours, $m)) {
            return $default;
        }

        $start = (int) $m[1];
        $end = (int) $m[3];

        if ($end <= $start) {
            return $default;
        }

        $times = [];
        for ($hour = $start; $hour < $end; $hour++) {
            $times[] = sprintf('%02d:00', $hour);
        }

        return $times !== [] ? $times : $default;
    }
}
