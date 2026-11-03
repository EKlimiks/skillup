<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTradeInRequest;
use App\Http\Resources\TradeInResource;
use App\Models\TradeIn;
use App\Models\User;
use App\Services\TradeInCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Trade-In: расчёт стоимости и приём заявок на выкуп устройства.
 */
class TradeInController extends Controller
{
    public function __construct(private readonly TradeInCalculator $calculator)
    {
    }

    /**
     * POST /api/trade-in/estimate
     * Оценка стоимости без сохранения заявки — калькулятор на сайте.
     */
    public function estimate(Request $request): JsonResponse
    {
        // Поддерживаем как полные, так и короткие имена полей (model, condition, battery)
        $request->merge(array_filter([
            'device_model' => $request->input('device_model', $request->input('model')),
            'device_condition' => $request->input('device_condition', $request->input('condition')),
            'battery_health' => $request->input('battery_health', $request->input('battery')),
        ], fn ($value) => $value !== null));

        $data = $request->validate([
            'device_model' => ['required', 'string', 'min:2', 'max:120'],
            'storage' => ['nullable', 'string', 'max:64'],
            'device_condition' => ['required', 'in:perfect,good,fair,broken'],
            'battery_health' => ['nullable', 'integer', 'min:1', 'max:100'],
        ], [
            'device_model.required' => 'Укажите модель устройства.',
            'device_condition.required' => 'Выберите состояние устройства.',
            'device_condition.in' => 'Недопустимое состояние устройства.',
        ]);

        $breakdown = $this->calculator->breakdown(
            $data['device_model'],
            $data['device_condition'],
            $data['storage'] ?? null,
            isset($data['battery_health']) ? (int) $data['battery_health'] : null
        );

        return response()->json([
            'message' => 'Предварительная оценка устройства.',
            'estimated_price' => $breakdown['estimated_price'],
            // alias для React-клиента
            'estimated' => $breakdown['estimated_price'],
            'estimated_price_formatted' => number_format($breakdown['estimated_price'], 0, ',', ' ') . ' ₽',
            'breakdown' => $breakdown,
            'factors' => [
                'base' => $breakdown['base_value'],
                'fStore' => $breakdown['storage_factor'],
                'fCond' => $breakdown['condition_factor'],
                'fBat' => $breakdown['battery_factor'],
            ],
        ]);
    }

    /**
     * POST /api/trade-in — сохранить заявку на Trade-In.
     */
    public function store(StoreTradeInRequest $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        $data = $request->validated();

        $estimated = $this->calculator->estimate(
            $data['device_model'],
            $data['device_condition'],
            $data['storage'] ?? null,
            isset($data['battery_health']) ? (int) $data['battery_health'] : null
        );

        /** @var TradeIn $tradeIn */
        $tradeIn = TradeIn::query()->create([
            'user_id' => $user?->id,
            'device_model' => $data['device_model'],
            'storage' => $data['storage'] ?? null,
            'device_condition' => $data['device_condition'],
            'battery_health' => $data['battery_health'] ?? null,
            'estimated_price' => $estimated,
            'status' => TradeIn::STATUS_EVALUATED,
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
        ]);

        return response()->json([
            'message' => 'Заявка на Trade-In принята. Оценка: ' . number_format($estimated, 0, ',', ' ') . ' ₽',
            'data' => (new TradeInResource($tradeIn))->resolve(),
        ], 201);
    }

    /**
     * GET /api/profile/trade-ins — заявки Trade-In пользователя.
     */
    public function myTradeIns(Request $request): JsonResponse
    {
        $tradeIns = TradeIn::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => TradeInResource::collection($tradeIns)->resolve(),
        ]);
    }
}
