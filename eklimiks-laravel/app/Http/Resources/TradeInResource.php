<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\TradeIn
 */
class TradeInResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'device_model' => $this->device_model,
            'storage' => $this->storage,
            'device_condition' => $this->device_condition,
            'condition_label' => $this->condition_label,
            'battery_health' => $this->battery_health !== null ? (int) $this->battery_health : null,
            'estimated_price' => (float) $this->estimated_price,
            'final_price' => $this->final_price !== null ? (float) $this->final_price : null,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
