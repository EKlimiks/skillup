<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Master;
use App\Models\MasterSlot;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Расписание мастеров: генерация слотов и ручное управление занятостью.
 */
class SlotController extends Controller
{
    public function __construct(private readonly BookingService $bookingService)
    {
    }

    /**
     * GET /api/admin/master-slots
     * Фильтры: master_id, date, date_from, date_to, is_booked, per_page.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MasterSlot::query()->with('master');

        if ($request->filled('master_id')) {
            $query->where('master_id', (int) $request->query('master_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->query('date'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->query('date_to'));
        }

        if ($request->filled('is_booked')) {
            $query->where('is_booked', $request->boolean('is_booked'));
        }

        $perPage = max(1, min((int) $request->query('per_page', 50), 500));

        if ($request->boolean('grouped')) {
            $slots = $query->orderBy('date')->orderBy('time')->get();

            return response()->json([
                'data' => $slots->groupBy(fn (MasterSlot $slot) => $slot->master_id . '|' . $slot->date?->toDateString())
                    ->map(function ($group) {
                        /** @var MasterSlot $first */
                        $first = $group->first();

                        return [
                            'master_id' => $first->master_id,
                            'master_name' => $first->master?->name,
                            'date' => $first->date?->toDateString(),
                            'total' => $group->count(),
                            'free' => $group->where('is_booked', false)->count(),
                            'booked' => $group->where('is_booked', true)->count(),
                            'slots' => $group->map(fn (MasterSlot $slot) => [
                                'id' => $slot->id,
                                'time' => $slot->time_short,
                                'is_booked' => (bool) $slot->is_booked,
                            ])->values(),
                        ];
                    })
                    ->values(),
            ]);
        }

        $paginated = $query->orderBy('date')->orderBy('time')->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => collect($paginated->items())->map(fn (MasterSlot $slot) => [
                'id' => $slot->id,
                'master_id' => $slot->master_id,
                'master_name' => $slot->master?->name,
                'date' => $slot->date?->toDateString(),
                'time' => $slot->time_short,
                'is_booked' => (bool) $slot->is_booked,
            ])->values(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/master-slots — создать один слот.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'master_id' => ['required', 'integer', 'exists:masters,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'is_booked' => ['nullable', 'boolean'],
        ], [
            'master_id.required' => 'Выберите мастера.',
            'date.required' => 'Укажите дату в формате ГГГГ-ММ-ДД.',
            'time.required' => 'Укажите время в формате ЧЧ:ММ.',
        ]);

        $exists = MasterSlot::query()
            ->where('master_id', $data['master_id'])
            ->whereDate('date', $data['date'])
            ->where('time', $data['time'] . ':00')
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Такой слот уже существует.',
                'errors' => ['time' => ['У мастера уже есть слот на это время.']],
            ], 422);
        }

        /** @var MasterSlot $slot */
        $slot = MasterSlot::query()->create([
            'master_id' => $data['master_id'],
            'date' => $data['date'],
            'time' => $data['time'] . ':00',
            'is_booked' => (bool) ($data['is_booked'] ?? false),
        ]);

        return response()->json([
            'message' => 'Слот добавлен в расписание.',
            'data' => [
                'id' => $slot->id,
                'master_id' => $slot->master_id,
                'date' => $slot->date?->toDateString(),
                'time' => $slot->time_short,
                'is_booked' => (bool) $slot->is_booked,
            ],
        ], 201);
    }

    /**
     * GET /api/admin/master-slots/{master_slot}
     */
    public function show(MasterSlot $masterSlot): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $masterSlot->id,
                'master_id' => $masterSlot->master_id,
                'master_name' => $masterSlot->master?->name,
                'date' => $masterSlot->date?->toDateString(),
                'time' => $masterSlot->time_short,
                'is_booked' => (bool) $masterSlot->is_booked,
            ],
        ]);
    }

    /**
     * PUT/PATCH /api/admin/master-slots/{master_slot}
     */
    public function update(Request $request, MasterSlot $masterSlot): JsonResponse
    {
        $data = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'time' => ['sometimes', 'date_format:H:i'],
            'is_booked' => ['sometimes', 'boolean'],
            'master_id' => ['sometimes', 'integer', 'exists:masters,id'],
        ]);

        if (isset($data['time']) && strlen($data['time']) === 5) {
            $data['time'] .= ':00';
        }

        $masterSlot->update($data);

        return response()->json([
            'message' => 'Слот обновлён.',
            'data' => [
                'id' => $masterSlot->id,
                'master_id' => $masterSlot->master_id,
                'date' => $masterSlot->fresh()->date?->toDateString(),
                'time' => $masterSlot->fresh()->time_short,
                'is_booked' => (bool) $masterSlot->fresh()->is_booked,
            ],
        ]);
    }

    /**
     * DELETE /api/admin/master-slots/{master_slot}
     */
    public function destroy(MasterSlot $masterSlot): JsonResponse
    {
        if ($masterSlot->is_booked) {
            return response()->json([
                'message' => 'Нельзя удалить занятый слот: на это время записан клиент.',
            ], 409);
        }

        $masterSlot->delete();

        return response()->json([
            'message' => 'Слот удалён из расписания.',
        ]);
    }

    /**
     * PATCH /api/admin/master-slots/{master_slot}/toggle — занять/освободить слот.
     */
    public function toggle(MasterSlot $masterSlot): JsonResponse
    {
        $masterSlot->update(['is_booked' => ! $masterSlot->is_booked]);

        return response()->json([
            'message' => $masterSlot->is_booked ? 'Слот помечен как занятый.' : 'Слот освобождён.',
            'data' => [
                'id' => $masterSlot->id,
                'is_booked' => (bool) $masterSlot->is_booked,
                'date' => $masterSlot->date?->toDateString(),
                'time' => $masterSlot->time_short,
            ],
        ]);
    }

    /**
     * POST /api/admin/master-slots/generate — массовая генерация расписания.
     * Тело: { master_id, date_from, date_to, times?: ["10:00", ...] }
     * Воскресенья пропускаются.
     */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'master_id' => ['required', 'integer', 'exists:masters,id'],
            'date_from' => ['required', 'date_format:Y-m-d'],
            'date_to' => ['required', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'times' => ['nullable', 'array'],
            'times.*' => ['date_format:H:i'],
        ], [
            'master_id.required' => 'Выберите мастера.',
            'date_from.required' => 'Укажите начальную дату.',
            'date_to.required' => 'Укажите конечную дату.',
            'date_to.after_or_equal' => 'Конечная дата должна быть не раньше начальной.',
            'times.*.date_format' => 'Время указывается в формате ЧЧ:ММ.',
        ]);

        /** @var Master $master */
        $master = Master::query()->findOrFail($data['master_id']);

        $created = $this->bookingService->generateSlots(
            $master,
            $data['date_from'],
            $data['date_to'],
            $data['times'] ?? ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
        );

        return response()->json([
            'message' => "Создано новых слотов: {$created}.",
            'created' => $created,
            'total_slots' => MasterSlot::query()->where('master_id', $master->id)->count(),
        ]);
    }
}
