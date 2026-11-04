"""
QR-код SkillUp: ведёт на приложение https://full-emerald.vps.ktk-45.ru/skillup/

Делаем две версии:
  qr.png        — с логотипом в центре (красиво, для страницы)
  qr-plain.png  — без логотипа (максимально надёжно сканируется)

Коррекция ошибок максимальная (H, 30 %), чтобы логотип в центре и
неточная печать не мешали считыванию. Тихая зона — по стандарту.
"""

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image
import os

OUT = r"C:\Users\user1\Desktop\Сайт Eklimiks top\skillup"
URL = "https://full-emerald.vps.ktk-45.ru/skillup/"
INK = (20, 8, 43)          # тёмно-фиолетовый, почти чёрный — сканеры любят контраст
PAPER = (255, 255, 255)

qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=16, border=4)
qr.add_data(URL)
qr.make(fit=True)
matrix = qr.get_matrix()

# ── без логотипа ──
plain = qr.make_image(fill_color=INK, back_color=PAPER).convert("RGB")
plain.save(os.path.join(OUT, "qr-plain.png"))

# ── с логотипом в центре ──
img = qr.make_image(fill_color=INK, back_color=PAPER).convert("RGBA")
size = img.size[0]
logo_side = int(size * 0.20)          # 20 % стороны — безопасно для коррекции H

logo = Image.open(os.path.join(OUT, "icon-512.png")).resize(
    (logo_side, logo_side), Image.LANCZOS)

# белая подложка с отступом, чтобы логотип не сливался с модулями
pad = int(size * 0.022)
box = Image.new("RGBA", (logo_side + pad * 2, logo_side + pad * 2), (255, 255, 255, 255))
box.paste(logo, (pad, pad), logo)
img.paste(box, ((size - box.size[0]) // 2, (size - box.size[1]) // 2), box)
img.save(os.path.join(OUT, "qr.png"))

print("готово:", os.path.getsize(os.path.join(OUT, "qr.png")) // 1024, "КБ и",
      os.path.getsize(os.path.join(OUT, "qr-plain.png")) // 1024, "КБ")
print("модулей:", len(matrix), "x", len(matrix[0]))
