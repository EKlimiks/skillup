<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Order
 */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'total' => (float) $this->total,
            'delivery_type' => $this->delivery_type,
            'delivery_label' => $this->delivery_type === 'courier' ? 'Курьером' : 'Самовывоз',
            'address' => $this->address,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'comment' => $this->comment,
            'items_count' => $this->whenLoaded('items', fn () => $this->items->sum('qty'), 0),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
