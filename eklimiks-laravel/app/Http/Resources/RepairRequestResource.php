<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\RepairRequest
 */
class RepairRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'device_model' => $this->device_model,
            'issue' => $this->issue,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'price' => $this->price !== null ? (float) $this->price : null,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'repair_service_id' => $this->repair_service_id,
            'service' => $this->whenLoaded('service', fn () => [
                'id' => $this->service->id,
                'slug' => $this->service->slug,
                'name' => $this->service->name,
                'price_from' => (float) $this->service->price_from,
                'duration_minutes' => (int) $this->service->duration_minutes,
                'duration_label' => $this->service->duration_label,
            ]),
            'master' => $this->whenLoaded('master', fn () => $this->master ? [
                'id' => $this->master->id,
                'name' => $this->master->name,
                'specialization' => $this->master->specialization,
                'rating' => (float) $this->master->rating,
            ] : null),
            'slot' => $this->whenLoaded('slot', fn () => $this->slot ? [
                'id' => $this->slot->id,
                'date' => $this->slot->date?->toDateString(),
                'time' => $this->slot->time_short,
            ] : null),
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
