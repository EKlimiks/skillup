<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Product
 */
class ProductResource extends JsonResource
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
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'price' => (float) $this->price,
            'old_price' => $this->old_price !== null ? (float) $this->old_price : null,
            'discount_percent' => $this->discountPercent(),
            'condition' => $this->condition,
            'condition_label' => $this->condition === 'refurbished' ? 'Восстановленный' : 'Новый',
            'storage' => $this->storage,
            'colors' => $this->colors ?? [],
            'specs' => $this->specs ?? [],
            'images' => $this->images ?? [],
            'image' => $this->main_image,
            'stock' => (int) $this->stock,
            'in_stock' => (int) $this->stock > 0,
            'rating' => (float) $this->rating,
            'reviews_count' => (int) $this->reviews_count,
            'is_featured' => (bool) $this->is_featured,
            'is_active' => (bool) $this->is_active,
            'category_id' => $this->category_id,
            // camelCase-алиасы для React-клиента (eklimiks/src/lib/api.js)
            'oldPrice' => $this->old_price !== null ? (float) $this->old_price : null,
            'featured' => (bool) $this->is_featured,
            'reviews' => (int) $this->reviews_count,
            'isActive' => (bool) $this->is_active,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'reviews' => ReviewResource::collection($this->whenLoaded('approvedReviews')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /** Размер скидки в процентах (0, если скидки нет). */
    private function discountPercent(): int
    {
        $price = (float) $this->price;
        $old = (float) ($this->old_price ?? 0);

        if ($old <= 0 || $old <= $price) {
            return 0;
        }

        return (int) round(($old - $price) / $old * 100);
    }
}
