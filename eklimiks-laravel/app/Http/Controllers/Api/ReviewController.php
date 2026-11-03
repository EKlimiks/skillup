<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Отзывы о товарах. Отзыв публикуется после модерации администратором.
 */
class ReviewController extends Controller
{
    /**
     * GET /api/reviews — последние одобренные отзывы (для главной страницы).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min((int) $request->query('per_page', 12), 50));

        $reviews = Review::query()
            ->with('product')
            ->approved()
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return ReviewResource::collection($reviews);
    }

    /**
     * POST /api/reviews — оставить отзыв (только авторизованный пользователь).
     */
    public function store(StoreReviewRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        /** @var Product $product */
        $product = Product::query()->findOrFail($data['product_id']);

        /** @var Review $review */
        $review = Review::query()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'author_name' => $data['author_name'] ?? $user->name,
            'rating' => (int) $data['rating'],
            'text' => $data['text'],
            'is_approved' => false,
        ]);

        return response()->json([
            'message' => 'Спасибо за отзыв! Он будет опубликован после проверки модератором.',
            'data' => (new ReviewResource($review))->resolve(),
        ], 201);
    }
}
