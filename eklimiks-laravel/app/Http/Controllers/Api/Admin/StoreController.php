<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Точки продаж (магазины), доступные для бронирования визита.
 */
class StoreController extends Controller
{
    /**
     * GET /api/admin/stores
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Store::query()->orderBy('id')->get()->map(fn (Store $store) => [
                'id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'phone' => $store->phone,
                'work_hours' => $store->work_hours,
                'bookings_count' => $store->bookings()->count(),
            ]),
        ]);
    }

    /**
     * POST /api/admin/stores
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);

        /** @var Store $store */
        $store = Store::query()->create($data);

        return response()->json([
            'message' => "Магазин «{$store->name}» добавлен.",
            'data' => $store,
        ], 201);
    }

    /**
     * GET /api/admin/stores/{store}
     */
    public function show(Store $store): JsonResponse
    {
        return response()->json(['data' => $store]);
    }

    /**
     * PUT/PATCH /api/admin/stores/{store}
     */
    public function update(Request $request, Store $store): JsonResponse
    {
        $store->update($this->validateData($request));

        return response()->json([
            'message' => 'Данные магазина обновлены.',
            'data' => $store->fresh(),
        ]);
    }

    /**
     * DELETE /api/admin/stores/{store}
     */
    public function destroy(Store $store): JsonResponse
    {
        if ($store->bookings()->exists()) {
            return response()->json([
                'message' => 'Нельзя удалить магазин: по нему есть бронирования.',
            ], 409);
        }

        $name = $store->name;
        $store->delete();

        return response()->json([
            'message' => "Магазин «{$name}» удалён.",
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:191'],
            'address' => ['required', 'string', 'min:5', 'max:255'],
            'phone' => ['required', 'string', 'min:6', 'max:32'],
            'work_hours' => ['required', 'string', 'max:120'],
        ], [
            'name.required' => 'Укажите название магазина.',
            'address.required' => 'Укажите адрес магазина.',
            'phone.required' => 'Укажите телефон магазина.',
            'work_hours.required' => 'Укажите часы работы, например «10:00–21:00».',
        ]);
    }
}
