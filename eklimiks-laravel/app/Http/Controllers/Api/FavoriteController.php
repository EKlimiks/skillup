<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Favorite;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Избранные товары пользователя.
 */
class FavoriteController extends Controller
{
    /**
     * GET /api/favorites
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with('category')
            ->join('favorites', 'favorites.product_id', '=', 'products.id')
            ->where('favorites.user_id', $request->user()->id)
            ->orderByDesc('favorites.created_at')
            ->select('products.*')
            ->get();

        return response()->json([
            'data' => ProductResource::collection($products)->resolve(),
            'count' => $products->count(),
        ]);
    }

    /**
     * POST /api/favorites — добавить товар в избранное.
     * Тело: { product_id: int }
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ], [
            'product_id.required' => 'Не указан товар.',
            'product_id.exists' => 'Товар не найден в каталоге.',
        ]);

        /** @var User $user */
        $user = $request->user();

        $favorite = Favorite::query()->firstOrCreate([
            'user_id' => $user->id,
            'product_id' => (int) $data['product_id'],
        ]);

        return response()->json([
            'message' => $favorite->wasRecentlyCreated
                ? 'Товар добавлен в избранное.'
                : 'Товар уже в избранном.',
            'in_favorites' => true,
        ], $favorite->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * DELETE /api/favorites/{product} — убрать товар из избранного.
     */
    public function destroy(Request $request, int $product): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        Favorite::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product)
            ->delete();

        return response()->json([
            'message' => 'Товар удалён из избранного.',
            'in_favorites' => false,
        ]);
    }
}
