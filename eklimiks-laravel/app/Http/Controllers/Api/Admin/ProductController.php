<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Управление товарами в админ-панели (CRUD).
 */
class ProductController extends Controller
{
    /**
     * GET /api/admin/products
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()->with('category');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('storage', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->query('category_id'));
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->query('condition'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = max(1, min((int) $request->query('per_page', 20), 100));

        return ProductResource::collection(
            $query->orderByDesc('updated_at')->paginate($perPage)->withQueryString()
        );
    }

    /**
     * POST /api/admin/products
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        /** @var Product $product */
        $product = Product::query()->create($this->preparePayload($data));

        return response()->json([
            'message' => "Товар «{$product->name}» добавлен в каталог.",
            'data' => (new ProductResource($product->load('category')))->resolve(),
        ], 201);
    }

    /**
     * GET /api/admin/products/{product}
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => (new ProductResource($product->load(['category', 'approvedReviews'])))->resolve(),
        ]);
    }

    /**
     * PUT/PATCH /api/admin/products/{product}
     */
    public function update(StoreProductRequest $request, Product $product): JsonResponse
    {
        $product->update($this->preparePayload($request->validated()));

        return response()->json([
            'message' => 'Товар обновлён.',
            'data' => (new ProductResource($product->load('category')))->resolve(),
        ]);
    }

    /**
     * DELETE /api/admin/products/{product}
     */
    public function destroy(Product $product): JsonResponse
    {
        if ($product->orderItems()->exists()) {
            // Не удаляем товар из истории заказов — просто скрываем из каталога
            $product->update(['is_active' => false, 'is_featured' => false]);

            return response()->json([
                'message' => 'Товар участвует в заказах, поэтому скрыт из каталога (мягкое удаление).',
            ]);
        }

        $name = $product->name;
        $product->delete();

        return response()->json([
            'message' => "Товар «{$name}» удалён.",
        ]);
    }

    /**
     * PATCH /api/admin/products/{product}/toggle — быстрое скрытие/показ.
     */
    public function toggle(Product $product): JsonResponse
    {
        $product->update(['is_active' => ! $product->is_active]);

        return response()->json([
            'message' => $product->is_active ? 'Товар показан в каталоге.' : 'Товар скрыт из каталога.',
            'is_active' => (bool) $product->is_active,
        ]);
    }

    /**
     * Приводим входные данные к структуре БД.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function preparePayload(array $data): array
    {
        // slug можно не передавать — сгенерируем из названия
        if (empty($data['slug'])) {
            $data['slug'] = \Illuminate\Support\Str::slug($data['name'] ?? '');
        }

        $data['colors'] = $data['colors'] ?? [];
        $data['specs'] = $data['specs'] ?? [];
        $data['images'] = $data['images'] ?? [];

        // Автоматически подставляем картинки, если их не передали
        if ($data['images'] === [] && ! empty($data['colors']) && ! empty($data['slug'])) {
            $colors = $data['colors'];

            if (is_array($colors)) {
                $data['images'] = collect($colors)
                    ->filter(fn ($color) => is_array($color) && ! empty($color['name']))
                    ->map(fn ($color) => 'img/products/' . $data['slug'] . '--' . \Illuminate\Support\Str::slug($color['name']) . '.webp')
                    ->values()
                    ->all();
            }
        }

        $data['is_featured'] = (bool) ($data['is_featured'] ?? false);
        $data['is_active'] = array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true;

        return $data;
    }
}
