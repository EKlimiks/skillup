<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRepairRequest;
use App\Http\Resources\RepairRequestResource;
use App\Models\Master;
use App\Models\RepairRequest;
use App\Models\RepairService;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Сервисный центр: услуги, мастера, свободные слоты и заявки на ремонт.
 */
class RepairController extends Controller
{
    public function __construct(private readonly BookingService $bookingService)
    {
    }

    /**
     * GET /api/repair-services
     */
    public function services(): JsonResponse
    {
        $services = RepairService::query()->ordered()->get()->map(fn (RepairService $service) => [
            'id' => $service->id,
            'slug' => $service->slug,
            'name' => $service->name,
            'description' => $service->description,
            'price_from' => (float) $service->price_from,
            'duration_minutes' => (int) $service->duration_minutes,
            'duration_label' => $service->duration_label,
        ]);

        return response()->json(['data' => $services]);
    }

    /**
     * GET /api/masters — мастера с их специализациями.
     */
    public function masters(Request $request): JsonResponse
    {
        $query = Master::query()->active()->ordered();

        if ($request->filled('specialization')) {
            $query->where('specialization', 'like', '%' . $request->query('specialization') . '%');
        }

        $masters = $query->get()->map(fn (Master $master) => [
            'id' => $master->id,
            'name' => $master->name,
            'specialization' => $master->specialization,
            'experience_years' => (int) $master->experience_years,
            'rating' => (float) $master->rating,
        ]);

        return response()->json(['data' => $masters]);
    }

    /**
     * GET /api/masters/{master}/slots?date=YYYY-MM-DD
     * Возвращает ТОЛЬКО свободные слоты выбранного мастера на дату.
     */
    public function masterSlots(Request $request, Master $master): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ], [
            'date.required' => 'Укажите дату в формате ГГГГ-ММ-ДД.',
            'date.date_format' => 'Неверный формат даты, ожидается ГГГГ-ММ-ДД.',
        ]);

        $date = $data['date'];
        $slots = $this->bookingService->availableSlots($master, $date);

        return response()->json([
            'master' => [
                'id' => $master->id,
                'name' => $master->name,
                'specialization' => $master->specialization,
                'experience_years' => (int) $master->experience_years,
                'rating' => (float) $master->rating,
            ],
            'date' => $date,
            'is_sunday' => \Illuminate\Support\Carbon::parse($date)->dayOfWeek === 0,
            'free_slots_count' => $slots->count(),
            'slots' => $slots->map(fn ($slot) => [
                'id' => $slot->id,
                'date' => $slot->date?->toDateString(),
                'time' => $slot->time_short,
                'is_booked' => false,
            ])->values(),
            // Краткий список времени — для клиентов, которые ждут просто массив «ЧЧ:ММ»
            'times' => $slots->map(fn ($slot) => $slot->time_short)->values(),
            'calendar' => $this->bookingService->availabilityCalendar($master, 14),
        ]);
    }

    /**
     * POST /api/repair-requests
     * Создание заявки; при выборе слота время занимается в транзакции.
     */
    public function store(StoreRepairRequest $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        $data = $request->validated();

        /** @var RepairRequest $repairRequest */
        $repairRequest = RepairRequest::query()->create([
            'user_id' => $user?->id,
            'repair_service_id' => $data['repair_service_id'],
            'master_id' => $data['master_id'] ?? null,
            'device_model' => $data['device_model'],
            'issue' => $data['issue'],
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
            'status' => RepairRequest::STATUS_NEW,
        ]);

        // Онлайн-запись: занимаем выбранный слот мастера
        if (! empty($data['master_slot_id'])) {
            try {
                $this->bookingService->book($repairRequest, (int) $data['master_slot_id']);
            } catch (RuntimeException $e) {
                // Заявку откатываем, чтобы не оставить «висящую» запись без времени
                $repairRequest->delete();

                return response()->json([
                    'message' => $e->getMessage(),
                    'errors' => ['master_slot_id' => [$e->getMessage()]],
                ], 409);
            }
        }

        return response()->json([
            'message' => 'Заявка на ремонт принята. Мастер свяжется с вами для подтверждения.',
            'data' => (new RepairRequestResource(
                $repairRequest->load(['service', 'master', 'slot'])
            ))->resolve(),
        ], 201);
    }

    /**
     * GET /api/profile/repairs — заявки пользователя на ремонт.
     */
    public function myRepairs(Request $request): JsonResponse
    {
        $repairs = RepairRequest::query()
            ->with(['service', 'master', 'slot'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => RepairRequestResource::collection($repairs)->resolve(),
        ]);
    }
}
