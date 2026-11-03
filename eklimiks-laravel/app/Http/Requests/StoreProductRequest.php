<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Создание и обновление товара в админ-панели.
 */
class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->isStaff();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // При обновлении (PUT/PATCH) slug уникален кроме текущей записи
        $productId = $this->route('product')?->id;

        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'slug' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('products', 'slug')->ignore($productId),
            ],
            'name' => ['required', 'string', 'max:191'],
            'subtitle' => ['nullable', 'string', 'max:191'],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'old_price' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'condition' => ['required', 'in:new,refurbished'],
            'storage' => ['nullable', 'string', 'max:64'],
            'colors' => ['nullable', 'array'],
            'colors.*.name' => ['required_with:colors', 'string', 'max:64'],
            'colors.*.hex' => ['required_with:colors', 'string', 'max:16'],
            'specs' => ['nullable', 'array'],
            'specs.*.key' => ['required_with:specs', 'string', 'max:80'],
            'specs.*.value' => ['required_with:specs', 'string', 'max:255'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string', 'max:255'],
            'stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category_id.required' => 'Выберите категорию товара.',
            'category_id.exists' => 'Такой категории не существует.',
            'slug.required' => 'Укажите slug товара (латиницей).',
            'slug.regex' => 'Slug может содержать только строчные латинские буквы, цифры и дефис.',
            'slug.unique' => 'Товар с таким slug уже существует.',
            'name.required' => 'Укажите название товара.',
            'description.required' => 'Заполните описание товара.',
            'price.required' => 'Укажите цену товара.',
            'price.numeric' => 'Цена должна быть числом.',
            'stock.required' => 'Укажите остаток на складе.',
        ];
    }

    /**
     * Приводим данные к единому виду (пустые строки → null).
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'old_price' => $this->input('old_price') === '' ? null : $this->input('old_price'),
            'subtitle' => $this->input('subtitle') === '' ? null : $this->input('subtitle'),
            'storage' => $this->input('storage') === '' ? null : $this->input('storage'),
            'is_featured' => $this->boolean('is_featured'),
            'is_active' => $this->has('is_active') ? $this->boolean('is_active') : true,
        ]);
    }
}
