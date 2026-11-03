<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Управление категориями каталога.
 */
class CategoryController extends Controller
{
    /**
     * GET /api/admin/categories
     */
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->ordered()
            ->get();

        return response()->json([
            'data' => CategoryResource::collection($categories)->resolve(),
        ]);
    }

    /**
     * POST /api/admin/categories
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);

        /** @var Category $category */
        $category = Category::query()->create([
            'slug' => $data['slug'] ?? Str::slug($data['name']),
            'name' => $data['name'],
            'icon' => $data['icon'] ?? null,
            'sort' => $data['sort'] ?? 0,
        ]);

        return response()->json([
            'message' => "Категория «{$category->name}» создана.",
            'data' => (new CategoryResource($category))->resolve(),
        ], 201);
    }

    /**
     * GET /api/admin/categories/{category}
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'data' => (new CategoryResource($category->loadCount('products')))->resolve(),
        ]);
    }

    /**
     * PUT/PATCH /api/admin/categories/{category}
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $this->validateData($request, $category->id);

        $category->update([
            'slug' => $data['slug'] ?? $category->slug,
            'name' => $data['name'],
            'icon' => $data['icon'] ?? null,
            'sort' => $data['sort'] ?? $category->sort,
        ]);

        return response()->json([
            'message' => 'Категория обновлена.',
            'data' => (new CategoryResource($category))->resolve(),
        ]);
    }

    /**
     * DELETE /api/admin/categories/{category}
     */
    public function destroy(Category $category): JsonResponse
    {
        $productsCount = $category->products()->count();

        if ($productsCount > 0) {
            return response()->json([
                'message' => "Нельзя удалить категорию: в ней {$productsCount} товаров. Сначала перенесите или удалите товары.",
            ], 409);
        }

        $name = $category->name;
        $category->delete();

        return response()->json([
            'message' => "Категория «{$name}» удалена.",
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'slug' => [
                'nullable',
                'string',
                'max:191',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('categories', 'slug')->ignore($ignoreId),
            ],
            'icon' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ], [
            'name.required' => 'Укажите название категории.',
            'slug.regex' => 'Slug может содержать только строчные латинские буквы, цифры и дефис.',
            'slug.unique' => 'Категория с таким slug уже существует.',
        ]);
    }
}
