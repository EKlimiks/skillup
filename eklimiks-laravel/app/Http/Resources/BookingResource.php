<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Booking
 */
class BookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slot_date' => $this->slot_date?->toDateString(),
            'slot_time' => substr((string) $this->slot_time, 0, 5),
            'status' => $this->status,
            'status_label' => $this->status_label,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'slug' => $this->product->slug,
                'name' => $this->product->name,
                'price' => (float) $this->product->price,
                'image' => $this->product->main_image,
            ]),
            'store' => $this->whenLoaded('store', fn () => [
                'id' => $this->store->id,
                'name' => $this->store->name,
                'address' => $this->store->address,
                'phone' => $this->store->phone,
                'work_hours' => $this->store->work_hours,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
