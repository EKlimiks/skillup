"""Перекачивает изображения для указанных товаров по «полным» слагам и обрабатывает их."""
import os, io, json, sys, urllib.request
from PIL import Image
import numpy as np
from collections import deque

ROOT = r"C:\Users\user1\Desktop\Сайт Eklimiks top\eklimiks"
OUT = os.path.join(ROOT, "public", "img", "products")
RAW = os.path.join(ROOT, "tools", "raw")
os.makedirs(RAW, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15"}
CDN = "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/{}?wid=1500&hei=1500&fmt={}&qlt=95"

# товар -> {цвет: правильный слаг}
REPLACE = {
    "iphone-16-plus": {
        "black": "iphone-16-plus-black-select-202409",
        "pink": "iphone-16-plus-pink-select-202409",
        "teal": "iphone-16-plus-teal-select-202409",
        "ultramarine": "iphone-16-plus-ultramarine-select-202409",
        "white": "iphone-16-plus-white-select-202409",
    },
}


def fetch(slug):
    for fmt, ext in (("png-alpha", "png"), ("jpeg", "jpg")):
        try:
            req = urllib.request.Request(CDN.format(slug, fmt), headers=UA)
            with urllib.request.urlopen(req, timeout=90) as r:
                d = r.read()
            im = Image.open(io.BytesIO(d))
            if len(d) > 4000 and im.width >= 300:
                return im
        except Exception as e:
            err = str(e)[:50]
    print("   не скачать:", slug, err)
    return None


def remove_bg(rgba):
    arr = np.array(rgba)
    h, w = arr.shape[:2]
    a = arr[..., 3]
    rgb = arr[..., :3].astype(np.int16)
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
        seeds_mask = opaque & grown
    else:
        seeds_mask = border & opaque
    seeds = list(zip(*np.where(seeds_mask)))
    if not seeds:
        return rgba
    sample = np.array([arr[y, x, :3] for y, x in seeds[:4000]])
    bgc = np.median(sample, axis=0)
    if bgc.min() < 200:
        return rgba
    for tol in (12, 9, 7):
        near = (np.abs(rgb - bgc).max(axis=2) <= tol) & opaque
        vis = np.zeros((h, w), bool)
        dq = deque(seeds)
        for y, x in seeds:
            vis[y, x] = True
        while dq:
            y, x = dq.popleft()
            for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
                if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not vis[ny, nx]:
                    vis[ny, nx] = True
                    dq.append((ny, nx))
        out = arr.copy()
        out[..., 3] = np.where(vis, 0, arr[..., 3])
        if (out[..., 3] > 20).sum() >= 0.012 * h * w:
            return Image.fromarray(out, "RGBA")
    return rgba


def trim(im, pad=30):
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


man_path = os.path.join(OUT, "_manifest_final.json")
man = json.load(open(man_path, encoding="utf-8"))

for key, colors in REPLACE.items():
    for color, slug in colors.items():
        print(f"  {key} / {color} <- {slug}")
        im = fetch(slug)
        if im is None:
            continue
        img = square(trim(remove_bg(im.convert("RGBA"))), 820)
        fn = f"{key}--{color}.webp"
        img.save(os.path.join(OUT, fn), "WEBP", quality=92, method=6)
        man.setdefault(key, {})[color] = fn
        print(f"    сохранён {fn}  {os.path.getsize(os.path.join(OUT, fn)) // 1024} КБ")

json.dump(man, open(man_path, "w"), indent=1, ensure_ascii=False)
print("готово")
