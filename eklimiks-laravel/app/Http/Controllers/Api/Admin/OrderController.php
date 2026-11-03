<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Управление заказами: просмотр, смена статуса, удаление, статистика.
 */
class OrderController extends Controller
{
    /**
     * GET /api/admin/orders
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::query()->with(['items.product', 'user']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('delivery_type')) {
            $query->where('delivery_type', $request->query('delivery_type'));
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->query('date_to'));
        }

        $perPage = max(1, min((int) $request->query('per_page', 20), 100));

        return OrderResource::collection(
            $query->orderByDesc('created_at')->paginate($perPage)->withQueryString()
        );
    }

    /**
     * GET /api/admin/orders/{order}
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'data' => (new OrderResource($order->load(['items.product', 'user'])))->resolve(),
        ]);
    }

    /**
     * POST /api/admin/orders — ручное создание заказа менеджером.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'status' => ['nullable', Rule::in(Order::STATUSES)],
            'delivery_type' => ['required', Rule::in([Order::DELIVERY_PICKUP, Order::DELIVERY_COURIER])],
            'address' => ['nullable', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
        ], [
            'user_id.required' => 'Выберите клиента.',
            'items.required' => 'Добавьте хотя бы один товар.',
            'items.*.product_id.exists' => 'Товар не найден.',
        ]);

        $order = DB::transaction(function () use ($data) {
            $total = 0.0;
            $lines = [];

            foreach ($data['items'] as $item) {
                $product = \App\Models\Product::query()->lockForUpdate()->findOrFail($item['product_id']);
                $price = (float) $product->price;
                $total += $price * (int) $item['qty'];

                $lines[] = [
                    'product_id' => $product->id,
                    'qty' => (int) $item['qty'],
                    'price' => $price,
                ];
            }

            $order = Order::query()->create([
                'user_id' => (int) $data['user_id'],
                'number' => app(\App\Services\OrderNumberGenerator::class)->generate(),
                'status' => $data['status'] ?? Order::STATUS_NEW,
                'total' => round($total, 2),
                'delivery_type' => $data['delivery_type'],
                'address' => $data['address'] ?? null,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'comment' => $data['comment'] ?? null,
            ]);

            $order->items()->createMany($lines);

            return $order;
        });

        return response()->json([
            'message' => "Заказ {$order->number} создан.",
            'data' => (new OrderResource($order->load(['items.product', 'user'])))->resolve(),
        ], 201);
    }

    /**
     * PUT/PATCH /api/admin/orders/{order}
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Order::STATUSES)],
            'delivery_type' => ['sometimes', Rule::in([Order::DELIVERY_PICKUP, Order::DELIVERY_COURIER])],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'customer_name' => ['sometimes', 'string', 'max:120'],
            'customer_phone' => ['sometimes', 'string', 'max:32'],
            'comment' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ], [
            'status.in' => 'Недопустимый статус заказа.',
        ]);

        $order->update($data);

        return response()->json([
            'message' => "Заказ {$order->number} обновлён.",
            'data' => (new OrderResource($order->load(['items.product', 'user'])))->resolve(),
        ]);
    }

    /**
     * PATCH /api/admin/orders/{order}/status
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
        ], [
            'status.required' => 'Укажите новый статус заказа.',
            'status.in' => 'Недопустимый статус заказа.',
        ]);

        // При отмене заказа возвращаем товары на склад
        if ($data['status'] === Order::STATUS_CANCELLED && $order->status !== Order::STATUS_CANCELLED) {
            DB::transaction(function () use ($order) {
                foreach ($order->items()->with('product')->get() as $item) {
                    $item->product?->increment('stock', (int) $item->qty);
                }

                $order->update(['status' => Order::STATUS_CANCELLED]);
            });
        } else {
            $order->update(['status' => $data['status']]);
        }

        return response()->json([
            'message' => "Статус заказа {$order->number}: {$order->fresh()->status_label}.",
            'data' => (new OrderResource($order->fresh()->load(['items.product', 'user'])))->resolve(),
        ]);
    }

    /**
     * DELETE /api/admin/orders/{order}
     */
    public function destroy(Order $order): JsonResponse
    {
        $number = $order->number;
        $order->delete();

        return response()->json([
            'message' => "Заказ {$number} удалён.",
        ]);
    }
}
