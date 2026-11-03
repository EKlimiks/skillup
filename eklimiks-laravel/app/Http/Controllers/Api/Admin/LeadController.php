<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Лиды из форм сайта: просмотр, смена статуса, удаление.
 */
class LeadController extends Controller
{
    /**
     * GET /api/admin/leads
     */
    public function index(Request $request): JsonResponse
    {
        $query = Lead::query();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $perPage = max(1, min((int) $request->query('per_page', 20), 100));
        $paginated = $query->orderByDesc('created_at')->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => collect($paginated->items())->map(fn (Lead $lead) => [
                'id' => $lead->id,
                'name' => $lead->name,
                'phone' => $lead->phone,
                'type' => $lead->type,
                'type_label' => $lead->type_label,
                'message' => $lead->message,
                'status' => $lead->status,
                'status_label' => $lead->status_label,
                'created_at' => $lead->created_at?->toIso8601String(),
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
     * GET /api/admin/leads/{lead}
     */
    public function show(Lead $lead): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $lead->id,
                'name' => $lead->name,
                'phone' => $lead->phone,
                'type' => $lead->type,
                'type_label' => $lead->type_label,
                'message' => $lead->message,
                'status' => $lead->status,
                'status_label' => $lead->status_label,
                'created_at' => $lead->created_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * PUT/PATCH /api/admin/leads/{lead}
     */
    public function update(Request $request, Lead $lead): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Lead::STATUSES)],
        ], [
            'status.required' => 'Укажите статус обращения.',
            'status.in' => 'Недопустимый статус обращения.',
        ]);

        $lead->update($data);

        return response()->json([
            'message' => 'Статус обращения: ' . $lead->fresh()->status_label,
            'data' => [
                'id' => $lead->id,
                'status' => $lead->status,
                'status_label' => $lead->status_label,
            ],
        ]);
    }

    /**
     * DELETE /api/admin/leads/{lead}
     */
    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();

        return response()->json([
            'message' => 'Обращение удалено.',
        ]);
    }
}
