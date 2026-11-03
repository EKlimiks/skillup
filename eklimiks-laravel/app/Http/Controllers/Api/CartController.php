<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

/**
 * Серверная корзина. Хранится в сессии (гость) и доступна после входа.
 * Формат сессии: [product_id => qty].
 */
class CartController extends Controller
{
    private const SESSION_KEY = 'cart';

    /**
     * GET /api/cart
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json($this->buildCartPayload($request));
    }

    /**
     * POST /api/cart — добавить товар.
     * Тело: { product_id: int, qty?: int }
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'qty' => ['nullable', 'integer', 'min:1', 'max:99'],
        ], [
            'product_id.required' => 'Не указан товар.',
            'product_id.exists' => 'Товар не найден в каталоге.',
            'qty.min' => 'Количество должно быть не меньше 1.',
            'qty.max' => 'За один раз можно добавить не более 99 единиц.',
        ]);

        /** @var Product $product */
        $product = Product::query()->active()->findOrFail($data['product_id']);

        if ((int) $product->stock < 1) {
            return response()->json([
                'message' => 'Товара нет в наличии. Оформите уведомление о поступлении.',
            ], 422);
        }

        $cart = $this->cart($request);
        $qty = (int) ($data['qty'] ?? 1);
        $newQty = min(99, ($cart[$product->id] ?? 0) + $qty, max(1, (int) $product->stock));

        $cart[$product->id] = $newQty;
        $this->putCart($request, $cart);

        return response()->json([
            'message' => 'Товар добавлен в корзину.',
            'cart' => $this->buildCartPayload($request),
        ]);
    }

    /**
     * PUT /api/cart — изменить количество (0 — удалить позицию).
     * Тело: { product_id: int, qty: int }
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'qty' => ['required', 'integer', 'min:0', 'max:99'],
        ], [
            'product_id.required' => 'Не указан товар.',
            'qty.required' => 'Укажите количество товара.',
        ]);

        $cart = $this->cart($request);
        $productId = (int) $data['product_id'];
        $qty = (int) $data['qty'];

        if ($qty === 0) {
            unset($cart[$productId]);
        } else {
            $cart[$productId] = $qty;
        }

        $this->putCart($request, $cart);

        return response()->json([
            'message' => 'Корзина обновлена.',
            'cart' => $this->buildCartPayload($request),
        ]);
    }

    /**
     * DELETE /api/cart/{product} — удалить позицию.
     */
    public function destroy(Request $request, int $product): JsonResponse
    {
        $cart = $this->cart($request);

        if (! array_key_exists($product, $cart)) {
            throw new InvalidArgumentException('Товара нет в корзине.');
        }

        unset($cart[$product]);
        $this->putCart($request, $cart);

        return response()->json([
            'message' => 'Товар удалён из корзины.',
            'cart' => $this->buildCartPayload($request),
        ]);
    }

    /**
     * DELETE /api/cart — очистить корзину.
     */
    public function clear(Request $request): JsonResponse
    {
        $this->putCart($request, []);

        return response()->json([
            'message' => 'Корзина очищена.',
            'cart' => $this->buildCartPayload($request),
        ]);
    }

    // -----------------------------------------------------------------
    // Служебные методы
    // -----------------------------------------------------------------

    /**
     * @return array<int, int>
     */
    public function cart(Request $request): array
    {
        $cart = $request->session()->get(self::SESSION_KEY, []);

        return is_array($cart) ? array_map('intval', $cart) : [];
    }

    /**
     * @param  array<int, int>  $cart
     */
    public function putCart(Request $request, array $cart): void
    {
        $request->session()->put(self::SESSION_KEY, $cart);
    }

    /**
     * Собираем ответ с товарами и итогами.
     *
     * @return array<string, mixed>
     */
    public function buildCartPayload(Request $request): array
    {
        $cart = $this->cart($request);

        if ($cart === []) {
            return [
                'items' => [],
                'items_count' => 0,
                'total' => 0.0,
                'total_old' => 0.0,
                'discount' => 0.0,
            ];
        }

        $products = Product::query()
            ->with('category')
            ->whereIn('id', array_keys($cart))
            ->get()
            ->keyBy('id');

        $items = [];
        $total = 0.0;
        $totalOld = 0.0;
        $count = 0;

        foreach ($cart as $productId => $qty) {
            /** @var Product|null $product */
            $product = $products->get($productId);

            if (! $product) {
                continue; // товар удалён из каталога
            }

            $price = (float) $product->price;
            $subtotal = $price * $qty;

            $total += $subtotal;
            $totalOld += (float) ($product->old_price ?? $price) * $qty;
            $count += $qty;

            $items[] = [
                'product_id' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'subtitle' => $product->subtitle,
                'image' => $product->main_image,
                'storage' => $product->storage,
                'price' => $price,
                'old_price' => $product->old_price !== null ? (float) $product->old_price : null,
                'qty' => $qty,
                'subtotal' => round($subtotal, 2),
                'stock' => (int) $product->stock,
                'category' => $product->category?->slug,
            ];
        }

        return [
            'items' => $items,
            'items_count' => $count,
            'total' => round($total, 2),
            'total_old' => round($totalOld, 2),
            'discount' => round(max(0, $totalOld - $total), 2),
        ];
    }
}
