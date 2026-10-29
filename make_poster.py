#!/usr/bin/env python3
"""生成分享海报（改这里的文字即可重新排版）。

用法： python3 make_poster.py
输出： poster-momoqi.png（与 pet/ 同级的上一级目录，即默认工作区根目录）
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask

# ---------------- 可改的文案 ----------------
URL      = "https://time988.github.io/momoqi/"
TITLE    = "屈佳佳专用摸摸器"
SUBTITLE = "手指划过它的头顶，它会脸红、打呼噜、冒心心"
QUOTE    = "又想我了嘛，佳佳"
# -------------------------------------------

W, H = 1080, 1560
BG1, BG2 = (255, 247, 238), (255, 232, 220)
INK, INK2, PINK = (109, 74, 63), (163, 128, 111), (196, 96, 112)
F = lambda s: ImageFont.truetype("/System/Library/Fonts/Hiragino Sans GB.ttc", s, index=0)

bg = Image.new("RGB", (W, H))
d = ImageDraw.Draw(bg)
for y in range(H):
    t = y / (H - 1)
    d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(BG1, BG2)))
bg = bg.convert("RGBA")

m = Image.new("L", (W, H), 0)
ImageDraw.Draw(m).rounded_rectangle([60, 60, W - 60, H - 60], radius=52, fill=255)
m = m.filter(ImageFilter.GaussianBlur(22))
sh = Image.new("RGBA", (W, H), (150, 100, 90, 0))
sh.putalpha(m.point(lambda a: int(a * 0.26)))
bg = Image.alpha_composite(bg, sh)

card = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(card).rounded_rectangle([60, 60, W - 60, H - 60], radius=52, fill=(255, 255, 255, 255))
bg = Image.alpha_composite(bg, card)

S = 460
pet = Image.open("pet/assets/pet.jpg").convert("RGB").crop((130, 30, 950, 850)).resize((S, S), Image.LANCZOS)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).ellipse([0, 0, S - 1, S - 1], fill=255)
bg.paste(pet, (310, 140), mask)
ring = Image.new("RGBA", (S + 44, S + 44), (0, 0, 0, 0))
ImageDraw.Draw(ring).ellipse([3, 3, S + 40, S + 40], outline=(255, 216, 216, 255), width=7)
bg.alpha_composite(ring, (310 - 22, 140 - 22))

dr = ImageDraw.Draw(bg)
f1 = F(66)
dr.text(((W - dr.textlength(TITLE, font=f1)) / 2, 646), TITLE, font=f1, fill=PINK)
f2 = F(31)
dr.text(((W - dr.textlength(SUBTITLE, font=f2)) / 2, 736), SUBTITLE, font=f2, fill=INK2)

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=13, border=2)
qr.add_data(URL)
qr.make(fit=True)
qim = qr.make_image(image_factory=StyledPilImage, module_drawer=RoundedModuleDrawer(),
                    color_mask=SolidFillColorMask(back_color=(255, 255, 255), front_color=INK)
                    ).convert("RGB").resize((380, 380), Image.LANCZOS)
dr.rounded_rectangle([300, 826, 780, 1306], radius=34, fill=(255, 252, 248), outline=(246, 228, 216), width=3)
bg.paste(qim, (350, 876))

f3 = F(40)
dr.text(((W - dr.textlength(QUOTE, font=f3)) / 2, 1372), QUOTE, font=f3, fill=PINK)

bg.convert("RGB").save("poster-momoqi.png", optimize=True)
print("saved poster-momoqi.png")
