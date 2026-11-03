<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Review
 */
class ReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'author_name' => $this->author_name,
            'initials' => $this->initials,
            'rating' => (int) $this->rating,
            'text' => $this->text,
            'is_approved' => (bool) $this->is_approved,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'slug' => $this->product->slug,
                'name' => $this->product->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'date_human' => $this->created_at?->translatedFormat('d.m.Y'),
        ];
    }
}
