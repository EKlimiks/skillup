<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\Promo;
use App\Models\Setting;
use App\Models\User;
use App\Services\OrderNumberGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Оформление и просмотр заказов.
 */
class OrderController extends Controller
{
    public function __construct(
        private readonly CartController $cartController,
        private readonly OrderNumberGenerator $numberGenerator,
    ) {
    }

    /**
     * POST /api/orders
     *
     * Сумма заказа считается только на сервере по актуальным ценам каталога.
     * Бонусы начисляются в размере 2% от суммы заказа (настройка bonus_percent).
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        // Источник позиций: тело запроса или серверная корзина
        $requestedItems = [];

        if (! empty($data['items'])) {
            foreach ($data['items'] as $item) {
                $productId = (int) $item['product_id'];
                $requestedItems[$productId] = ($requestedItems[$productId] ?? 0) + (int) $item['qty'];
            }
        } elseif ($request->boolean('use_cart')) {
            $requestedItems = $this->cartController->cart($request);
        }

        if ($requestedItems === []) {
            throw ValidationException::withMessages([
                'items' => ['Корзина пуста — добавьте товары перед оформлением заказа.'],
            ]);
        }

        $order = DB::transaction(function () use ($user, $data, $requestedItems, $request): Order {
            $products = Product::query()
                ->whereIn('id', array_keys($requestedItems))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $total = 0.0;
            $lines = [];

            foreach ($requestedItems as $productId => $qty) {
                /** @var Product|null $product */
                $product = $products->get($productId);

                if (! $product || ! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ["Товар #{$productId} больше не доступен для заказа."],
                    ]);
                }

                if ((int) $product->stock < $qty) {
                    throw ValidationException::withMessages([
                        'items' => ["«{$product->name}»: на складе осталось {$product->stock} шт."],
                    ]);
                }

                // Резервируем товар на складе
                $product->decrement('stock', $qty);

                $price = (float) $product->price;
                $total += $price * $qty;

                $lines[] = [
                    'product_id' => $product->id,
                    'qty' => $qty,
                    'price' => $price,
                ];
            }

            // Промокод: скидка считается на сервере
            $promoCode = trim((string) ($data['promo_code'] ?? ''));
            $commentPromo = null;
            $total = $this->applyPromo($promoCode, $total, $commentPromo);

            $comment = $data['comment'] ?? null;
            if ($commentPromo !== null) {
                $comment = trim((string) $comment . "\nПромокод: {$commentPromo}");
            }

            /** @var Order $order */
            $order = Order::query()->create([
                'user_id' => $user->id,
                'number' => $this->numberGenerator->generate(),
                'status' => Order::STATUS_NEW,
                'total' => round($total, 2),
                'delivery_type' => $data['delivery_type'],
                'address' => $data['delivery_type'] === Order::DELIVERY_COURIER ? ($data['address'] ?? null) : null,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'comment' => $comment,
            ]);

            $order->items()->createMany($lines);

            // Бонусы: 2% от суммы заказа
            $percent = (float) (Setting::value('bonus_percent', (string) env('SHOP_BONUS_PERCENT', '2')) ?? 2);
            $bonus = (int) floor((float) $order->total * $percent / 100);

            if ($bonus > 0) {
                $user->increment('bonus_points', $bonus);

                Setting::query()->create([
                    'key' => 'bonus_tx_' . $order->id,
                    'value' => json_encode([
                        'user_id' => $user->id,
                        'amount' => $bonus,
                        'order_number' => $order->number,
                        'description' => "Начисление за заказ {$order->number}",
                        'created_at' => now()->toIso8601String(),
                    ], JSON_UNESCAPED_UNICODE),
                    'group' => 'bonus_history',
                ]);
            }

            // Заказ из серверной корзины — очищаем её
            if ($request->boolean('use_cart') && empty($data['items'])) {
                $this->cartController->putCart($request, []);
            }

            return $order;
        });

        return response()->json([
            'message' => "Заказ {$order->number} успешно оформлен. Менеджер свяжется с вами.",
            'data' => (new OrderResource($order->load(['items.product'])))->resolve(),
        ], 201);
    }

    /**
     * GET /api/orders/{number}
     */
    public function show(Request $request, string $number): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $order = Order::query()
            ->with(['items.product', 'user'])
            ->where('number', $number)
            ->when(! $user->isStaff(), fn ($q) => $q->where('user_id', $user->id))
            ->firstOrFail();

        return response()->json([
            'data' => (new OrderResource($order))->resolve(),
        ]);
    }

    /**
     * Человекочитаемый номер заказа: EK-2026-000123.
     */
    public function generateNumber(): string
    {
        return $this->numberGenerator->generate();
    }

    /**
     * Применение промокода. Возвращает итоговую сумму.
     */
    private function applyPromo(?string $code, float $total, &$appliedCode = null): float
    {
        if ($code === null || $code === '') {
            return $total;
        }

        /** @var Promo|null $promo */
        $promo = Promo::query()->where('code', mb_strtoupper($code))->first();

        if (! $promo || ! $promo->isValid()) {
            throw ValidationException::withMessages([
                'promo_code' => ['Промокод недействителен или истёк.'],
            ]);
        }

        $appliedCode = $promo->code;

        return round($total * (100 - (int) $promo->discount_percent) / 100, 2);
    }
}
