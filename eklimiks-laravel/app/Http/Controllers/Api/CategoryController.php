<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Публичный список категорий каталога.
 */
class CategoryController extends Controller
{
    /**
     * GET /api/categories
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Category::query()->ordered();

        if ($request->boolean('with_counts')) {
            $query->withCount(['products' => fn ($q) => $q->where('is_active', true)]);
        }

        return CategoryResource::collection($query->get());
    }

    /**
     * GET /api/categories/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        /** @var Category $category */
        $category = Category::query()
            ->where('slug', $slug)
            ->withCount(['products' => fn ($q) => $q->where('is_active', true)])
            ->firstOrFail();

        return response()->json([
            'data' => (new CategoryResource($category))->resolve(),
        ]);
    }
}
