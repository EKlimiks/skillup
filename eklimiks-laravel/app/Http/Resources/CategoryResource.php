<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Category
 */
class CategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'icon' => $this->icon,
            'sort' => (int) $this->sort,
            'products_count' => $this->whenCounted('products'),
            // alias: React-клиент использует поле id для slug категории
            'category_id' => $this->slug,
            'products' => ProductResource::collection($this->whenLoaded('products')),
        ];
    }
}
