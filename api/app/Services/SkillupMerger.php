<?php

namespace App\Services;

/**
 * Приведение и объединение прогресса SkillUp.
 *
 * Зачем это отдельным классом: прогресс приходит с устройства, то есть
 * ему нельзя доверять. Сначала структура приводится к известному виду
 * (normalize), и только потом объединяется (merge).
 *
 * Правила объединения подобраны так, чтобы ни одно устройство не
 * потеряло достигнутое:
 *
 *   опыт, рекорд серии, счётчики  → максимум
 *   достижения, уроки, навыки     → объединение множеств
 *   дни занятий                   → по каждому дню максимум
 *   карточки                      → выживает более «продвинутая»
 *   текущая серия и настройки     → берём с того устройства, где позже правили
 */
final class SkillupMerger
{
    /** Все ключи, которые мы готовы хранить. Остальное отбрасываем. */
    private const KNOWN_KEYS = [
        'version', 'xp', 'streak', 'bestStreak', 'lastActive', 'freezes',
        'cards', 'lessons', 'days', 'quests', 'combo', 'bestCombo',
        'achievements', 'settings', 'stats', 'skillsTouched',
        'gems', 'xpDays', 'hearts', 'heartsAt',
        'minutes', 'perfectDays', 'touchDays', 'chestDays',
    ];

    private const STAT_KEYS = [
        'totalAnswers', 'correct', 'wrong',
        'lessonsDone', 'perfectLessons', 'questsDone', 'mastered',
        'focusCount', 'focusMinutes',
    ];

    private const SETTING_KEYS = ['goal', 'reminder', 'reminderTime'];

    private const CARD_KEYS = ['ef', 'interval', 'due', 'reps', 'lapses'];

