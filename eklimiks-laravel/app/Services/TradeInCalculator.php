<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * Калькулятор оценки Trade-In.
 *
 * Формула:
 *   итог = базовая стоимость семейства устройства
 *        × коэффициент накопителя
 *        × коэффициент состояния
 *        × коэффициент ёмкости аккумулятора
 *
 * Результат округляется до целых рублей.
 *
 * Базовые стоимости и коэффициенты синхронизированы с блоком TRADEIN_FACTORS
 * в React-приложении (eklimiks/src/data/catalog.js), поэтому онлайн-калькулятор
 * на сайте и API дают одинаковые цифры.
 */
class TradeInCalculator
{
    /**
     * Базовые стоимости устройств (₽) в идеальном состоянии
     * для базовой конфигурации накопителя.
     *
     * @var array<string, int>
     */
    public const BASE_VALUES = [
        // iPhone
        'iphone 18 pro max' => 96000,
        'iphone 18 pro' => 84000,
        'iphone duo' => 132000,
        'iphone air' => 66000,
        'iphone 17 pro max' => 62000,
        'iphone 17 pro' => 55000,
        'iphone 17e' => 36000,
        'iphone 17' => 51000,
        'iphone 16 pro max' => 52000,
        'iphone 16 pro' => 46000,
        'iphone 16 plus' => 44000,
        'iphone 16e' => 29000,
        'iphone 16' => 39000,
        'iphone 15 pro max' => 43000,
        'iphone 15 pro' => 38000,
        'iphone 15 plus' => 31000,
        'iphone 15' => 29000,
        'iphone 14 pro max' => 34000,
        'iphone 14 pro' => 30000,
        'iphone 14' => 23000,
        'iphone 13 pro max' => 28000,
        'iphone 13 pro' => 25000,
        'iphone 13' => 19000,
        'iphone 12' => 14000,
        'iphone se' => 11000,
        // Mac
        'macbook pro 16' => 186000,
        'macbook pro 14' => 122000,
        'macbook air 15' => 92000,
        'macbook air 13' => 71000,
        'imac 24' => 88000,
        'imac' => 88000,
        'mac mini' => 42000,
        'mac studio' => 172000,
        'studio display' => 55000,
        // iPad
        'ipad pro 13' => 82000,
        'ipad pro 11' => 64000,
        'ipad air 13' => 44000,
        'ipad air 11' => 33000,
        'ipad mini' => 30000,
        'ipad' => 19000,
        // Apple Watch
        'apple watch ultra' => 44000,
        'watch ultra' => 44000,
        'apple watch series' => 22000,
        'watch series' => 22000,
        'apple watch se' => 11000,
        'watch se' => 11000,
        // Аудио
        'airpods pro' => 11000,
        'airpods max' => 26000,
        'airpods' => 5000,
        'homepod mini' => 6000,
        'homepod' => 13000,
        // Прочее
        'vision pro' => 178000,
        'apple vision pro' => 178000,
        'apple tv' => 7000,
        'airtag' => 900,
        'magic keyboard' => 12000,
        'pencil' => 6000,
    ];

    /** Стоимость по умолчанию, если семейство не распознано. */
    public const DEFAULT_BASE_VALUE = 8000;

    /**
     * Коэффициенты объёма накопителя.
     *
     * @var array<string, float>
     */
    public const STORAGE_FACTORS = [
        '64' => 0.88,
        '128' => 1.0,
        '256' => 1.14,
        '512' => 1.32,
        '1024' => 1.55,
        '1tb' => 1.55,
        '2048' => 1.8,
        '2tb' => 1.8,
        '4096' => 1.9,
        '4tb' => 1.9,
        '8192' => 2.0,
        '8tb' => 2.0,
    ];

    /**
     * Коэффициенты состояния устройства.
     *
     * @var array<string, float>
     */
    public const CONDITION_FACTORS = [
        'perfect' => 1.0,
        'good' => 0.82,
        'fair' => 0.6,
        'broken' => 0.3,
    ];

