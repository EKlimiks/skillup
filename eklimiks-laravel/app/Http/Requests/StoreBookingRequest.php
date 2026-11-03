<?php

namespace App\Http\Requests;

use App\Models\MasterSlot;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Валидация бронирования визита в магазин.
 * Дополнительно проверяем, что выбранное время действительно свободно.
 */
class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'slot_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'slot_time' => ['required', 'date_format:H:i'],
            'customer_name' => ['required', 'string', 'min:2', 'max:120'],
            'customer_phone' => ['required', 'string', 'min:6', 'max:32'],
            'master_id' => ['nullable', 'integer', 'exists:masters,id'],
            'master_slot_id' => ['nullable', 'integer', 'exists:master_slots,id'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'Выберите товар для бронирования.',
            'product_id.exists' => 'Такого товара больше нет в каталоге.',
            'store_id.required' => 'Выберите магазин.',
            'store_id.exists' => 'Выбранный магазин недоступен.',
            'slot_date.required' => 'Выберите дату визита.',
            'slot_date.after_or_equal' => 'Дата визита не может быть в прошлом.',
            'slot_time.required' => 'Выберите время визита.',
            'slot_time.date_format' => 'Время указывается в формате ЧЧ:ММ.',
            'customer_name.required' => 'Укажите имя.',
            'customer_phone.required' => 'Укажите телефон для связи.',
        ];
    }

    /**
     * Проверка занятости мастер-слота из БД.
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

                return;
            }

            if ($this->filled('master_id') && (int) $slot->master_id !== (int) $this->input('master_id')) {
                $validator->errors()->add('master_slot_id', 'Выбранное время не принадлежит выбранному мастеру.');
            }
        });
    }
}
