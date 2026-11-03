<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Валидация отзыва о товаре (только для авторизованных пользователей).
 */
class StoreReviewRequest extends FormRequest
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
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'text' => ['required', 'string', 'min:10', 'max:2000'],
            'author_name' => ['nullable', 'string', 'min:2', 'max:120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'Не указан товар для отзыва.',
            'product_id.exists' => 'Такого товара нет в каталоге.',
            'rating.required' => 'Поставьте оценку от 1 до 5.',
            'rating.min' => 'Оценка не может быть меньше 1.',
            'rating.max' => 'Оценка не может быть больше 5.',
            'text.required' => 'Напишите текст отзыва.',
            'text.min' => 'Отзыв должен содержать минимум 10 символов.',
        ];
    }
}
