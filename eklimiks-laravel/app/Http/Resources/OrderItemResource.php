<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Позиция заказа.
 *
 * @mixin \App\Models\OrderItem
 */
class OrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'name' => $this->whenLoaded('product', fn () => $this->product->name, 'Товар удалён'),
            'slug' => $this->whenLoaded('product', fn () => $this->product->slug, null),
            'image' => $this->whenLoaded('product', fn () => $this->product->main_image, null),
            'qty' => (int) $this->qty,
            'price' => (float) $this->price,
            'subtotal' => round((float) $this->price * (int) $this->qty, 2),
        ];
    }
}
