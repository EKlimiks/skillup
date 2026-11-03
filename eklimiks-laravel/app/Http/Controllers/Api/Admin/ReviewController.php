<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Модерация отзывов: одобрение, отклонение, удаление.
 * При одобрении пересчитывается рейтинг товара.
 */
class ReviewController extends Controller
{
    /**
     * GET /api/admin/reviews
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Review::query()->with(['product', 'user']);

        if ($request->filled('is_approved')) {
            $query->where('is_approved', $request->boolean('is_approved'));
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', (int) $request->query('product_id'));
        }

        if ($request->filled('rating')) {
            $query->where('rating', (int) $request->query('rating'));
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('author_name', 'like', "%{$search}%")
                    ->orWhere('text', 'like', "%{$search}%");
            });
        }

        $perPage = max(1, min((int) $request->query('per_page', 20), 100));

        // Сначала показываем отзывы, ожидающие модерации
        return ReviewResource::collection(
            $query->orderBy('is_approved')->orderByDesc('created_at')->paginate($perPage)->withQueryString()
        );
    }

    /**
     * POST /api/admin/reviews — отзыв, добавленный вручную.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'author_name' => ['required', 'string', 'min:2', 'max:120'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'text' => ['required', 'string', 'min:5'],
            'is_approved' => ['nullable', 'boolean'],
        ], [
            'product_id.required' => 'Выберите товар.',
            'author_name.required' => 'Укажите имя автора отзыва.',
            'rating.required' => 'Поставьте оценку от 1 до 5.',
            'text.required' => 'Напишите текст отзыва.',
        ]);

        /** @var Review $review */
        $review = Review::query()->create([
            'product_id' => $data['product_id'],
            'author_name' => $data['author_name'],
            'rating' => (int) $data['rating'],
            'text' => $data['text'],
            'is_approved' => (bool) ($data['is_approved'] ?? false),
        ]);

        $this->recalculateProduct($review);

        return response()->json([
            'message' => 'Отзыв добавлен.',
            'data' => (new ReviewResource($review->load('product')))->resolve(),
        ], 201);
    }

    /**
     * GET /api/admin/reviews/{review}
     */
    public function show(Review $review): JsonResponse
    {
        return response()->json([
            'data' => (new ReviewResource($review->load(['product', 'user'])))->resolve(),
        ]);
    }

    /**
     * PUT/PATCH /api/admin/reviews/{review}
     */
    public function update(Request $request, Review $review): JsonResponse
    {
        $data = $request->validate([
            'author_name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'rating' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'text' => ['sometimes', 'string', 'min:5'],
            'is_approved' => ['sometimes', 'boolean'],
        ]);

        $review->update($data);
        $this->recalculateProduct($review);

        return response()->json([
            'message' => 'Отзыв обновлён.',
            'data' => (new ReviewResource($review->fresh()->load('product')))->resolve(),
        ]);
    }

    /**
     * PATCH /api/admin/reviews/{review}/approve — одобрить отзыв.
     */
    public function approve(Review $review): JsonResponse
    {
        $review->update(['is_approved' => true]);
        $rating = $this->recalculateProduct($review);
        $product = $review->product()->first();

        return response()->json([
            'message' => 'Отзыв одобрен и опубликован.',
            'data' => (new ReviewResource($review->fresh()->load('product')))->resolve(),
            'product_rating' => $rating,
            'product' => $product ? [
                'id' => $product->id,
                'slug' => $product->slug,
                'rating' => (float) $product->rating,
                'reviews_count' => (int) $product->reviews_count,
            ] : null,
        ]);
    }

    /**
     * DELETE /api/admin/reviews/{review}
     */
    public function destroy(Review $review): JsonResponse
    {
        $productId = $review->product_id;
        $review->delete();

        $product = Product::query()->find($productId);
        $product?->recalculateRating();

        return response()->json([
            'message' => 'Отзыв удалён.',
        ]);
    }

    /**
     * Пересчёт рейтинга и количества отзывов товара.
     */
    private function recalculateProduct(Review $review): ?float
    {
        $product = $review->product()->first();
        $product?->recalculateRating();

        return $product ? (float) $product->fresh()->rating : null;
    }
}
