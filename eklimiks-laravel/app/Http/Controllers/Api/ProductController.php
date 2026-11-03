<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Публичный каталог товаров.
 */
class ProductController extends Controller
{
    /**
     * GET /api/products
     * Фильтры: category, search, min_price, max_price, condition, sort, per_page.
     * Дополнительно принимаются camelCase-алиасы React-клиента:
     * minPrice, maxPrice, featured, sort=price-asc|price-desc.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->with('category')
            ->active();

        // Фильтр по категории (slug или id)
        if ($category = $request->query('category')) {
            if ($category !== 'all') {
                $query->whereHas('category', function (Builder $q) use ($category) {
                    $q->where('slug', $category)->orWhere('id', (int) $category);
                });
            }
        }

        // Фильтр по нескольким категориям: category[]=iphone&category[]=mac
        if (is_array($request->query('categories')) && $request->query('categories') !== []) {
            $query->whereHas('category', fn (Builder $q) => $q->whereIn('slug', $request->query('categories')));
        }

        // Поиск по названию, подзаголовку и описанию
        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('storage', 'like', "%{$search}%");
            });
        }

        $minPrice = $request->query('min_price', $request->query('minPrice'));
        if ($minPrice !== null && $minPrice !== '') {
            $query->where('price', '>=', (float) $minPrice);
        }

        $maxPrice = $request->query('max_price', $request->query('maxPrice'));
        if ($maxPrice !== null && $maxPrice !== '') {
            $query->where('price', '<=', (float) $maxPrice);
        }

        if ($request->filled('condition') && in_array($request->query('condition'), ['new', 'refurbished'], true)) {
            $query->where('condition', $request->query('condition'));
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
        }

        if ($request->filled('storage')) {
            $query->where('storage', 'like', '%' . $request->query('storage') . '%');
        }

        $this->applySort($query, (string) $request->query('sort', 'popular'));

        $perPage = (int) $request->query('per_page', 12);
        $perPage = max(1, min($perPage, 60));

        return ProductResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * GET /api/products/{slug}
     * Дополнительно отдаём похожие товары той же категории.
     */
    public function show(string $slug): JsonResponse
    {
        /** @var Product $product */
        $product = Product::query()
            ->with(['category', 'approvedReviews.user'])
            ->active()
            ->where('slug', $slug)
            ->firstOrFail();

        $related = Product::query()
            ->with('category')
            ->active()
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->orderByDesc('rating')
            ->limit(4)
            ->get();

        $payload = (new ProductResource($product))->resolve();

        return response()->json([
            'data' => $payload,
            // Поля верхнего уровня: удобно клиентам, которые читают ответ напрямую
            'related' => ProductResource::collection($related)->resolve(),
        ] + $payload);
    }

    /**
     * GET /api/products/{slug}/reviews
     */
    public function reviews(Request $request, string $slug): AnonymousResourceCollection
    {
        /** @var Product $product */
        $product = Product::query()->active()->where('slug', $slug)->firstOrFail();

        $perPage = max(1, min((int) $request->query('per_page', 10), 50));

        $reviews = $product->reviews()
            ->with('user')
            ->approved()
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return ReviewResource::collection($reviews);
    }

    /**
     * Сортировка каталога. Поддерживаются как snake_case, так и kebab-case
     * значения сортировки из React-клиента (price-asc, price-desc).
     */
    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'price_asc', 'price-asc', 'cheap' => $query->orderBy('price'),
            'price_desc', 'price-desc', 'expensive' => $query->orderByDesc('price'),
            'new', 'newest', 'date' => $query->orderByDesc('created_at'),
            'rating' => $query->orderByDesc('rating')->orderByDesc('reviews_count'),
            'name' => $query->orderBy('name'),
            'popular', 'reviews' => $query->orderByDesc('reviews_count')->orderByDesc('rating'),
            // «популярные» по умолчанию — избранное сверху, затем по рейтингу
            default => $query->orderByDesc('is_featured')->orderByDesc('rating')->orderByDesc('reviews_count'),
        };
    }
}