    /**
     * Рассчитать предварительную стоимость выкупа.
     *
     * @param  string  $deviceModel  Название устройства, например «iPhone 16 Pro 256 ГБ».
     * @param  string  $condition    perfect | good | fair | broken
     * @param  string|null  $storage Объём памяти («128», «256 ГБ», «1 ТБ»)
     * @param  int|null  $batteryHealth Ёмкость аккумулятора, %
     */
    public function estimate(string $deviceModel, string $condition, ?string $storage = null, ?int $batteryHealth = null): int
    {
        if (! array_key_exists($condition, self::CONDITION_FACTORS)) {
            throw new InvalidArgumentException('Недопустимое состояние устройства: ' . $condition);
        }

        $value = $this->baseValue($deviceModel)
            * $this->storageFactor($storage)
            * self::CONDITION_FACTORS[$condition]
            * $this->batteryFactor($batteryHealth);

        return (int) round($value);
    }

    /**
     * Оценка с подробной расшифровкой (удобно показывать пользователю).
     *
     * @return array<string, mixed>
     */
    public function breakdown(string $deviceModel, string $condition, ?string $storage = null, ?int $batteryHealth = null): array
    {
        $base = $this->baseValue($deviceModel);
        $storageFactor = $this->storageFactor($storage);
        $conditionFactor = self::CONDITION_FACTORS[$condition] ?? 0.3;
        $batteryFactor = $this->batteryFactor($batteryHealth);

        return [
            'device_model' => $deviceModel,
            'detected_family' => $this->detectFamily($deviceModel),
            'base_value' => $base,
            'storage' => $storage,
            'storage_factor' => $storageFactor,
            'condition' => $condition,
            'condition_factor' => $conditionFactor,
            'battery_health' => $batteryHealth,
            'battery_factor' => $batteryFactor,
            'estimated_price' => (int) round($base * $storageFactor * $conditionFactor * $batteryFactor),
        ];
    }

    /** Базовая стоимость по названию устройства. */
    public function baseValue(string $deviceModel): int
    {
        $family = $this->detectFamily($deviceModel);

        return $family !== null
            ? self::BASE_VALUES[$family]
            : self::DEFAULT_BASE_VALUE;
    }

    /**
     * Определение семейства устройства по строке.
     * Ищем самое длинное совпадение, чтобы «iphone 16 pro max» не превратился в «iphone 16».
     */
    public function detectFamily(string $deviceModel): ?string
    {
        $needle = $this->normalize($deviceModel);
        $best = null;

        foreach (array_keys(self::BASE_VALUES) as $family) {
            if (str_contains($needle, $family) && ($best === null || strlen($family) > strlen($best))) {
                $best = $family;
            }
        }

        return $best;
    }

    /** Коэффициент накопителя. */
    public function storageFactor(?string $storage): float
    {
        if ($storage === null || trim($storage) === '') {
            return 1.0;
        }

        $key = $this->normalizeStorage($storage);

        return self::STORAGE_FACTORS[$key] ?? 1.0;
    }

    /**
     * Коэффициент ёмкости аккумулятора:
     * >= 90% → 1.0; 80–89% → 0.95; < 80% → 0.88.
     */
    public function batteryFactor(?int $batteryHealth): float
    {
        if ($batteryHealth === null) {
            return 1.0;
        }

        return match (true) {
            $batteryHealth >= 90 => 1.0,
            $batteryHealth >= 80 => 0.95,
            default => 0.88,
        };
    }

    /** Приводим строку к нижнему регистру, убираем «ё», лишние пробелы и кавычки. */
    private function normalize(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = str_replace(['ё', '«', '»', '"', "'", ',', '(', ')'], ['е', '', '', '', '', '', '', ''], $value);
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return $value;
    }

    /**
     * «256 ГБ» → «256», «1 ТБ» → «1tb», «—» → «».
     * Единицы измерения убираем после определения терабайтов.
     */
    private function normalizeStorage(string $storage): string
    {
        $value = $this->normalize($storage);

        // Нечисловые варианты («—», размеры корпуса) не влияют на оценку
        if (preg_match('/\d/', $value) !== 1) {
            return '';
        }

        $isTerabyte = str_contains($value, 'тб') || str_contains($value, 'tb');
        $number = (int) preg_replace('/\D+/', '', $value);

        if ($isTerabyte) {
            return ($number > 0 ? $number : 1) . 'tb';
        }

        return (string) $number;
    }
}
