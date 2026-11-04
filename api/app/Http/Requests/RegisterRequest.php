<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Регистрация нового покупателя.
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:191', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(6)],
            'phone' => ['nullable', 'string', 'min:6', 'max:32'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Укажите имя.',
            'email.required' => 'Укажите e-mail.',
            'email.email' => 'Введите корректный e-mail.',
            'email.unique' => 'Пользователь с таким e-mail уже зарегистрирован.',
            'password.required' => 'Придумайте пароль.',
            'password.confirmed' => 'Пароли не совпадают.',
            'password.min' => 'Пароль должен содержать минимум 6 символов.',
        ];
    }
}
