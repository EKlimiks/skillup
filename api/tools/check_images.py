#!/usr/bin/env python3
"""
Сверка каталога сидера с реальными файлами изображений фронтенда.

Проверяет, что для каждого товара ProductSeeder сгенерирует путь
img/products/<slug>--<color-slug>.webp, и что такой файл существует
в eklimiks/public/img/products/.

Запуск: python tools/check_images.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "database" / "data" / "products.php"
SEEDER = ROOT / "database" / "seeders" / "ProductSeeder.php"
FRONT_IMAGES = ROOT.parent / "eklimiks" / "public" / "img" / "products"
FALLBACK_IMAGES = ROOT.parent / "eklimiks-laravel" / "public" / "img" / "products"

TRANSLIT_FROM = list("абвгдежзийклмнопрстуфхцчшщыэюя ")
TRANSLIT_TO = ["a", "b", "v", "g", "d", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p",
               "r", "s", "t", "u", "f", "h", "c", "ch", "sh", "sch", "y", "e", "yu", "ya", "-"]


def color_map() -> dict[str, str]:
    src = SEEDER.read_text(encoding="utf-8")
    block = src[src.index("COLOR_SLUGS = ["):]
    block = block[: block.index("];")]
    return dict(re.findall(r"'([^']+)'\s*=>\s*'([^']+)'", block))


def translit(name: str) -> str:
    key = name.strip().lower()
    out = []
    for ch in key:
        idx = TRANSLIT_FROM.index(ch) if ch in TRANSLIT_FROM else -1
        out.append(TRANSLIT_TO[idx] if idx >= 0 else ch)
    slug = "".join(out)
    return re.sub(r"[^a-z0-9\-]+", "", slug).strip("-")


def main() -> int:
    mapping = color_map()
    text = DATA.read_text(encoding="utf-8")
    body = text[text.index("return [") :]
    blocks = re.split(r"\n    \[", body)[1:]

    expected: list[tuple[str, str, str]] = []
    fallback_used: list[str] = []

    for block in blocks:
        slug = re.search(r"'slug'\s*=>\s*'([^']+)'", block).group(1)
        colors = re.findall(
            r"\['id'\s*=>\s*'([^']+)',\s*'name'\s*=>\s*'([^']+)',\s*'hex'\s*=>\s*'#[0-9a-fA-F]{3,8}'\]",
            block,
        )
        for color_id, color_name in colors:
            expected.append((f"img/products/{slug}--{color_id}.webp", slug, color_name))

    available: set[str] = set()
    source = None
    for folder in (FRONT_IMAGES, FALLBACK_IMAGES):
        if folder.exists():
            available |= {p.name for p in folder.glob("*.webp")}
            source = source or folder
    if not available:
        print("! Папка с изображениями не найдена — сверка пропущена")
        return 0

    print(f"Изображений в {source}: {len(available)}")
    print(f"Ожидается путей по каталогу: {len(expected)}")

    missing = [e for e in expected if Path(e[0]).name not in available]
    unused = sorted(available - {Path(e[0]).name for e in expected})

    if fallback_used:
        print(f"\n-- Фолбэк-транслитерация ({len(fallback_used)}) --")
        for f in fallback_used:
            print("  ~", f)

    if missing:
        print(f"\n-- НЕТ ФАЙЛА ({len(missing)}) --")
        for path, slug, color in missing:
            print(f"  x {path}   ({slug}, цвет «{color}»)")
    else:
        print("\nOK: все пути изображений из каталога существуют")

    if unused:
        print(f"\n-- Файлы без товара в каталоге ({len(unused)}) --")
        for name in unused:
            print("  ?", name)

    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
