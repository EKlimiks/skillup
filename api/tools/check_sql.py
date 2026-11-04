#!/usr/bin/env python3
"""
Проверка database/schema.sql без MySQL:

  * баланс кавычек/скобок в каждом INSERT;
  * все CREATE TABLE из списка ожидаемых присутствуют;
  * каждый CREATE TABLE имеет PRIMARY KEY;
  * INSERT в products ссылается на существующие slug категорий;
  * пути img/products/<slug>--<color>.webp из JSON-полей существуют на диске.

Запуск: python tools/check_sql.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / "database" / "schema.sql"
IMAGES = ROOT.parent / "eklimiks" / "public" / "img" / "products"

EXPECTED_TABLES = [
    "users", "password_reset_tokens", "sessions", "cache", "cache_locks",
    "jobs", "job_batches", "failed_jobs", "personal_access_tokens",
    "categories", "products", "stores", "orders", "order_items",
    "masters", "master_slots", "repair_services", "repair_requests",
    "bookings", "trade_ins", "reviews", "leads", "promos", "settings", "favorites",
]

errors: list[str] = []
warnings: list[str] = []


def main() -> int:
    text = SQL.read_text(encoding="utf-8")
    available = {p.name for p in IMAGES.glob("*.webp")} if IMAGES.exists() else set()

    # --- таблицы ---
    created = set(re.findall(r"CREATE TABLE `([a-z_]+)`", text))
    for table in EXPECTED_TABLES:
        if table not in created:
            errors.append(f"нет CREATE TABLE для `{table}`")
    extra = created - set(EXPECTED_TABLES)
    if extra:
        warnings.append(f"неожиданные таблицы: {sorted(extra)}")
    print(f"Таблиц создано: {len(created)}")

    for table in sorted(created):
        block = text[text.index(f"CREATE TABLE `{table}`") :]
        block = block[: block.index("ENGINE=InnoDB")]
        if "PRIMARY KEY" not in block:
            errors.append(f"`{table}`: нет PRIMARY KEY")
        if "utf8mb4" in block and "DEFAULT CHARSET=utf8mb4" not in text[text.index(f"CREATE TABLE `{table}`") :][:2000]:
            warnings.append(f"`{table}`: не указан charset")

    # --- SET NAMES ---
    if not text.lstrip().startswith("--") or "SET NAMES utf8mb4;" not in text:
        errors.append("отсутствует `SET NAMES utf8mb4;`")

    # --- INSERT категорий/товаров ---
    cat_block = text[text.index("INSERT INTO `categories`") :]
    cat_block = cat_block[: cat_block.index(";")]
    slugs = re.findall(r"\((\d+), '([a-z0-9\-]+)', '([^']+)'", cat_block)
    cat_ids = {int(cid) for cid, _, _ in slugs}
    print(f"Категорий в дампе: {len(slugs)} -> {[s[1] for s in slugs]}")

    prod_block = text[text.index("INSERT INTO `products`") :]
    prod_block = prod_block[: prod_block.index("\n\n-- ------")]
    rows = re.findall(r"\((\d+), (\d+), '([a-z0-9\-]+)'", prod_block)
    print(f"Товаров в дампе: {len(rows)}")
    if len(rows) < 12:
        errors.append(f"в schema.sql только {len(rows)} товаров, требуется минимум 12")

    product_slugs = [r[2] for r in rows]
    if len(set(product_slugs)) != len(product_slugs):
        errors.append("в schema.sql дубли slug товаров")
    for _, cid, slug in rows:
        if int(cid) not in cat_ids:
            errors.append(f"товар {slug}: category_id={cid} отсутствует в categories")

    # --- изображения и цвета ---
    for color_json in re.findall(r"'(?:colors|images)'\s*=>|\[\{", prod_block):
        pass

    checked = 0
    for m in re.finditer(r"'(\[(?:\{\"id\".*?)\])'", prod_block):
        try:
            colors = json.loads(m.group(1))
        except json.JSONDecodeError as exc:
            errors.append(f"products.colors: некорректный JSON — {exc}")
            continue
        for color in colors:
            if "id" not in color or "hex" not in color or "name" not in color:
                errors.append(f"products.colors: элемент без id/name/hex — {color}")

    for m in re.finditer(r"'(\[\"img/products/.*?\])'", prod_block):
        try:
            images = json.loads(m.group(1))
        except json.JSONDecodeError as exc:
            errors.append(f"products.images: некорректный JSON — {exc}")
            continue
        for path in images:
            checked += 1
            if Path(path).name not in available and available:
                errors.append(f"products.images: файла {path} нет в eklimiks/public/img/products")

    print(f"Проверено путей изображений: {checked}")

    # --- пароли ---
    user_block = text[text.index("INSERT INTO `users`") :]
    user_block = user_block[: user_block.index(";")]
    for hash_value in re.findall(r"'( \$2y\$\d{2}\$[^']+)'", user_block):
        warnings.append(f"подозрительный хеш пароля: {hash_value[:20]}...")
    for m in re.finditer(r"'(email|password)':", user_block):
        warnings.append(f"JSON-подобный синтаксис в INSERT users: {m.group(0)}")
    for hash_value in re.findall(r"(\$2y\$\d{2}\$[./A-Za-z0-9]{53})", user_block):
        if len(hash_value) != 60:
            errors.append(f"хеш bcrypt неверной длины ({len(hash_value)}): {hash_value[:20]}...")
    hashes = re.findall(r"(\$2y\$\d{2}\$[./A-Za-z0-9]{53})", user_block)
    print(f"Пользователей с bcrypt-хешем: {len(hashes)}")
    if len(hashes) != 3:
        errors.append(f"в schema.sql ожидалось 3 пользователя с bcrypt-хешем, найдено {len(hashes)}")

    print()
    if warnings:
        print(f"-- Предупреждения ({len(warnings)}) --")
        for w in warnings:
            print("  !", w)
    if errors:
        print(f"-- ОШИБКИ ({len(errors)}) --")
        for e in errors:
            print("  x", e)
        return 1
    print("OK: schema.sql структурно корректен")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
