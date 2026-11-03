<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Валидация создания заказа.
 * Итоговая сумма НЕ принимается с клиента — считается на сервере.
 */
class StoreOrderRequest extends FormRequest
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
            'customer_name' => ['required', 'string', 'min:2', 'max:120'],
            'customer_phone' => ['required', 'string', 'min:6', 'max:32'],
            'delivery_type' => ['required', 'in:pickup,courier'],
            'address' => ['required_if:delivery_type,courier', 'nullable', 'string', 'max:255'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'promo_code' => ['nullable', 'string', 'max:64'],

            // Корзина: либо список позиций, либо флаг «взять корзину с сервера»
            'items' => ['required_without:use_cart', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
            'use_cart' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_name.required' => 'Укажите имя получателя.',
            'customer_phone.required' => 'Укажите телефон для связи.',
            'delivery_type.required' => 'Выберите способ получения заказа.',
            'delivery_type.in' => 'Способ получения может быть «самовывоз» или «курьер».',
            'address.required_if' => 'Для курьерской доставки укажите адрес.',
            'items.required_without' => 'Корзина пуста — добавьте товары.',
            'items.min' => 'Корзина пуста — добавьте товары.',
            'items.*.product_id.exists' => 'Один из товаров больше не доступен.',
            'items.*.qty.min' => 'Количество товара должно быть не меньше 1.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'customer_name' => 'имя',
            'customer_phone' => 'телефон',
            'delivery_type' => 'способ получения',
            'address' => 'адрес',
        ];
    }
}