    /**
     * Привести произвольный массив к известной структуре.
     *
     * @param array<string, mixed> $raw
     * @return array<string, mixed>
     */
    public static function normalize(array $raw): array
    {
        $out = [];

        /* числа */
        foreach (['version', 'xp', 'streak', 'bestStreak', 'freezes', 'combo', 'bestCombo'] as $k) {
            $out[$k] = self::int($raw[$k] ?? 0);
        }

        /* дата последнего занятия — строка вида 2026-10-16 */
        $out['lastActive'] = self::dayOrNull($raw['lastActive'] ?? null);

        /* гемы и сердечки */
        $out['gems'] = max(0, self::int($raw['gems'] ?? 0));
        $out['hearts'] = max(0, min(5, self::int($raw['hearts'] ?? 5)));
        $out['heartsAt'] = max(0, self::int($raw['heartsAt'] ?? 0));

        /* опыт по дням — для лиги недели */
        $out['xpDays'] = [];
        foreach (self::map($raw['xpDays'] ?? []) as $date => $xp) {
            $d = self::dayOrNull($date);
            if ($d !== null) {
                $out['xpDays'][$d] = max(0, self::int($xp));
            }
        }

        /* минуты занятий по дням */
        $out['minutes'] = [];
        foreach (self::map($raw['minutes'] ?? []) as $date => $m) {
            $d = self::dayOrNull($date);
            if ($d !== null) {
                $out['minutes'][$d] = max(0, self::int($m));
            }
        }

        /* идеальные уроки по дням */
        $out['perfectDays'] = [];
        foreach (self::map($raw['perfectDays'] ?? []) as $date => $count) {
            $d = self::dayOrNull($date);
            if ($d !== null) {
                $out['perfectDays'][$d] = max(0, self::int($count));
            }
        }

        /* навыки, которых касались по дням */
        $out['touchDays'] = [];
        foreach (self::map($raw['touchDays'] ?? []) as $date => $ids) {
            $d = self::dayOrNull($date);
            if ($d === null || ! is_array($ids)) {
                continue;
            }
            $clean = [];
            foreach ($ids as $id) {
                if (is_string($id)) {
                    $clean[] = $id;
                }
            }
            $out['touchDays'][$d] = array_values(array_unique($clean));
        }

        /* дни с полученным сундуком: дата → 1 */
        $out['chestDays'] = [];
        foreach (self::map($raw['chestDays'] ?? []) as $date => $v) {
            $d = self::dayOrNull($date);
            if ($d !== null && (int) $v) {
                $out['chestDays'][$d] = 1;
            }
        }

        /* карточки: id → состояние интервального повторения */
        $out['cards'] = [];
        foreach (self::map($raw['cards'] ?? []) as $id => $card) {
            if (! is_array($card) || ! self::validId($id)) {
                continue;
            }
            $clean = [];
            foreach (self::CARD_KEYS as $k) {
                $clean[$k] = $k === 'ef' ? self::float($card[$k] ?? 0) : self::int($card[$k] ?? 0);
            }
            /* коэффициент лёгкости ниже 1.3 ломает алгоритм SM-2 */
            $clean['ef'] = max(1.3, min(5.0, $clean['ef']));
            $out['cards'][(string) $id] = $clean;
        }

        /* уроки: id → дата прохождения */
        $out['lessons'] = [];
        foreach (self::map($raw['lessons'] ?? []) as $id => $date) {
            $d = self::dayOrNull($date);
            if (self::validId($id) && $d !== null) {
                $out['lessons'][(string) $id] = $d;
            }
        }

        /* дни занятий: дата → число ответов */
        $out['days'] = [];
        foreach (self::map($raw['days'] ?? []) as $date => $count) {
            $d = self::dayOrNull($date);
            if ($d !== null) {
                $out['days'][$d] = max(0, self::int($count));
            }
        }

        /* ежедневные задания: дата → список */
        $out['quests'] = [];
        foreach (self::map($raw['quests'] ?? []) as $date => $entry) {
            $d = self::dayOrNull($date);
            if ($d === null || ! is_array($entry)) {
                continue;
            }
            $list = [];
            foreach ((array) ($entry['list'] ?? []) as $q) {
                if (! is_array($q) || ! self::validId($q['id'] ?? null)) {
                    continue;
                }
                $list[] = [
                    'id' => (string) $q['id'],
                    'done' => (bool) ($q['done'] ?? false),
                    'progress' => max(0, self::int($q['progress'] ?? 0)),
                    'need' => max(1, self::int($q['need'] ?? 1)),
                ];
            }
            $out['quests'][$d] = ['list' => $list];
        }

        /* достижения: id → время получения (метка Unix) */
        $out['achievements'] = [];
        foreach (self::map($raw['achievements'] ?? []) as $id => $at) {
            if (self::validId($id)) {
                $out['achievements'][(string) $id] = self::int($at);
            }
        }

        /* настройки устройства */
        $settings = is_array($raw['settings'] ?? null) ? $raw['settings'] : [];
        $out['settings'] = [
            'goal' => max(1, min(500, self::int($settings['goal'] ?? 20))),
            'reminder' => (bool) ($settings['reminder'] ?? false),
            'reminderTime' => self::timeOr($settings['reminderTime'] ?? null, '19:00'),
        ];

        /* счётчики */
        $stats = is_array($raw['stats'] ?? null) ? $raw['stats'] : [];
        $out['stats'] = [];
        foreach (self::STAT_KEYS as $k) {
            $out['stats'][$k] = max(0, self::int($stats[$k] ?? 0));
        }

        /* затронутые навыки */
        $out['skillsTouched'] = [];
        foreach ((array) ($raw['skillsTouched'] ?? []) as $s) {
            if (is_string($s) && self::validId($s)) {
                $out['skillsTouched'][] = $s;
            }
        }
        $out['skillsTouched'] = array_values(array_unique($out['skillsTouched']));

        /* ничего лишнего не храним */
        return array_intersect_key($out, array_flip(self::KNOWN_KEYS));
    }

