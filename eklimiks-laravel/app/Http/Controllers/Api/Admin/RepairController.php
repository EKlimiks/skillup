<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\RepairRequestResource;
use App\Models\Master;
use App\Models\RepairRequest;
use App\Services\BookingService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Заявки на ремонт: просмотр, смена статуса, назначение мастера и цены.
 */
class RepairController extends Controller
{
    public function __construct(private readonly BookingService $bookingService)
    {
    }

    /**
     * GET /api/admin/repair-requests
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = RepairRequest::query()->with(['service', 'master', 'slot', 'user']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('master_id')) {
            $query->where('master_id', (int) $request->query('master_id'));
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('device_model', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('issue', 'like', "%{$search}%");
            });
        }

        $perPage = max(1, min((int) $request->query('per_page', 20), 100));

        return RepairRequestResource::collection(
            $query->orderByDesc('created_at')->paginate($perPage)->withQueryString()
        );
    }

    /**
     * POST /api/admin/repair-requests — создать заявку вручную (по звонку).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'repair_service_id' => ['required', 'integer', 'exists:repair_services,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'master_id' => ['nullable', 'integer', 'exists:masters,id'],
            'master_slot_id' => ['nullable', 'integer', 'exists:master_slots,id'],
            'device_model' => ['required', 'string', 'max:120'],
            'issue' => ['required', 'string', 'min:5'],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'status' => ['nullable', Rule::in(RepairRequest::STATUSES)],
            'price' => ['nullable', 'numeric', 'min:0'],
        ], [
            'repair_service_id.required' => 'Выберите услугу ремонта.',
            'device_model.required' => 'Укажите модель устройства.',
            'issue.required' => 'Опишите неисправность.',
        ]);

        /** @var RepairRequest $repairRequest */
        $repairRequest = RepairRequest::query()->create([
            'user_id' => $data['user_id'] ?? null,
            'repair_service_id' => $data['repair_service_id'],
            'master_id' => $data['master_id'] ?? null,
            'device_model' => $data['device_model'],
            'issue' => $data['issue'],
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
            'status' => $data['status'] ?? RepairRequest::STATUS_NEW,
            'price' => $data['price'] ?? null,
        ]);

        if (! empty($data['master_slot_id'])) {
            $this->bookingService->book($repairRequest, (int) $data['master_slot_id']);
        }

        return response()->json([
            'message' => 'Заявка на ремонт создана.',
            'data' => (new RepairRequestResource($repairRequest->load(['service', 'master', 'slot'])))->resolve(),
        ], 201);
    }

    /**
     * GET /api/admin/repair-requests/{repair_request}
     */
    public function show(RepairRequest $repairRequest): JsonResponse
    {
        return response()->json([
            'data' => (new RepairRequestResource(
                $repairRequest->load(['service', 'master', 'slot', 'user'])
            ))->resolve(),
        ]);
    }

    /**
     * PUT/PATCH /api/admin/repair-requests/{repair_request}
     */
    public function update(Request $request, RepairRequest $repairRequest): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(RepairRequest::STATUSES)],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'master_id' => ['sometimes', 'nullable', 'integer', 'exists:masters,id'],
            'issue' => ['sometimes', 'string', 'min:5'],
            'device_model' => ['sometimes', 'string', 'max:120'],
            'customer_name' => ['sometimes', 'string', 'max:120'],
            'customer_phone' => ['sometimes', 'string', 'max:32'],
        ], [
            'status.in' => 'Недопустимый статус заявки.',
            'master_id.exists' => 'Мастер не найден.',
        ]);

        $repairRequest->update($data);

        // При отмене заявки освобождаем слот мастера
        if (($data['status'] ?? null) === RepairRequest::STATUS_CANCELLED && $repairRequest->slot) {
            $this->bookingService->release($repairRequest->slot);
        }

        return response()->json([
            'message' => 'Заявка обновлена.',
            'data' => (new RepairRequestResource(
                $repairRequest->fresh()->load(['service', 'master', 'slot', 'user'])
            ))->resolve(),
        ]);
    }

    /**
     * PATCH /api/admin/repair-requests/{repair_request}/status
     */
    public function updateStatus(Request $request, RepairRequest $repairRequest): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(RepairRequest::STATUSES)],
        ], [
            'status.required' => 'Укажите новый статус заявки.',
            'status.in' => 'Недопустимый статус заявки.',
        ]);

        $repairRequest->update(['status' => $data['status']]);

        if ($data['status'] === RepairRequest::STATUS_CANCELLED && $repairRequest->slot) {
            $this->bookingService->release($repairRequest->slot);
        }

        return response()->json([
            'message' => 'Статус заявки: ' . $repairRequest->fresh()->status_label,
            'data' => (new RepairRequestResource(
                $repairRequest->fresh()->load(['service', 'master', 'slot'])
            ))->resolve(),
        ]);
    }

    /**
     * DELETE /api/admin/repair-requests/{repair_request}
     */
    public function destroy(RepairRequest $repairRequest): JsonResponse
    {
        if ($repairRequest->slot) {
            $this->bookingService->release($repairRequest->slot);
        }

        $repairRequest->delete();

        return response()->json([
            'message' => 'Заявка на ремонт удалена.',
        ]);
    }

    /**
     * GET /api/admin/repair-requests/masters — справочник мастеров для назначения.
     */
    public function masters(): JsonResponse
    {
        return response()->json([
            'data' => Master::query()->ordered()->get()->map(fn (Master $master) => [
                'id' => $master->id,
                'name' => $master->name,
                'specialization' => $master->specialization,
                'experience_years' => (int) $master->experience_years,
                'rating' => (float) $master->rating,
                'is_active' => (bool) $master->is_active,
            ]),
        ]);
    }
}
