<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Валидация лида с формы «Заказать звонок» и других интерактивных форм.
 */
class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // форма доступна всем посетителям сайта
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'min:6', 'max:32'],
            'type' => ['required', 'in:callback,question,trade_in,repair'],
            'message' => ['nullable', 'string', 'max:2000'],
            // honeypot: боты заполняют скрытое поле
            'website' => ['nullable', 'size:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Укажите ваше имя.',
            'phone.required' => 'Укажите телефон для связи.',
            'type.required' => 'Не указан тип обращения.',
            'type.in' => 'Недопустимый тип обращения.',
            'website.size' => 'Заявка отклонена.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'имя',
            'phone' => 'телефон',
            'message' => 'сообщение',
        ];
    }
}