    /**
     * Объединить два прогресса. Ни один не должен потерять достигнутое.
     *
     * @param array<string, mixed> $local нормализованный прогресс устройства
     * @param array<string, mixed> $server нормализованный прогресс с сервера
     * @return array<string, mixed>
     */
    public static function merge(array $local, array $server): array
    {
        $l = self::normalize($local);
        $s = self::normalize($server);

        /* Кто «новее» — тот и задаёт текущее состояние (серия, заморозки,
           настройки). Рекорды и счётчики при этом берём максимумом, чтобы
           ничего не потерять. */
        $localIsNewer = self::compareDays($l['lastActive'], $s['lastActive']) >= 0;
        $newer = $localIsNewer ? $l : $s;

        $out = [];

        /* ── то, что только растёт ── */
        $out['version'] = max($l['version'], $s['version'], 1);
        $out['xp'] = max($l['xp'], $s['xp']);
        $out['bestStreak'] = max($l['bestStreak'], $s['bestStreak']);
        $out['bestCombo'] = max($l['bestCombo'], $s['bestCombo']);
        $out['gems'] = max($l['gems'], $s['gems']);

        /* ── текущее состояние берём с более свежего устройства ── */
        $out['streak'] = $newer['streak'];
        $out['combo'] = $newer['combo'];
        $out['freezes'] = $newer['freezes'];
        $out['lastActive'] = $newer['lastActive'];
        $out['hearts'] = $newer['hearts'];
        $out['heartsAt'] = $newer['heartsAt'];

        /* ── настройки: что выбрал пользователь на этом устройстве ── */
        $out['settings'] = $localIsNewer ? $l['settings'] : $s['settings'];

        /* ── счётчики: максимум по каждому ── */
        $out['stats'] = [];
        foreach (self::STAT_KEYS as $k) {
            $out['stats'][$k] = max($l['stats'][$k], $s['stats'][$k]);
        }

        /* ── множества: объединяем ── */
        $out['skillsTouched'] = array_values(array_unique(
            array_merge($l['skillsTouched'], $s['skillsTouched'])
        ));

        /* Достижение могло быть получено на любом устройстве — берём самое
           раннее время, чтобы дата в профиле не «съезжала» вперёд. */
        $out['achievements'] = $l['achievements'];
        foreach ($s['achievements'] as $id => $at) {
            if (! isset($out['achievements'][$id])) {
                $out['achievements'][$id] = $at;
            } else {
                $a = $out['achievements'][$id];
                $out['achievements'][$id] = ($a > 0 && $at > 0) ? min($a, $at) : max($a, $at);
            }
        }

        /* Урок проходится один раз: оставляем самую раннюю дату. */
        $out['lessons'] = $l['lessons'];
        foreach ($s['lessons'] as $id => $date) {
            if (! isset($out['lessons'][$id])) {
                $out['lessons'][$id] = $date;
            } else {
                $out['lessons'][$id] = min($out['lessons'][$id], $date);
            }
        }

        /* Дни занятий: за один день на двух устройствах — берём большее число. */
        $out['days'] = $l['days'];
        foreach ($s['days'] as $date => $count) {
            $out['days'][$date] = max($out['days'][$date] ?? 0, $count);
        }
        ksort($out['days']);

        /* Опыт, минуты и идеальные уроки по дням — максимум за день. */
        foreach (['xpDays', 'minutes', 'perfectDays'] as $mapKey) {
            $out[$mapKey] = $l[$mapKey];
            foreach ($s[$mapKey] as $date => $value) {
                $out[$mapKey][$date] = max($out[$mapKey][$date] ?? 0, $value);
            }
            ksort($out[$mapKey]);
        }

        /* Навыки по дням — объединение за день. */
        $out['touchDays'] = $l['touchDays'];
        foreach ($s['touchDays'] as $date => $ids) {
            $out['touchDays'][$date] = array_values(array_unique(
                array_merge($out['touchDays'][$date] ?? [], $ids)
            ));
        }
        ksort($out['touchDays']);

        /* Сундук за день — объединение: если получили на любом устройстве,
           второй раз на другом уже не выдастся. */
        $out['chestDays'] = $l['chestDays'];
        foreach ($s['chestDays'] as $date => $v) {
            $out['chestDays'][$date] = 1;
        }
        ksort($out['chestDays']);

        /* ── карточки: выживает более продвинутая ── */
        $out['cards'] = $l['cards'];
        foreach ($s['cards'] as $id => $card) {
            if (! isset($out['cards'][$id])) {
                $out['cards'][$id] = $card;
                continue;
            }
            $out['cards'][$id] = self::betterCard($out['cards'][$id], $card);
        }

        /* ── задания: объединяем по дате ── */
        $out['quests'] = $l['quests'];
        foreach ($s['quests'] as $date => $entry) {
            if (! isset($out['quests'][$date])) {
                $out['quests'][$date] = $entry;
                continue;
            }
            $byId = [];
            foreach (array_merge($out['quests'][$date]['list'], $entry['list']) as $q) {
                $prev = $byId[$q['id']] ?? null;
                if ($prev === null) {
                    $byId[$q['id']] = $q;
                } else {
                    /* выполненное задание важнее, прогресс — больше */
                    $byId[$q['id']] = [
                        'id' => $q['id'],
                        'done' => $prev['done'] || $q['done'],
                        'progress' => max($prev['progress'], $q['progress']),
                        'need' => max($prev['need'], $q['need']),
                    ];
                }
            }
            $out['quests'][$date] = ['list' => array_values($byId)];
        }
        /* старые записи заданий не нужны — храним последние 60 дней */
        if (count($out['quests']) > 60) {
            krsort($out['quests']);
            $out['quests'] = array_slice($out['quests'], 0, 60, true);
            ksort($out['quests']);
        }

        return self::normalize($out);
    }

