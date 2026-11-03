<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Лиды: форма «Заказать звонок» и другие интерактивные формы сайта.
 */
class LeadController extends Controller
{
    /**
     * POST /api/leads
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $data = $request->validated();

        /** @var Lead $lead */
        $lead = Lead::query()->create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'type' => $data['type'],
            'message' => $data['message'] ?? null,
            'status' => Lead::STATUS_NEW,
        ]);

        return response()->json([
            'message' => $this->responseMessage($lead->type),
            'data' => [
                'id' => $lead->id,
                'type' => $lead->type,
                'status' => $lead->status,
                'created_at' => $lead->created_at?->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * GET /api/leads/types — подсказка для фронтенда: доступные типы обращений.
     */
    public function types(): JsonResponse
    {
        return response()->json([
            'data' => collect(Lead::TYPE_LABELS)
                ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
                ->values(),
        ]);
    }

    private function responseMessage(string $type): string
    {
        return match ($type) {
            Lead::TYPE_CALLBACK => 'Заявка принята! Менеджер перезвонит в течение 15 минут.',
            Lead::TYPE_QUESTION => 'Вопрос отправлен. Мы ответим на указанный телефон или e-mail.',
            Lead::TYPE_TRADE_IN => 'Заявка на Trade-In принята, менеджер свяжется с вами.',
            Lead::TYPE_REPAIR => 'Заявка на ремонт принята, мастер свяжется с вами.',
            default => 'Заявка успешно отправлена.',
        };
    }
}
