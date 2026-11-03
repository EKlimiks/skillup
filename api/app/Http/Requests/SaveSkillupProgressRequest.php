<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Сохранение прогресса SkillUp.
 *
 * Прогресс — свободный JSON, поэтому проверяем не поля внутри, а сам
 * факт того, что это объект разумного размера. Всё остальное приводит
 * к известному виду SkillupMerger: клиенту нельзя доверять, но и
 * отбивать его из-за лишнего поля тоже незачем.
 */
class SaveSkillupProgressRequest extends FormRequest
{
    /** Больше этого прогресс быть не может — там нет ничего тяжёлого. */
    private const MAX_BYTES = 524288;   // 512 КБ

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
            'progress' => ['required', 'array'],
            'client_updated_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'progress.required' => 'Не передан прогресс.',
            'progress.array' => 'Прогресс должен быть объектом.',
            'client_updated_at.date' => 'Некорректная дата изменения прогресса.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $progress = $this->input('progress');
            if (! is_array($progress)) {
                return;
            }

            $json = json_encode($progress, JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                $v->errors()->add('progress', 'Прогресс не удалось преобразовать в JSON.');
                return;
            }

            if (strlen($json) > self::MAX_BYTES) {
                $v->errors()->add(
                    'progress',
                    'Прогресс слишком большой: ' . round(strlen($json) / 1024) . ' КБ, '
                    . 'допустимо не больше ' . (self::MAX_BYTES / 1024) . ' КБ.'
                );
            }

            /* Прогресс должен быть объектом, а не списком: {"xp": 10}, не [10]. */
            if ($progress !== [] && array_is_list($progress)) {
                $v->errors()->add('progress', 'Прогресс должен быть объектом, а не массивом.');
            }
        });
    }
}