    /* ═════════════ вспомогательное ═════════════ */

    /**
     * Какая карточка «продвинутее».
     *
     * Сначала смотрим на интервал: он и есть мера выученного. Если равны —
     * на число успешных повторений, затем на коэффициент лёгкости. Ошибки
     * берём по максимуму: нечестно «забывать» провалы.
     *
     * @param array<string, mixed> $a
     * @param array<string, mixed> $b
     * @return array<string, mixed>
     */
    private static function betterCard(array $a, array $b): array
    {
        $better = $a;
        if ($b['interval'] > $a['interval']
            || ($b['interval'] === $a['interval'] && $b['reps'] > $a['reps'])
            || ($b['interval'] === $a['interval'] && $b['reps'] === $a['reps'] && $b['ef'] > $a['ef'])) {
            $better = $b;
        }
        $better['lapses'] = max($a['lapses'], $b['lapses']);
        return $better;
    }

    /** Сравнение дат вида YYYY-MM-DD; null считается самой ранней. */
    private static function compareDays(?string $a, ?string $b): int
    {
        if ($a === $b) {
            return 0;
        }
        if ($a === null) {
            return -1;
        }
        if ($b === null) {
            return 1;
        }
        return strcmp($a, $b);
    }

    /** @return array<string, mixed> */
    private static function map(mixed $v): array
    {
        return is_array($v) ? $v : [];
    }

    private static function int(mixed $v): int
    {
        if (is_bool($v)) {
            return $v ? 1 : 0;
        }
        return is_numeric($v) ? (int) $v : 0;
    }

    private static function float(mixed $v): float
    {
        return is_numeric($v) ? (float) $v : 0.0;
    }

    /** Ключ карточки или урока: буквы, цифры, дефис, подчёркивание, решётка. */
    private static function validId(mixed $id): bool
    {
        return is_string($id)
            && $id !== ''
            && strlen($id) <= 64
            && preg_match('/^[A-Za-z0-9_#\-]+$/', $id) === 1;
    }

    /** Дата в формате YYYY-MM-DD или null. */
    private static function dayOrNull(mixed $v): ?string
    {
        if (! is_string($v) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) !== 1) {
            return null;
        }
        [$y, $m, $d] = array_map('intval', explode('-', $v));
        return checkdate($m, $d, $y) ? $v : null;
    }

    /** Время в формате HH:MM. */
    private static function timeOr(mixed $v, string $fallback): string
    {
        if (is_string($v) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $v) === 1) {
            return $v;
        }
        return $fallback;
    }
}
