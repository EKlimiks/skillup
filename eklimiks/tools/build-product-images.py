"""
Готовит фотографии товаров: снимает фон у официальных изображений Apple
и сохраняет их в public/img/products как WebP с прозрачностью.

Запуск из папки eklimiks:
    python tools/build-product-images.py

Исходники (1400×1400 PNG/JPEG с CDN Apple) скрипт скачивает сам
в tools/raw/ — повторные запуски берут их из кэша.
Список моделей и цветов — в tools/image-slugs.py.
"""
import os, json
from PIL import Image
import numpy as np
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(ROOT, "public", "img", "products")
RAW = os.path.join(HERE, "raw")
os.makedirs(RAW, exist_ok=True)
exec(open(os.path.join(HERE, "image-slugs.py"), encoding="utf-8").read())
MANIFEST = json.load(open(os.path.join(OUT, "_manifest_final.json"), encoding="utf-8"))

import urllib.request, concurrent.futures
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15"}
CDN = "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/{}?wid=1500&hei=1500&fmt={}&qlt=95"


def fetch(key, color):
    """Скачивает исходник с CDN Apple, если его ещё нет в кэше."""
    slug = S.get(key, {}).get(color)
    if not slug:
        return None, "нет slug"
    for fmt in ("png-alpha", "jpeg"):
        for _ in range(2):
            try:
                req = urllib.request.Request(CDN.format(slug, fmt), headers=UA)
                with urllib.request.urlopen(req, timeout=80) as r:
                    d = r.read()
                if len(d) < 4000:
                    continue
                ext = "png" if fmt == "png-alpha" else "jpg"
                p = os.path.join(RAW, f"{key}--{color}.{ext}")
                open(p, "wb").write(d)
                return p, None
            except Exception as e:
                err = str(e)[:60]
    return None, err


def find_raw(key, color):
    """Возвращает (путь, расширение) исходника, скачивая его при необходимости."""
    for ext in ("png", "jpg"):
        p = os.path.join(RAW, f"{key}--{color}.{ext}")
        if os.path.exists(p) and os.path.getsize(p) > 3000:
            return p, ext
    p, err = fetch(key, color)
    if not p:
        return None, None
    return p, ("png" if p.endswith(".png") else "jpg")


def flood(near, seeds):
    h, w = near.shape
    vis = np.zeros((h, w), bool)
    dq = deque()
    for y, x in seeds:
        if near[y, x] and not vis[y, x]:
            vis[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        if y > 0 and near[y - 1, x] and not vis[y - 1, x]:
            vis[y - 1, x] = True; dq.append((y - 1, x))
        if y < h - 1 and near[y + 1, x] and not vis[y + 1, x]:
            vis[y + 1, x] = True; dq.append((y + 1, x))
        if x > 0 and near[y, x - 1] and not vis[y, x - 1]:
            vis[y, x - 1] = True; dq.append((y, x - 1))
        if x < w - 1 and near[y, x + 1] and not vis[y, x + 1]:
            vis[y, x + 1] = True; dq.append((y, x + 1))
    return vis


def remove_bg(rgba):
    arr = np.array(rgba)
    h, w = arr.shape[:2]
    a = arr[..., 3]
    rgb = arr[..., :3].astype(np.int16)

    # 1) затравочные точки: прозрачные пиксели рамки + непрозрачные, граничащие с прозрачностью
    trans = a <= 40
    border = np.zeros((h, w), bool)
    border[0, :] = border[-1, :] = True
    border[:, 0] = border[:, -1] = True
    opaque = a > 120

    if trans.any():
        grown = trans.copy()
        for _ in range(3):
            g = grown.copy()
            g[1:, :] |= grown[:-1, :]; g[:-1, :] |= grown[1:, :]
            g[:, 1:] |= grown[:, :-1]; g[:, :-1] |= grown[:, 1:]
            grown = g
        edge = opaque & grown
        seeds_mask = edge
    else:
        seeds_mask = border & opaque

    seeds = list(zip(*np.where(seeds_mask)))
    if not seeds:
        return rgba, "no-seeds"
    sample = np.array([arr[y, x, :3] for y, x in seeds[:4000]])
    bgc = np.median(sample, axis=0)
    if bgc.min() < 200:
        return rgba, "no-light-bg"

    for tol in (12, 9, 7):
        near = (np.abs(rgb - bgc).max(axis=2) <= tol) & opaque
        vis = flood(near, seeds)
        out = arr.copy()
        out[..., 3] = np.where(vis, 0, arr[..., 3])
        if (out[..., 3] > 20).sum() >= 0.012 * h * w:
            return Image.fromarray(out, "RGBA"), f"cut(tol={tol})"
    return rgba, "reverted"


def trim(im, pad=30):
    """Обрезает по содержимому и оставляет поля ~7% — чтобы круглые
    предметы (AirTag, HomePod) не упирались в край кадра."""
    bb = im.getchannel("A").point(lambda a: 255 if a > 18 else 0).getbbox()
    if not bb:
        return im
    x0, y0, x1, y1 = bb
    pad = max(pad, int(0.07 * max(x1 - x0, y1 - y0)))
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def square(im, size=820):
    s = max(im.width, im.height)
    c = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    c.alpha_composite(im, ((s - im.width) // 2, (s - im.height) // 2))
    return c.resize((size, size), Image.LANCZOS)


rows = []
for key, colors in MANIFEST.items():
    for color in list(colors.keys()):
        p, ext = find_raw(key, color)
        if not p:
            continue
        im = Image.open(p)
        rgba, how = remove_bg(im.convert("RGBA"))
        im2 = square(trim(rgba), 820)
        fn = f"{key}--{color}.webp"
        im2.save(os.path.join(OUT, fn), "WEBP", quality=90, method=6)
        colors[color] = fn
        al = np.array(im2)[..., 3]
        rows.append((f"{key}--{color}", how, (al > 20).mean()))

json.dump(MANIFEST, open(os.path.join(OUT, "_manifest_final.json"), "w"), indent=1)
for n, how, fill in rows:
    if how != "cut(tol=12)":
        print(f"  {n:34s} {how:14s} fill={fill:5.1%}")
print(f"\nвсего: {len(rows)} изображений")
