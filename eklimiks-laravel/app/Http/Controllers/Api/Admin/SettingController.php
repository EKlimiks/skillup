<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Настройки сайта (key/value). Администратор меняет тексты, контакты и
 * условия доставки без пересборки React-приложения.
 */
class SettingController extends Controller
{
    /**
     * GET /api/admin/settings
     * Возвращает плоский список и сгруппированный объект.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Setting::query()
            ->where('group', '!=', 'bonus_history')
            ->orderBy('group')
            ->orderBy('id');

        if ($request->filled('group')) {
            $query->where('group', $request->query('group'));
        }

        $settings = $query->get();

        $grouped = [];
        foreach ($settings as $setting) {
            $grouped[$setting->group ?: Setting::GROUP_COMMON][] = [
                'id' => $setting->id,
                'key' => $setting->key,
                'value' => $setting->value,
                'group' => $setting->group,
            ];
        }

        return response()->json([
            'data' => $settings->map(fn (Setting $s) => [
                'id' => $s->id,
                'key' => $s->key,
                'value' => $s->value,
                'group' => $s->group,
            ])->values(),
            'groups' => $grouped,
        ]);
    }

    /**
     * POST /api/admin/settings — создать настройку.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'key' => ['required', 'string', 'max:191', 'unique:settings,key'],
            'value' => ['nullable', 'string'],
            'group' => ['nullable', 'string', 'max:64'],
        ], [
            'key.required' => 'Укажите ключ настройки.',
            'key.unique' => 'Настройка с таким ключом уже существует.',
        ]);

        /** @var Setting $setting */
        $setting = Setting::query()->create([
            'key' => Str::slug($data['key'], '_'),
            'value' => $data['value'] ?? null,
            'group' => $data['group'] ?? Setting::GROUP_COMMON,
        ]);

        return response()->json([
            'message' => 'Настройка создана.',
            'data' => [
                'id' => $setting->id,
                'key' => $setting->key,
                'value' => $setting->value,
                'group' => $setting->group,
            ],
        ], 201);
    }

    /**
     * GET /api/admin/settings/{setting}
     */
    public function show(Setting $setting): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $setting->id,
                'key' => $setting->key,
                'value' => $setting->value,
                'group' => $setting->group,
            ],
        ]);
    }

    /**
     * PUT/PATCH /api/admin/settings/{setting}
     */
    public function update(Request $request, Setting $setting): JsonResponse
    {
        $data = $request->validate([
            'value' => ['nullable', 'string'],
            'group' => ['sometimes', 'string', 'max:64'],
            'key' => ['sometimes', 'string', 'max:191', Rule::unique('settings', 'key')->ignore($setting->id)],
        ], [
            'key.unique' => 'Настройка с таким ключом уже существует.',
        ]);

        $setting->update($data);

        return response()->json([
            'message' => "Настройка «{$setting->key}» сохранена.",
            'data' => [
                'id' => $setting->id,
                'key' => $setting->key,
                'value' => $setting->value,
                'group' => $setting->group,
            ],
        ]);
    }

    /**
     * DELETE /api/admin/settings/{setting}
     */
    public function destroy(Setting $setting): JsonResponse
    {
        $key = $setting->key;
        $setting->delete();

        return response()->json([
            'message' => "Настройка «{$key}» удалена.",
        ]);
    }

    /**
     * PATCH /api/admin/settings — массовое сохранение из формы админки.
     * Тело: { settings: { site_name: "EKlimiks", shop_phone: "+7 ..." } }
     * либо: { settings: [{ key: "...", value: "...", group: "..." }] }
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required'],
        ], [
            'settings.required' => 'Передайте список настроек для сохранения.',
        ]);

        $payload = [];

        if (is_array($data['settings']) && array_is_list($data['settings'])) {
            foreach ($data['settings'] as $row) {
                if (! is_array($row) || empty($row['key'])) {
                    continue;
                }

                $payload[$row['key']] = [
                    'value' => $row['value'] ?? null,
                    'group' => $row['group'] ?? Setting::GROUP_COMMON,
                ];
            }
        } elseif (is_array($data['settings'])) {
            foreach ($data['settings'] as $key => $value) {
                $payload[$key] = [
                    'value' => is_scalar($value) || $value === null ? $value : json_encode($value, JSON_UNESCAPED_UNICODE),
                    'group' => null,
                ];
            }
        }

        if ($payload === []) {
            return response()->json([
                'message' => 'Нет данных для сохранения.',
                'errors' => ['settings' => ['Передайте хотя бы одну настройку.']],
            ], 422);
        }

        $updated = 0;

        foreach ($payload as $key => $row) {
            $setting = Setting::query()->firstOrNew(['key' => (string) $key]);
            $setting->value = $row['value'];

            if ($row['group'] !== null || ! $setting->exists) {
                $setting->group = $row['group'] ?? Setting::GROUP_COMMON;
            }

            $setting->save();
            $updated++;
        }

        return response()->json([
            'message' => "Сохранено настроек: {$updated}.",
            'updated' => $updated,
            'data' => Setting::query()
                ->where('group', '!=', 'bonus_history')
                ->orderBy('id')
                ->get()
                ->map(fn (Setting $s) => [
                    'id' => $s->id,
                    'key' => $s->key,
                    'value' => $s->value,
                    'group' => $s->group,
                ])->values(),
        ]);
    }
}
