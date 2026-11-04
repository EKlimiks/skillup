#!/usr/bin/env python3
"""
Приведение блока colors в database/data/products.php к единому формату:

    ['id' => 'black', 'name' => 'Чёрный', 'hex' => '#1d1d1f'],

`id` — идентификатор цвета, из которого собирается путь к изображению
(img/products/<slug>--<id>.webp). Он совпадает с id из React-каталога
(eklimiks/src/data/catalog.js), поэтому API и фронтенд ссылаются
на одни и те же файлы.

Запуск: python tools/normalize_colors.py
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "database" / "data" / "products.php"
IMAGES = ROOT.parent / "eklimiks" / "public" / "img" / "products"

# slug товара -> список (color_id, название, hex)
CATALOG_COLORS: dict[str, list[tuple[str, str, str]]] = {
    # --- iPhone ---
    "iphone-18-pro-max": [
        ("black", "Чёрный", "#1d1d1f"),
        ("burgundy", "Бордовый", "#6d2b34"),
        ("glacier", "Ледяной", "#d7dee4"),
    ],
    "iphone-18-pro": [
        ("black", "Чёрный", "#1d1d1f"),
        ("burgundy", "Бордовый", "#6d2b34"),
        ("glacier", "Ледяной", "#d7dee4"),
        ("silver", "Серебристый", "#e2e3e5"),
    ],
    "iphone-duo": [
        ("nightsky", "Ночное небо", "#2b3049"),
        ("starwhite", "Звёздный белый", "#f1efe9"),
    ],
    "iphone-air": [
        ("cloudwhite", "Облачный белый", "#f3f1ed"),
        ("lightgold", "Светлое золото", "#e7d8bf"),
        ("skyblue", "Небесно-голубой", "#cfe0ea"),
        ("spaceblack", "Космический чёрный", "#2f2f31"),
    ],
    "iphone-17": [
        ("black", "Чёрный", "#1d1d1f"),
        ("lavender", "Лавандовый", "#d8cee7"),
        ("mistblue", "Дымчато-синий", "#b8cddd"),
        ("sage", "Шалфейный", "#ccd5c3"),
        ("white", "Белый", "#f4f4f4"),
    ],
    "iphone-17e": [
        ("black", "Чёрный", "#1d1d1f"),
        ("softpink", "Нежно-розовый", "#f1d2db"),
        ("white", "Белый", "#f4f4f4"),
    ],
    "iphone-16": [
        ("black", "Чёрный", "#1d1d1f"),
        ("pink", "Розовый", "#efc1cd"),
        ("teal", "Бирюзовый", "#a7cec7"),
        ("ultramarine", "Ультрамарин", "#7a8bdf"),
        ("white", "Белый", "#f4f4f4"),
    ],
    "iphone-16-plus": [
        ("black", "Чёрный", "#1d1d1f"),
        ("pink", "Розовый", "#efc1cd"),
        ("teal", "Бирюзовый", "#a7cec7"),
        ("ultramarine", "Ультрамарин", "#7a8bdf"),
        ("white", "Белый", "#f4f4f4"),
    ],
    "iphone-16e": [
        ("black", "Чёрный", "#1d1d1f"),
        ("white", "Белый", "#f4f4f4"),
    ],
    # --- Mac ---
    "macbook-pro-16": [
        ("spaceblack", "Космический чёрный", "#2f2f31"),
        ("silver", "Серебристый", "#e2e3e5"),
    ],
    "macbook-pro-14": [
        ("spaceblack", "Космический чёрный", "#2f2f31"),
        ("silver", "Серебристый", "#e2e3e5"),
    ],
    "macbook-air-15": [
        ("midnight", "Полночный", "#24272f"),
        ("starlight", "Звёздный свет", "#e8e1d5"),
        ("skyblue", "Небесно-голубой", "#cfe0ea"),
        ("silver", "Серебристый", "#e2e3e5"),
    ],
    "macbook-air-13": [
        ("midnight", "Полночный", "#24272f"),
        ("starlight", "Звёздный свет", "#e8e1d5"),
        ("skyblue", "Небесно-голубой", "#cfe0ea"),
        ("silver", "Серебристый", "#e2e3e5"),
    ],
    "imac-24": [
        ("blue", "Голубой", "#a8c3dc"),
        ("orange", "Оранжевый", "#efa05a"),
        ("pink", "Розовый", "#efc1cd"),
        ("purple", "Фиолетовый", "#cab7dc"),
        ("green", "Зелёный", "#a7d4b4"),
        ("yellow", "Жёлтый", "#efde9f"),
    ],
    "mac-mini": [("silver", "Серебристый", "#e2e3e5")],
    "mac-studio": [("silver", "Серебристый", "#e2e3e5")],
    "studio-display": [("silver", "Серебристый", "#e2e3e5")],
    # --- iPad ---
    "ipad-pro-13": [
        ("spaceblack", "Космический чёрный", "#2f2f31"),
        ("silver", "Серебристый", "#e2e3e5"),
    ],
    "ipad-pro-11": [
        ("spaceblack", "Космический чёрный", "#2f2f31"),
        ("silver", "Серебристый", "#e2e3e5"),
    ],
    "ipad-air-13": [
        ("blue", "Голубой", "#a8c3dc"),
        ("purple", "Фиолетовый", "#cab7dc"),
        ("spacegray", "Серый космос", "#7c7e82"),
        ("starlight", "Звёздный свет", "#e8e1d5"),
    ],
    "ipad-air-11": [
        ("blue", "Голубой", "#a8c3dc"),
        ("purple", "Фиолетовый", "#cab7dc"),
        ("spacegray", "Серый космос", "#7c7e82"),
        ("starlight", "Звёздный свет", "#e8e1d5"),
    ],
    "ipad-mini": [
        ("blue", "Голубой", "#a8c3dc"),
        ("starlight", "Звёздный свет", "#e8e1d5"),
    ],
    "ipad-10": [
        ("blue", "Голубой", "#a8c3dc"),
        ("pink", "Розовый", "#efc1cd"),
        ("silver", "Серебристый", "#e2e3e5"),
        ("yellow", "Жёлтый", "#efde9f"),
    ],
    # --- Apple Watch ---
    "watch-ultra": [("natural", "Натуральный титан", "#cec5b7")],
    "watch-series-12": [("black", "Чёрный", "#1d1d1f")],
    "watch-se-3": [("midnight", "Полночный", "#24272f")],
    # --- Аудио ---
    "airpods-pro-3": [("white", "Белый", "#f4f4f4")],
    "airpods-5": [("white", "Белый", "#f4f4f4")],
    "airpods-4": [("white", "Белый", "#f4f4f4")],
    "airpods-max": [
        ("midnight", "Полночный", "#24272f"),
        ("blue", "Голубой", "#a8c3dc"),
        ("purple", "Фиолетовый", "#cab7dc"),
        ("orange", "Оранжевый", "#efa05a"),
        ("starlight", "Звёздный свет", "#e8e1d5"),
    ],
    "homepod": [("midnight", "Полночный", "#24272f")],
    "homepod-mini": [("midnight", "Полночный", "#24272f")],
    # --- ТВ и Дом ---
    "apple-tv": [("black", "Чёрный", "#1d1d1f")],
    # --- Vision ---
    "vision-pro": [("silver", "Серебристый", "#e2e3e5")],
    # --- Аксессуары ---
    "airtag": [("white", "Белый", "#f4f4f4")],
    "pencil-pro": [("white", "Белый", "#f4f4f4")],
    "magic-keyboard": [("black", "Чёрный", "#1d1d1f")],
}


def colors_block(entries: list[tuple[str, str, str]]) -> str:
    lines = "\n".join(
        f"            ['id' => '{cid}', 'name' => '{name}', 'hex' => '{hex_value}'],"
        for cid, name, hex_value in entries
    )
    return f"'colors' => [\n{lines}\n        ],"


def main() -> int:
    available = {p.name for p in IMAGES.glob("*.webp")} if IMAGES.exists() else set()
    text = DATA.read_text(encoding="utf-8")
    report: list[str] = []

    def process(match: re.Match[str]) -> str:
        block = match.group(0)
        slug_match = re.search(r"'slug'\s*=>\s*'([^']+)'", block)
        if not slug_match:
            return block
        slug = slug_match.group(1)

        entries = CATALOG_COLORS.get(slug)
        if entries is None:
            report.append(f"  ? {slug}: нет описания цветов, блок не изменён")
            return block

        if available:
            missing = [cid for cid, _, _ in entries if f"{slug}--{cid}.webp" not in available]
            if missing:
                report.append(f"  ! {slug}: нет файлов для цветов {missing}")

        color_match = re.search(r"'colors'\s*=>\s*\[.*?\n        \],", block, re.S)
        if not color_match:
            report.append(f"  ? {slug}: не найден блок colors")
            return block

        report.append(f"  + {slug}: {len(entries)} цвет(ов) -> " + ", ".join(c[0] for c in entries))
        return block[: color_match.start()] + colors_block(entries) + block[color_match.end():]

    new_text = re.sub(r"^    \[\n.*?^    \],$", process, text, flags=re.S | re.M)

    checks = (
        new_text.count("'slug' =>") == text.count("'slug' =>") == 37,
        new_text.count("'colors' =>") == text.count("'colors' =>") == 37,
        new_text.count("'specs' =>") == text.count("'specs' =>") == 37,
        new_text.count("'description' =>") == text.count("'description' =>") == 37,
    )
    if not all(checks):
        print("! Проверка структуры не пройдена, файл не изменён:", checks)
        return 1

    DATA.write_text(new_text, encoding="utf-8")

    for line in report:
        print(line)
    print(f"\nОбновлено товаров: {len(CATALOG_COLORS)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
