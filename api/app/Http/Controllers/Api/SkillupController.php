<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveSkillupProgressRequest;
use App\Models\SkillupProgress;
use App\Models\User;
use App\Services\SkillupMerger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Синхронизация прогресса приложения SkillUp.
 *
 * Приложение работает офлайн и хранит прогресс в телефоне. Аккаунт нужен
 * для двух вещей: чтобы прогресс не потерялся при смене устройства и чтобы
 * заниматься с нескольких устройств по очереди.
 *
 * Прогресс лежит одной JSON-строкой на пользователя. Разложить его по
 * таблицам нельзя: приложение всегда читает и пишет объект целиком, а
 * схема внутри может меняться от версии к версии.
 *
 * Все маршруты — под auth:sanctum, поэтому в каждом методе есть
 * авторизованный пользователь.
 */
class SkillupController extends Controller
{
    /**
     * Поля-словари, которые обязаны быть объектами даже пустыми.
     *
     * В PHP пустой массив превращается в JSON-массив `[]`, а не в объект `{}`.
     * Для фронтенда это ловушка: если приложение получит `cards: []` и сделает
     * `progress.cards['en-1#0'] = {...}`, то при следующем JSON.stringify этот
     * ключ пропадёт — у массива сохраняются только числовые индексы, и карточка
     * потеряется молча. Поэтому всегда отдаём объект.
     */
    private const MAP_FIELDS = ['cards', 'lessons', 'days', 'quests', 'achievements',
        'xpDays', 'minutes', 'perfectDays', 'touchDays', 'chestDays'];

    /**
     * Привести прогресс к виду, безопасному для клиента.
     *
     * @param array<string, mixed>|null $progress
     * @return array<string, mixed>|null
     */
    private function present(?array $progress): ?array
    {
        if ($progress === null) {
            return null;
        }
        foreach (self::MAP_FIELDS as $key) {
            $progress[$key] = (object) ($progress[$key] ?? []);
        }
        return $progress;
    }

    /**
     * GET /api/skillup/progress
     *
     * Вернуть прогресс текущего пользователя. Если его ещё нет — null,
     * а не 404: для клиента «пусто» и «не найдено» это одно и то же,
     * и лишний код ошибки только усложнил бы синхронизацию.
     */
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $row = SkillupProgress::query()->where('user_id', $user->id)->first();

