<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

/**
 * Публичные настройки сайта: название, телефон, адрес, соцсети, тексты доставки.
 * Администратор меняет их в админ-панели без пересборки фронтенда.
 */
class SettingController extends Controller
{
    /**
     * GET /api/settings/public
     */
    public function public(): JsonResponse
    {
        $settings = Setting::query()
            ->whereNotIn('group', ['bonus_history'])
            ->orderBy('id')
            ->get();

        $grouped = [];
        $flat = [];

        foreach ($settings as $setting) {
            $group = $setting->group ?: Setting::GROUP_COMMON;

            $grouped[$group][$setting->key] = $setting->value;
            $flat[$setting->key] = $setting->value;
        }

        return response()->json([
            'data' => $flat,
            'groups' => $grouped,
        ]);
    }
}
