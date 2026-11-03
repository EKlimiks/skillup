"""
Логотип SkillUp по авторскому рисунку.

Яркая белая ракета, тонкая розово-фиолетовая орбита, четыре полосы
выхлопа под ней и искра сверху. Всё рисуется кодом в долях стороны,
поэтому иконка одинакова на любом размере.
"""

from PIL import Image, ImageDraw, ImageFilter
import math
import os

OUT = r"C:\Users\user1\Desktop\Сайт Eklimiks top\skillup"
S = 4


def lerp(c1, c2, t):
    return tuple(int(round(a + (b - a) * t)) for a, b in zip(c1, c2))


def linear(size, c1, c2, angle_deg=45.0):
    img = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(img)
    rad = math.radians(angle_deg)
    dx, dy = math.cos(rad), math.sin(rad)
    norm = size * (abs(dx) + abs(dy))
    for y in range(size):
        for x in range(size):
            t = min(1.0, max(0.0, (x * dx + y * dy) / norm))
            d.point((x, y), fill=lerp(c1, c2, t))
    return img


def soft(size, center, radius, blur=0.45):
    m = Image.new("L", (size, size), 0)
    cx, cy = center
    ImageDraw.Draw(m).ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=255)
    return m.filter(ImageFilter.GaussianBlur(radius * blur))


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def build(size):
    s = size * S
    u = lambda v: v * s

    # Фон: глубокий сине-фиолетовый, светлее сверху
    bg = linear(s, (20, 10, 55), (82, 30, 160), 58)
    glow = Image.new("RGB", (s, s), (158, 80, 255))
    bg = Image.composite(glow, bg, soft(s, (u(0.52), u(0.40)), u(0.66), 0.55))
    dark = Image.new("RGB", (s, s), (12, 6, 40))
    bg = Image.composite(dark, bg, soft(s, (u(0.0), u(1.0)), u(0.60), 0.60))

    icon = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    icon.paste(bg, (0, 0), rounded_mask(s, int(u(0.235))))

    # ── выхлоп: четыре полосы, верх скрыт ракетой, низ яркий ──
    bars = [(0.440, 0.70, 0.86), (0.480, 0.66, 0.90),
            (0.520, 0.66, 0.90), (0.560, 0.70, 0.86)]
    bw = u(0.042)
    for bx, top, bottom in bars:
        x0 = u(bx)
        y0, y1 = u(top), u(bottom)
        w, h = max(2, int(bw)), max(2, int(y1 - y0))
        grad = Image.new("RGB", (w, h))
        gd = ImageDraw.Draw(grad)
        for i in range(h):
            gd.line([(0, i), (w, i)], fill=lerp((126, 60, 238), (255, 46, 196), i / max(1, h - 1)))
        bm = Image.new("L", (w, h), 0)
        ImageDraw.Draw(bm).rounded_rectangle([0, 0, w - 1, h - 1], radius=w // 2, fill=255)
        icon.paste(grad, (int(x0), int(y0)), bm)

    # ── орбита: тонкий эллипс, розовый слева, фиолетовый справа ──
    cx, cy = u(0.5), u(0.55)
    rw, rh = u(0.64), u(0.20)
    thick = int(u(0.038))
    ring_m = Image.new("L", (s, s), 0)
    ImageDraw.Draw(ring_m).ellipse(
        [cx - rw / 2, cy - rh / 2, cx + rw / 2, cy + rh / 2], outline=255, width=thick)

    # правый конец плавно тает
    fade = Image.new("L", (s, s), 255)
    fd = ImageDraw.Draw(fade)
    for x in range(int(u(0.62)), s):
        t = (x - u(0.62)) / max(1.0, u(0.26))
        fd.line([(x, 0), (x, s)], fill=int(255 * max(0.0, 1.0 - t)))
    ring_m = Image.composite(ring_m, Image.new("L", (s, s), 0), fade)
    ring_m = ring_m.filter(ImageFilter.GaussianBlur(u(0.002)))

    ring = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ring.paste(linear(s, (255, 62, 206), (136, 64, 242), 0), (0, 0), ring_m)
    ring.putalpha(ring_m)
    ring = ring.rotate(-15, resample=Image.BICUBIC, center=(cx, cy))

    icon = Image.alpha_composite(icon, ring)

    # ── ракета: острый нос, узкий корпус, два скошенных крыла ──
    body = [
        (u(0.500), u(0.150)),
        (u(0.668), u(0.398)),
        (u(0.572), u(0.398)),
        (u(0.572), u(0.700)),
        (u(0.500), u(0.620)),
        (u(0.428), u(0.700)),
        (u(0.428), u(0.398)),
        (u(0.332), u(0.398)),
    ]
    fin_r = [(u(0.572), u(0.555)), (u(0.704), u(0.800)), (u(0.572), u(0.720))]
    fin_l = [(u(0.428), u(0.555)), (u(0.296), u(0.800)), (u(0.428), u(0.720))]

    # мягкое белое свечение — ракета отрывается от фона
    halo = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for poly in (body, fin_r, fin_l):
        hd.polygon(poly, fill=(255, 255, 255, 90))
    halo = halo.filter(ImageFilter.GaussianBlur(u(0.020)))
    icon = Image.alpha_composite(icon, halo)

    # тень снизу-справа
    shadow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    off = u(0.008)
    for poly in (body, fin_r, fin_l):
        sd.polygon([(x + off, y + off) for x, y in poly], fill=(28, 8, 68, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(u(0.013)))
    icon = Image.alpha_composite(icon, shadow)

    # ракета — чисто белая
    rocket = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rocket)
    for poly in (body, fin_r, fin_l):
        rd.polygon(poly, fill=(255, 255, 255, 255))
    icon = Image.alpha_composite(icon, rocket)

    # ── передняя часть орбиты: левая половина поверх ракеты ──
    front = ring.copy()
    cut = Image.new("L", (s, s), 0)
    ImageDraw.Draw(cut).rectangle([0, 0, int(cx - u(0.010)), s], fill=255)
    cut = cut.filter(ImageFilter.GaussianBlur(u(0.010)))
    front.putalpha(Image.composite(front.getchannel("A"), Image.new("L", (s, s), 0), cut))
    icon = Image.alpha_composite(icon, front)

    # ── искра справа сверху ──
    sx, sy, sr = u(0.795), u(0.225), u(0.080)
    star = []
    for i in range(8):
        ang = math.radians(i * 45 - 90)
        r = sr if i % 2 == 0 else sr * 0.22
        star.append((sx + r * math.cos(ang), sy + r * math.sin(ang)))
    spark = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(spark).polygon(star, fill=(255, 255, 255, 255))
    spark = spark.filter(ImageFilter.GaussianBlur(u(0.0012)))
    icon = Image.alpha_composite(icon, spark)

    # ── неоновая окантовка ──
    edge = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(edge).rounded_rectangle(
        [u(0.010), u(0.010), s - u(0.010), s - u(0.010)],
        radius=int(u(0.225)), outline=(176, 118, 255, 190), width=max(2, int(u(0.006))))
    edge = edge.filter(ImageFilter.GaussianBlur(u(0.005)))
    icon = Image.alpha_composite(icon, edge)

    return icon.resize((size, size), Image.LANCZOS)


for n in (180, 192, 512):
    build(n).save(os.path.join(OUT, f"icon-{n}.png"))

big = Image.new("RGBA", (512, 512), (28, 14, 74, 255))
inner = build(340)
big.paste(inner, ((512 - 340) // 2, (512 - 340) // 2), inner)
big.save(os.path.join(OUT, "icon-maskable.png"))

print("готово:", sorted(f for f in os.listdir(OUT) if f.startswith("icon")))
