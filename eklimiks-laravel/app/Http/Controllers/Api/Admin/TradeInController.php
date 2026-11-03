<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TradeInResource;
use App\Models\TradeIn;
use App\Services\TradeInCalculator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Заявки Trade-In: просмотр, пересчёт оценки, финальная цена и статус.
 */
class TradeInController extends Controller
{
    public function __construct(private readonly TradeInCalculator $calculator)
    {
    }

    /**
     * GET /api/admin/trade-ins
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TradeIn::query()->with('user');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('device_condition')) {
            $query->where('device_condition', $request->query('device_condition'));
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('device_model', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $perPage = max(1, min((int) $request->query('per_page', 20), 100));

        return TradeInResource::collection(
            $query->orderByDesc('created_at')->paginate($perPage)->withQueryString()
        );
    }

    /**
     * POST /api/admin/trade-ins — заявка, оформленная менеджером в магазине.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'device_model' => ['required', 'string', 'max:120'],
            'storage' => ['nullable', 'string', 'max:64'],
            'device_condition' => ['required', Rule::in(TradeIn::CONDITIONS)],
            'battery_health' => ['nullable', 'integer', 'min:1', 'max:100'],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'final_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', Rule::in(TradeIn::STATUSES)],
        ], [
            'device_model.required' => 'Укажите модель устройства.',
            'device_condition.required' => 'Укажите состояние устройства.',
        ]);

        $estimated = $this->calculator->estimate(
            $data['device_model'],
            $data['device_condition'],
            $data['storage'] ?? null,
            isset($data['battery_health']) ? (int) $data['battery_health'] : null
        );

        /** @var TradeIn $tradeIn */
        $tradeIn = TradeIn::query()->create([
            'user_id' => $data['user_id'] ?? null,
            'device_model' => $data['device_model'],
            'storage' => $data['storage'] ?? null,
            'device_condition' => $data['device_condition'],
            'battery_health' => $data['battery_health'] ?? null,
            'estimated_price' => $estimated,
            'final_price' => $data['final_price'] ?? null,
            'status' => $data['status'] ?? TradeIn::STATUS_EVALUATED,
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
        ]);

        return response()->json([
            'message' => 'Заявка Trade-In создана. Оценка: ' . number_format($estimated, 0, ',', ' ') . ' ₽',
            'data' => (new TradeInResource($tradeIn))->resolve(),
        ], 201);
    }

    /**
     * GET /api/admin/trade-ins/{trade_in}
     */
    public function show(TradeIn $tradeIn): JsonResponse
    {
        return response()->json([
            'data' => (new TradeInResource($tradeIn->load('user')))->resolve(),
        ]);
    }

    /**
     * PUT/PATCH /api/admin/trade-ins/{trade_in}
     */
    public function update(Request $request, TradeIn $tradeIn): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(TradeIn::STATUSES)],
            'final_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'device_condition' => ['sometimes', Rule::in(TradeIn::CONDITIONS)],
            'storage' => ['sometimes', 'nullable', 'string', 'max:64'],
            'battery_health' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100'],
            'device_model' => ['sometimes', 'string', 'max:120'],
            'customer_name' => ['sometimes', 'string', 'max:120'],
            'customer_phone' => ['sometimes', 'string', 'max:32'],
        ], [
            'status.in' => 'Недопустимый статус заявки.',
            'device_condition.in' => 'Недопустимое состояние устройства.',
        ]);

        $tradeIn->update($data);

        // Если изменились параметры оценки — пересчитываем предварительную стоимость
        if (array_intersect(['device_model', 'device_condition', 'storage', 'battery_health'], array_keys($data))) {
            $tradeIn->update([
                'estimated_price' => $this->calculator->estimate(
                    $tradeIn->device_model,
                    $tradeIn->device_condition,
                    $tradeIn->storage,
                    $tradeIn->battery_health
                ),
            ]);
        }

        return response()->json([
            'message' => 'Заявка Trade-In обновлена.',
            'data' => (new TradeInResource($tradeIn->fresh()->load('user')))->resolve(),
        ]);
    }

    /**
     * PATCH /api/admin/trade-ins/{trade_in}/status
     */
    public function updateStatus(Request $request, TradeIn $tradeIn): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(TradeIn::STATUSES)],
            'final_price' => ['nullable', 'numeric', 'min:0'],
        ], [
            'status.required' => 'Укажите новый статус заявки.',
            'status.in' => 'Недопустимый статус заявки.',
        ]);

        $tradeIn->update([
            'status' => $data['status'],
            'final_price' => $data['final_price'] ?? $tradeIn->final_price,
        ]);

        return response()->json([
            'message' => 'Статус заявки: ' . $tradeIn->fresh()->status_label,
            'data' => (new TradeInResource($tradeIn->fresh()->load('user')))->resolve(),
        ]);
    }

    /**
     * DELETE /api/admin/trade-ins/{trade_in}
     */
    public function destroy(TradeIn $tradeIn): JsonResponse
    {
        $tradeIn->delete();

        return response()->json([
            'message' => 'Заявка Trade-In удалена.',
        ]);
    }

    /**
     * POST /api/admin/trade-ins/recalculate — пересчитать оценку без сохранения.
     */
    public function recalculate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_model' => ['required', 'string', 'max:120'],
            'device_condition' => ['required', Rule::in(TradeIn::CONDITIONS)],
            'storage' => ['nullable', 'string', 'max:64'],
            'battery_health' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json([
            'data' => $this->calculator->breakdown(
                $data['device_model'],
                $data['device_condition'],
                $data['storage'] ?? null,
                isset($data['battery_health']) ? (int) $data['battery_health'] : null
            ),
        ]);
    }
}
