#!/usr/bin/env python3
"""
Статическая проверка PHP-файлов проекта EKlimiks без установленного PHP.

Проверяет:
  1. Баланс фигурных/круглых/квадратных скобок (с учётом строк и комментариев).
  2. Наличие namespace, объявления класса и совпадение имени класса с файлом.
  3. Существование всех классов App\\..., упомянутых в use/типах, внутри проекта.
  4. Существование вызываемых методов контроллеров в маршрутах routes/api.php.
  5. Валидность JSON внутри products.php.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"

if str(ROOT.parent) not in sys.path:
    sys.path.insert(0, str(ROOT.parent))

errors: list[str] = []
warnings: list[str] = []


def php_files() -> list[Path]:
    return sorted(
        [p for p in ROOT.rglob("*.php") if "vendor" not in p.parts and "node_modules" not in p.parts]
    )


def strip_php(src: str) -> str:
    """Удаляет строки, комментарии и содержимое heredoc, сохраняя переводы строк."""
    out: list[str] = []
    i, n = 0, len(src)
    state = "code"  # code | sq | dq | line | block | heredoc
    heredoc_tag = ""
    while i < n:
        ch = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if state == "code":
            if ch == "/" and nxt == "/":
                state = "line"
                out.append("  ")
                i += 2
                continue
            if ch == "#":
                state = "line"
                out.append(" ")
                i += 1
                continue
            if ch == "/" and nxt == "*":
                state = "block"
                out.append("  ")
                i += 2
                continue
            if ch == "'":
                state = "sq"
                out.append(" ")
                i += 1
                continue
            if ch == '"':
                state = "dq"
                out.append(" ")
                i += 1
                continue
            if src.startswith("<<<", i):
                m = re.match(r"<<<\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1", src[i:])
                if m:
                    heredoc_tag = m.group(2)
                    state = "heredoc"
                    i += m.end()
                    continue
            out.append(ch)
            i += 1
            continue
        if state == "line":
            if ch == "\n":
                state = "code"
                out.append("\n")
            else:
                out.append(" ")
            i += 1
            continue
        if state == "block":
            if ch == "*" and nxt == "/":
                state = "code"
                out.append("  ")
                i += 2
                continue
            out.append("\n" if ch == "\n" else " ")
            i += 1
            continue
        if state in ("sq", "dq"):
            quote = "'" if state == "sq" else '"'
            if ch == "\\":
                out.append("  ")
                i += 2
                continue
            if ch == quote:
                state = "code"
                out.append(" ")
                i += 1
                continue
            out.append("\n" if ch == "\n" else " ")
            i += 1
            continue
        if state == "heredoc":
            line_end = src.find("\n", i)
            if line_end == -1:
                line_end = n
            line = src[i:line_end]
            if line.strip() == heredoc_tag:
                state = "code"
                out.append(" " * len(line))
            else:
                out.append(" " * len(line))
            i = line_end
            continue
    return "".join(out)


def check_balance(path: Path, src: str) -> None:
    clean = strip_php(src)
    pairs = {")": "(", "]": "[", "}": "{"}
    stack: list[tuple[str, int]] = []
    line = 1
    for ch in clean:
        if ch == "\n":
            line += 1
        elif ch in "([{":
            stack.append((ch, line))
        elif ch in ")]}":
            if not stack:
                errors.append(f"{path.relative_to(ROOT)}:{line}: лишняя закрывающая скобка '{ch}'")
                return
            opener, opened_at = stack.pop()
            if opener != pairs[ch]:
                errors.append(
                    f"{path.relative_to(ROOT)}:{line}: '{ch}' закрывает '{opener}', открытую в строке {opened_at}"
                )
                return
    if stack:
        opener, opened_at = stack[-1]
        errors.append(f"{path.relative_to(ROOT)}: не закрыта скобка '{opener}' (строка {opened_at})")


def check_class_name(path: Path, src: str) -> None:
    if path.name in ("artisan",):
        return
    clean = strip_php(src)
    ns = re.search(r"^\s*namespace\s+([A-Za-z0-9_\\]+)\s*;", clean, re.M)
    cls = re.search(r"^\s*(?:final\s+|abstract\s+)?class\s+([A-Za-z0-9_]+)", clean, re.M)
    itf = re.search(r"^\s*interface\s+([A-Za-z0-9_]+)", clean, re.M)
    trt = re.search(r"^\s*trait\s+([A-Za-z0-9_]+)", clean, re.M)
    found = cls or itf or trt
    if not found:
        return
    name = found.group(1)
    if name != path.stem:
        if name.endswith("_"):  # анонимный класс: return new class extends Migration
            return
        errors.append(f"{path.relative_to(ROOT)}: класс {name} не совпадает с именем файла {path.stem}")
    expected_ns = "App\\" + "\\".join(path.relative_to(APP).parts[:-1]) if APP in path.parents else ""
    if expected_ns and ns and ns.group(1) != expected_ns:
        warnings.append(
            f"{path.relative_to(ROOT)}: namespace {ns.group(1)} не совпадает с путём (ожидалось {expected_ns})"
        )
    if expected_ns and not ns:
        errors.append(f"{path.relative_to(ROOT)}: отсутствует объявление namespace")


def check_app_classes() -> set[str]:
    """Собирает FQCN всех классов проекта."""
    known: set[str] = set()
    for path in APP.rglob("*.php"):
        src = strip_php(path.read_text(encoding="utf-8"))
        ns = re.search(r"^\s*namespace\s+([A-Za-z0-9_\\]+)\s*;", src, re.M)
        cls = re.search(r"^\s*(?:final\s+|abstract\s+)?class\s+([A-Za-z0-9_]+)", src, re.M)
        if ns and cls:
            known.add(f"{ns.group(1)}\\{cls.group(1)}")
    return known


def check_use_statements(known: set[str]) -> None:
    for path in php_files():
        src = strip_php(path.read_text(encoding="utf-8"))
        for m in re.finditer(r"^\s*use\s+(App\\[A-Za-z0-9_\\]+)\s*(?:;|as\s)", src, re.M):
            fqcn = m.group(1)
            if fqcn.endswith("\\") or fqcn in known:
                continue
            # Может быть use function / use const или вложенный класс
            if fqcn not in known:
                errors.append(f"{path.relative_to(ROOT)}: use {fqcn} — класс не найден в app/")
        # Полные ссылки внутри кода
        for m in re.finditer(r"\\?(App\\[A-Za-z0-9_\\]+)::class", src):
            fqcn = m.group(1)
            if fqcn not in known:
                errors.append(f"{path.relative_to(ROOT)}: {fqcn}::class — класс не найден в app/")


def controller_methods() -> dict[str, set[str]]:
    methods: dict[str, set[str]] = {}
    for path in (APP / "Http" / "Controllers").rglob("*.php"):
        src = strip_php(path.read_text(encoding="utf-8"))
        ns = re.search(r"^\s*namespace\s+([A-Za-z0-9_\\]+)\s*;", src, re.M)
        cls = re.search(r"^\s*(?:final\s+|abstract\s+)?class\s+([A-Za-z0-9_]+)", src, re.M)
        found = set(re.findall(r"^\s*public\s+function\s+([A-Za-z0-9_]+)\s*\(", src, re.M))
        found |= set(re.findall(r"^\s*public\s+static\s+function\s+([A-Za-z0-9_]+)\s*\(", src, re.M))
        if ns and cls:
            methods[f"{ns.group(1)}\\{cls.group(1)}"] = found
    return methods


def check_routes() -> None:
    route_file = ROOT / "routes" / "api.php"
    if not route_file.exists():
        return
    src = strip_php(route_file.read_text(encoding="utf-8"))
    aliases: dict[str, str] = {}
    for m in re.finditer(r"^use\s+(App\\Http\\Controllers\\Api\\[A-Za-z0-9_\\]+)\s+as\s+([A-Za-z0-9_]+)\s*;", src, re.M):
        aliases[m.group(2)] = m.group(1)
    for m in re.finditer(r"^use\s+(App\\Http\\Controllers\\Api\\[A-Za-z0-9_\\]+)\s*;", src, re.M):
        fqcn = m.group(1)
        aliases[fqcn.split("\\")[-1]] = fqcn

    methods = controller_methods()

    # [Controller::class, 'method']
    for m in re.finditer(r"\[\s*([A-Za-z0-9_]+)::class\s*,\s*'([A-Za-z0-9_]+)'\s*\]", src):
        cls_alias, method = m.group(1), m.group(2)
        fqcn = aliases.get(cls_alias)
        if fqcn is None:
            errors.append(f"routes/api.php: контроллер {cls_alias} не импортирован")
            continue
        if fqcn not in methods:
            errors.append(f"routes/api.php: класс {fqcn} не найден среди контроллеров")
            continue
        if method not in methods[fqcn]:
            errors.append(f"routes/api.php: метод {fqcn}::{method}() не существует")

    # apiResource: проверяем наличие обязательных методов
    resource_map: dict[str, list[str]] = {}
    for m in re.finditer(r"Route::apiResource\(\s*'([^']+)'\s*,\s*([A-Za-z0-9_]+)::class", src):
        resource_map.setdefault(m.group(2), []).append(m.group(1))
    required = {"index", "store", "show", "update", "destroy"}
    for cls_alias in resource_map:
        fqcn = aliases.get(cls_alias)
        if fqcn is None or fqcn not in methods:
            continue
        missing = required - methods[fqcn]
        # Допустимо ограничивать набор через ->only([...])
        if missing:
            warnings.append(
                f"routes/api.php: apiResource для {fqcn} — нет методов {sorted(missing)} "
                f"(проверьте ->only(...) при регистрации: {resource_map[cls_alias]})"
            )


def check_products_json() -> None:
    """Разбор каталога без PHP: вытаскиваем slug/category/price простым парсером."""
    path = ROOT / "database" / "data" / "products.php"
    if not path.exists():
        return

    text = path.read_text(encoding="utf-8")
    body = text[text.index("return [") :]

    blocks = re.split(r"\n    \[", body)[1:]
    products: list[dict[str, object]] = []

    for block in blocks:
        slug = re.search(r"'slug'\s*=>\s*'([^']+)'", block)
        category = re.search(r"'category'\s*=>\s*'([^']+)'", block)
        name = re.search(r"'name'\s*=>\s*'([^']+)'", block)
        price = re.search(r"'price'\s*=>\s*([0-9]+)", block)
        old_price = re.search(r"'old_price'\s*=>\s*(null|[0-9]+)", block)
        stock = re.search(r"'stock'\s*=>\s*([0-9]+)", block)
        colors = re.findall(
            r"\['id'\s*=>\s*'([^']+)',\s*'name'\s*=>\s*'([^']+)',\s*'hex'\s*=>\s*'(#[0-9a-fA-F]{3,8})'\]",
            block,
        )
        specs = re.findall(r"\['key'\s*=>\s*'([^']+)',\s*'value'\s*=>\s*'([^']*)'\]", block)
        images = re.findall(r"'images'\s*=>\s*\[([^\]]*)\]", block)

        if not slug:
            errors.append("database/data/products.php: найден блок товара без slug")
            continue

        item = {
            "slug": slug.group(1),
            "category": category.group(1) if category else None,
            "name": name.group(1) if name else None,
            "price": int(price.group(1)) if price else None,
            "old_price": old_price.group(1) if old_price else None,
            "stock": int(stock.group(1)) if stock else None,
            "colors": colors,
            "specs": specs,
            # images генерирует ProductSeeder, если ключа нет в данных
            "images": images[0] if images else " ".join(f"img/products/{slug.group(1)}--{c[0]}.webp" for c in colors),
        }
        products.append(item)

    slugs = [str(p["slug"]) for p in products]
    dups = {s for s in slugs if slugs.count(s) > 1}
    if dups:
        errors.append(f"database/data/products.php: дубли slug: {sorted(dups)}")
    if len(products) < 30:
        errors.append(f"database/data/products.php: товаров {len(products)}, требуется минимум 30")

    categories = {str(p["category"]) for p in products}
    print(f"  товаров: {len(products)}, slug уникальны: {not dups}, категорий: {len(categories)}")
    if len(categories) < 8:
        errors.append(f"database/data/products.php: задействовано категорий {len(categories)}, ожидается 8")

    for p in products:
        slug = p["slug"]
        if not p["name"]:
            errors.append(f"{slug}: не задано название")
        if p["price"] is None or int(p["price"]) <= 0:
            errors.append(f"{slug}: некорректная цена")
        if not p["colors"]:
            errors.append(f"{slug}: не заданы цвета")
        if len(p["specs"]) < 3:
            errors.append(f"{slug}: specs короче 3 пар ключ/значение")
        if p["stock"] is None or int(p["stock"]) < 0:
            errors.append(f"{slug}: некорректный stock")
        if p["old_price"] not in (None, "null") and int(str(p["old_price"])) <= int(str(p["price"])):
            warnings.append(f"{slug}: old_price ({p['old_price']}) <= price ({p['price']})")
        if 'img/products/' not in str(p["images"]):
            warnings.append(f"{slug}: images не совпадают с шаблоном img/products/<slug>--<цвет>.webp")


def main() -> int:
    files = php_files()
    print(f"Проверяю файлов: {len(files)}")
    for path in files:
        src = path.read_text(encoding="utf-8")
        if not src.strip():
            errors.append(f"{path.relative_to(ROOT)}: пустой файл")
            continue
        check_balance(path, src)
        check_class_name(path, src)

    print("Проверяю use-инструкции App\\...")
    check_use_statements(check_app_classes())

    print("Проверяю маршруты")
    check_routes()

    print("Проверяю каталог товаров")
    check_products_json()

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
    print("OK: структурных ошибок не найдено")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