        return response()->json([
            'progress' => $this->present($row?->progress),
            'revision' => $row?->revision ?? 0,
            'updated_at' => $row?->updated_at?->toIso8601String(),
            'client_updated_at' => $row?->client_updated_at?->toIso8601String(),
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * PUT /api/skillup/progress
     *
     * Полностью перезаписать прогресс (последняя запись побеждает).
     *
     * Если на сервере лежит более свежая правка по часам устройства,
     * сохранение всё равно происходит — клиент имеет право перезаписать, —
     * но в ответе поднимается флаг conflict. Приложение по нему может
     * предложить пользователю объединение вместо затирания.
     */
    public function update(SaveSkillupProgressRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $clean = SkillupMerger::normalize($request->validated('progress'));
        $clientAt = $request->validated('client_updated_at');

        $row = SkillupProgress::query()->where('user_id', $user->id)->first();
        $created = $row === null;

        $conflict = false;
        if ($row && $row->client_updated_at && $clientAt) {
            /* правка на сервере сделана позже той, что принесло устройство */
            $conflict = $row->client_updated_at->greaterThan(
                \Illuminate\Support\Carbon::parse($clientAt)
            );
        }

        if ($created) {
            $row = new SkillupProgress();
            $row->user_id = $user->id;
            $row->revision = 1;
        } else {
            $row->revision = $row->revision + 1;
        }

        $row->progress = $clean;
        $row->client_updated_at = $clientAt
            ? \Illuminate\Support\Carbon::parse($clientAt)
            : now();
        $row->save();

        return response()->json([
            'message' => $created ? 'Прогресс сохранён впервые.' : 'Прогресс сохранён.',
            'progress' => $row->progress,
            'revision' => $row->revision,
            'created' => $created,
            'conflict' => $conflict,
            'conflict_hint' => $conflict
                ? 'На сервере была более свежая запись. Возможно, вы занимались с другого устройства — используйте объединение, чтобы не потерять прогресс.'
                : null,
            'updated_at' => $row->updated_at?->toIso8601String(),
            'client_updated_at' => $row->client_updated_at?->toIso8601String(),
        ]);
    }

    /**
     * POST /api/skillup/merge
     *
     * Объединить прогресс устройства с тем, что лежит на сервере.
     *
     * Ни одна сторона не должна потерять достигнутое: опыт и счётчики
     * берутся максимумом, достижения, уроки и навыки — объединением,
     * карточки — по более выученной. Что именно изменилось, видно в
     * поле merged: приложение показывает это пользователю.
     */
    public function merge(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'progress' => ['required', 'array'],
            'client_updated_at' => ['nullable', 'date'],
        ], [
            'progress.required' => 'Не передан прогресс устройства.',
            'progress.array' => 'Прогресс должен быть объектом.',
        ]);

        $local = SkillupMerger::normalize($data['progress']);
        $row = SkillupProgress::query()->where('user_id', $user->id)->first();
        $server = $row ? SkillupMerger::normalize($row->progress ?? []) : [];

        $merged = SkillupMerger::merge($local, $server);

        /* что дало объединение — считаем до записи */
        $before = [
            'xp' => $server['xp'] ?? 0,
            'cards' => count($server['cards'] ?? []),
            'achievements' => count($server['achievements'] ?? []),
            'lessons' => count($server['lessons'] ?? []),
        ];

        if ($row === null) {
            $row = new SkillupProgress();
            $row->user_id = $user->id;
            $row->revision = 1;
        } else {
            $row->revision = $row->revision + 1;
        }
        $row->progress = $merged;
        /* Поле необязательное: если клиент его не прислал, ставим серверное
           время. Обращаться к $data['client_updated_at'] напрямую нельзя —
           отсутствующий ключ даёт предупреждение, Laravel превращает его в
           исключение, и вместо 200 прилетает 500. */
        $clientAt = $data['client_updated_at'] ?? null;
        $row->client_updated_at = $clientAt
            ? \Illuminate\Support\Carbon::parse($clientAt)
            : now();
        $row->save();

        return response()->json([
            'message' => 'Прогресс объединён.',
            'progress' => $row->progress,
            'revision' => $row->revision,
            'updated_at' => $row->updated_at?->toIso8601String(),
            'client_updated_at' => $row->client_updated_at?->toIso8601String(),
            'server_time' => now()->toIso8601String(),
            'merged' => [
                'had_server_progress' => $server !== [],
                'xp_before' => $before['xp'],
                'xp_after' => $merged['xp'] ?? 0,
                'xp_gained' => max(0, ($merged['xp'] ?? 0) - $before['xp']),
                'cards_total' => count($merged['cards'] ?? []),
                'cards_added' => max(0, count($merged['cards'] ?? []) - $before['cards']),
                'achievements_total' => count($merged['achievements'] ?? []),
                'achievements_added' => max(0, count($merged['achievements'] ?? []) - $before['achievements']),
                'lessons_total' => count($merged['lessons'] ?? []),
                'lessons_added' => max(0, count($merged['lessons'] ?? []) - $before['lessons']),
            ],
        ]);
    }

