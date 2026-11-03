<?php

namespace App\Http\Requests;

use App\Models\MasterSlot;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Валидация заявки на ремонт (в том числе с онлайн-записью к мастеру).
 */
class StoreRepairRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // заявку может оставить и гость
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'repair_service_id' => ['required', 'integer', 'exists:repair_services,id'],
            'device_model' => ['required', 'string', 'min:2', 'max:120'],
            'issue' => ['required', 'string', 'min:10', 'max:2000'],
            'customer_name' => ['required', 'string', 'min:2', 'max:120'],
            'customer_phone' => ['required', 'string', 'min:6', 'max:32'],
            'master_id' => ['nullable', 'integer', 'exists:masters,id'],
            'master_slot_id' => ['nullable', 'integer', 'exists:master_slots,id'],
            'slot_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:today'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'repair_service_id.required' => 'Выберите услугу ремонта.',
            'repair_service_id.exists' => 'Такая услуга недоступна.',
            'device_model.required' => 'Укажите модель устройства.',
            'issue.required' => 'Опишите неисправность.',
            'issue.min' => 'Опишите неисправность подробнее (минимум 10 символов).',
            'customer_name.required' => 'Укажите имя.',
            'customer_phone.required' => 'Укажите телефон для связи.',
            'master_id.exists' => 'Выбранный мастер недоступен.',
        ];
    }

    /**
     * Слот должен быть свободен и принадлежать выбранному мастеру.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $slotId = $this->input('master_slot_id');

            if (! $slotId) {
                return;
            }

            /** @var MasterSlot|null $slot */
            $slot = MasterSlot::query()->find($slotId);

            if (! $slot) {
                $validator->errors()->add('master_slot_id', 'Выбранное время приёма не найдено.');

                return;
            }

            if ($slot->is_booked) {
                $validator->errors()->add('master_slot_id', 'Это время уже занято, выберите другое.');
            }

            if ($slot->date->toDateString() < now()->toDateString()) {
                $validator->errors()->add('master_slot_id', 'Нельзя записаться на прошедшую дату.');
            }
        });
    }
}
