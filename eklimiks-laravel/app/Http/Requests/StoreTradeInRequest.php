<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Валидация заявки Trade-In (оценка устройства).
 */
class StoreTradeInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // доступно и гостям
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'device_model' => ['required', 'string', 'min:2', 'max:120'],
            'storage' => ['nullable', 'string', 'max:64'],
            'device_condition' => ['required', 'in:perfect,good,fair,broken'],
            'battery_health' => ['nullable', 'integer', 'min:1', 'max:100'],
            'customer_name' => ['required', 'string', 'min:2', 'max:120'],
            'customer_phone' => ['required', 'string', 'min:6', 'max:32'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'device_model.required' => 'Укажите модель устройства.',
            'device_condition.required' => 'Оцените состояние устройства.',
            'device_condition.in' => 'Недопустимое состояние устройства.',
            'battery_health.integer' => 'Ёмкость аккумулятора указывается числом.',
            'battery_health.max' => 'Ёмкость аккумулятора не может быть больше 100%.',
            'customer_name.required' => 'Укажите имя.',
            'customer_phone.required' => 'Укажите телефон для связи.',
        ];
    }

    /**
     * Поддерживаем короткие имена полей, которые использует React-клиент:
     * model, condition, battery, name, phone.
     */
    protected function prepareForValidation(): void
    {
        $this->merge(array_filter([
            'device_model' => $this->input('device_model', $this->input('model')),
            'device_condition' => $this->input('device_condition', $this->input('condition')),
            'battery_health' => $this->input('battery_health', $this->input('battery')),
            'customer_name' => $this->input('customer_name', $this->input('name')),
            'customer_phone' => $this->input('customer_phone', $this->input('phone')),
        ], fn ($value) => $value !== null));
    }
}