    /**
     * DELETE /api/skillup/account
     *
     * Удалить аккаунт вместе со всеми данными.
     *
     * Действие необратимое, поэтому есть две защиты:
     *   1. если клиент прислал пароль — он обязан быть верным;
     *   2. сотрудник (admin или manager) не может удалить себя этим
     *      маршрутом, иначе магазин останется без доступа в админку.
     *
     * Связанные записи удаляются явными запросами, а не расчётом на
     * ON DELETE CASCADE: так поведение не зависит от того, как именно
     * создавались внешние ключи на конкретной базе.
     */
    public function destroyAccount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'password' => ['nullable', 'string'],
            'confirm' => ['nullable', 'accepted'],
        ], [
            'confirm.accepted' => 'Подтвердите удаление аккаунта.',
        ]);

        if ($user->isStaff()) {
            throw ValidationException::withMessages([
                'account' => ['Аккаунт сотрудника нельзя удалить из приложения. Обратитесь к администратору.'],
            ]);
        }

        if (! empty($data['password']) && ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Неверный пароль.'],
            ]);
        }

        $id = $user->id;
        $removed = [];

        DB::transaction(function () use ($id, $user, &$removed) {
            /* Прогресс SkillUp */
            $removed['skillup_progress'] = SkillupProgress::query()->where('user_id', $id)->delete();

            /* Избранное и бронирования принадлежат только аккаунту */
            $removed['favorites'] = DB::table('favorites')->where('user_id', $id)->delete();
            $removed['bookings'] = DB::table('bookings')->where('user_id', $id)->delete();

            /* Заказы: сначала позиции, иначе останутся висеть без заказа */
            $orderIds = DB::table('orders')->where('user_id', $id)->pluck('id')->all();
            if ($orderIds !== []) {
                DB::table('order_items')->whereIn('order_id', $orderIds)->delete();
                $removed['orders'] = DB::table('orders')->whereIn('id', $orderIds)->delete();
            } else {
                $removed['orders'] = 0;
            }

            /* Заявки и отзывы обезличиваем: они нужны магазину как история
               работ, но привязки к человеку в них остаться не должно. */
            $removed['repairs_anonymized'] = DB::table('repair_requests')->where('user_id', $id)->update(['user_id' => null]);
            $removed['trade_ins_anonymized'] = DB::table('trade_ins')->where('user_id', $id)->update(['user_id' => null]);
            $removed['reviews_anonymized'] = DB::table('reviews')->where('user_id', $id)->update(['user_id' => null]);

            /* Токены и сессии — иначе выданный токен останется рабочим */
            $removed['tokens'] = DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->where('tokenable_id', $id)
                ->delete();
            $removed['sessions'] = DB::table('sessions')->where('user_id', $id)->delete();

            $user->delete();
        });

        return response()->json([
            'message' => 'Аккаунт и все связанные данные удалены.',
            'deleted' => $removed,
        ]);
    }

    /**
     * Лига недели: сколько опыта набрал каждый игрок с понедельника.
     *
     * Опыт по дням приложение хранит в прогрессе под ключом xpDays
     * (дата → опыт). Сервер складывает значения за текущую неделю —
     * таблица честная и считается без участия клиента.
     */
    public function league(Request $request): JsonResponse
    {
        $monday = date('Y-m-d', strtotime('monday this week'));

        $rows = DB::table('skillup_progress')
            ->join('users', 'users.id', '=', 'skillup_progress.user_id')
            ->select('skillup_progress.user_id', 'skillup_progress.progress', 'users.name')
            ->get();

        $me = $request->user()->id;
        $board = [];
        foreach ($rows as $row) {
            $progress = json_decode((string) $row->progress, true) ?: [];
            $xpDays = $progress['xpDays'] ?? [];
            if (! is_array($xpDays)) {
                continue;
            }
            $sum = 0;
            foreach ($xpDays as $date => $xp) {
                if (is_string($date) && $date >= $monday) {
                    $sum += (int) $xp;
                }
            }
            if ($sum <= 0) {
                continue;
            }
            $board[] = [
                'name' => $row->name ?: 'Игрок',
                'xp' => $sum,
                'me' => (int) $row->user_id === $me,
            ];
        }

        usort($board, static fn (array $a, array $b) => $b['xp'] <=> $a['xp']);

        return response()->json([
            'ok' => true,
            'week_start' => $monday,
            'board' => array_slice($board, 0, 50),
        ]);
    }
}
