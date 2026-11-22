"""Development tool: rasterize recorded Canvas painter commands into the dossier JPEGs.

The commands come from the game's own render.js via tools/shotgen.mjs, so these images
show exactly the shapes, text and layout the browser draws.
"""
import json
import math
import os
import re
import sys
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFont

W, H = 1120, 640
FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
COLOR_RE = re.compile(r"rgba?\(([^)]*)\)", re.I)


def parse_color(value, alpha=1.0):
    if value is None:
        return None
    if isinstance(value, (tuple, list)):
        rgba = [int(round(v)) for v in value[:4]]
        return tuple(rgba) if len(rgba) == 4 else (*rgba, 255)
    text = str(value).strip()
    if text.startswith("#"):
        raw = text[1:]
        if len(raw) == 3:
            rgb = [int(c * 2, 16) for c in raw]
        elif len(raw) >= 6:
            rgb = [int(raw[i:i + 2], 16) for i in (0, 2, 4)]
        else:
            return (255, 255, 255, int(255 * alpha))
        a = int(raw[6:8], 16) if len(raw) >= 8 else 255
        return (*rgb, max(0, min(255, int(a * alpha))))
    match = COLOR_RE.match(text)
    if match:
        parts = [p.strip() for p in match.group(1).replace("%", "").split(",")]
        nums = [float(p) for p in parts[:4]]
        rgba = [int(round(n)) for n in nums[:3]]
        a = nums[3] if len(nums) > 3 else 1.0
        return (*rgba, max(0, min(255, int(round(a * 255 * alpha)))))
    return (255, 255, 255, int(255 * alpha))


def with_alpha(color, alpha):
    if color is None:
        return None
    rgba = parse_color(color)
    return (rgba[0], rgba[1], rgba[2], max(0, min(255, int(rgba[3] * alpha))))


@lru_cache(maxsize=64)
def font_for(size, family, weight):
    if family == "sans":
        name = "DejaVuSans-Bold.ttf" if weight >= 600 else "DejaVuSans.ttf"
    else:
        name = "DejaVuSansMono-Bold.ttf" if weight >= 600 else "DejaVuSansMono.ttf"
    return ImageFont.truetype(FONT_DIR + name, int(size))


def clamp_box(box):
    x0 = max(0, int(math.floor(box[0])))
    y0 = max(0, int(math.floor(box[1])))
    x1 = min(W, int(math.ceil(box[2])))
    y1 = min(H, int(math.ceil(box[3])))
    if x1 <= x0 or y1 <= y0:
        return None
    return x0, y0, x1, y1


def layer_composite(base, box, paint):
    box = clamp_box(box)
    if box is None:
        return
    x0, y0, x1, y1 = box
    layer = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    paint(draw, x0, y0)
    base.alpha_composite(layer, (x0, y0))


def dashed_line(draw, x1, y1, x2, y2, fill, width, pattern):
    length = math.hypot(x2 - x1, y2 - y1)
    if length < 0.001:
        return
    ux, uy = (x2 - x1) / length, (y2 - y1) / length
    on, off = pattern
    pos = 0.0
    drawing = True
    while pos < length:
        step = min(on if drawing else off, length - pos)
        if drawing:
            draw.line((x1 + ux * pos, y1 + uy * pos, x1 + ux * (pos + step), y1 + uy * (pos + step)), fill=fill, width=width)
        pos += step
        drawing = not drawing


def dashed_poly(draw, points, fill, width, pattern):
    for i in range(1, len(points)):
        dashed_line(draw, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], fill, width, pattern)
    dashed_line(draw, points[-1][0], points[-1][1], points[0][0], points[0][1], fill, width, pattern)


def dashed_ring(draw, cx, cy, radius, fill, width, pattern):
    circumference = 2 * math.pi * max(1.0, radius)
    on, off = pattern
    scale = circumference / max(1.0, on + off)
    on = max(1.0, on * scale / 32)
    off = max(1.0, off * scale / 32)
    pos = 0.0
    drawing = True
    while pos < 360:
        step = min((on if drawing else off) * 360 / max(1.0, circumference), 360 - pos)
        a1, a2 = math.radians(pos), math.radians(pos + step)
        if drawing:
            draw.line((cx + math.cos(a1) * radius, cy + math.sin(a1) * radius,
                       cx + math.cos(a2) * radius, cy + math.sin(a2) * radius), fill=fill, width=width)
        pos += step
        drawing = not drawing


def gradient_image(w, h, stops, vertical):
    n = max(1, h if vertical else w)
    strip = Image.new("RGBA", (1, n), (0, 0, 0, 0))
    parsed = []
    for at, color in stops:
        parsed.append((float(at), parse_color(color)))
    for i in range(n):
        t = i / max(1, n - 1)
        lo = parsed[0]
        hi = parsed[-1]
        for a, b in zip(parsed, parsed[1:]):
            if a[0] <= t <= b[0]:
                lo, hi = a, b
                break
        span = max(1e-6, hi[0] - lo[0])
        k = max(0.0, min(1.0, (t - lo[0]) / span))
        px = tuple(int(round(lo[1][j] + (hi[1][j] - lo[1][j]) * k)) for j in range(4))
        strip.putpixel((0, i), px)
    return strip.resize((max(1, w), max(1, h)), Image.Resampling.BILINEAR)


def text_width(font, text, spacing):
    widths = [font.getlength(ch) for ch in text]
    return sum(widths) + spacing * max(0, len(text) - 1)


def draw_text_op(draw, ox, oy, args):
    x, y, content, size, color = args[:5]
    opts = args[5] if len(args) > 5 and isinstance(args[5], dict) else {}
    size = max(1, int(size))
    font = font_for(size, opts.get("font", "mono"), opts.get("weight", 400))
    fill = with_alpha(color, opts.get("alpha", 1))
    align = opts.get("align", "left")
    spacing = float(opts.get("letterSpacing", 0) or 0)
    if spacing:
        widths = [font.getlength(ch) for ch in str(content)]
        cursor = x - (text_width(font, str(content), spacing) / 2 if align == "center"
                      else text_width(font, str(content), spacing) if align == "right" else 0)
        for ch, cw in zip(str(content), widths):
            draw.text((cursor - ox, y - oy), ch, font=font, fill=fill, anchor="lm")
            cursor += cw + spacing
    else:
        anchor = {"center": "mm", "right": "rm"}.get(align, "lm")
        draw.text((x - ox, y - oy), str(content), font=font, fill=fill, anchor=anchor)


def bbox_for(op, args):
    if op == "clear":
        return (0, 0, W, H)
    if op == "rect":
        x, y, w, h = args[:4]
        opts = args[5] if len(args) > 5 and isinstance(args[5], dict) else {}
        pad = 3 + (opts.get("lw", 1) or 1)
        return (x - pad, y - pad, x + w + pad, y + h + pad)
    if op == "circle":
        x, y, r = args[:3]
        pad = 4
        return (x - r - pad, y - r - pad, x + r + pad, y + r + pad)
    if op == "ellipse":
        x, y, rx, ry = args[:4]
        return (x - rx - 4, y - ry - 4, x + rx + 4, y + ry + 4)
    if op == "poly":
        pts = args[0]
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        return (min(xs) - 4, min(ys) - 4, max(xs) + 4, max(ys) + 4)
    if op == "line":
        x1, y1, x2, y2 = args[:4]
        width = args[6] if len(args) > 6 and isinstance(args[6], dict) else {}
        pad = 4
        return (min(x1, x2) - pad, min(y1, y2) - pad, max(x1, x2) + pad, max(y1, y2) + pad)
    if op == "ring":
        x, y, r = args[:3]
        return (x - r - 5, y - r - 5, x + r + 5, y + r + 5)
    if op == "glow":
        x, y, r = args[:3]
        return (x - r - 2, y - r - 2, x + r + 2, y + r + 2)
    if op == "gradientRect":
        x, y, w, h = args[:4]
        return (x - 2, y - 2, x + w + 2, y + h + 2)
    if op == "text":
        x, y, content, size = args[:4]
        opts = args[5] if len(args) > 5 and isinstance(args[5], dict) else {}
        font = font_for(int(size), opts.get("font", "mono"), opts.get("weight", 400))
        width = text_width(font, str(content), float(opts.get("letterSpacing", 0) or 0)) + 16
        align = opts.get("align", "left")
        left = x - width / 2 if align == "center" else x - width if align == "right" else x - 8
        return (left - 4, y - size * 1.2, left + width + 8, y + size * 1.2)
    return (0, 0, W, H)


def render(commands):
    base = Image.new("RGBA", (W, H), (5, 9, 18, 255))
    for cmd in commands:
        op, args = cmd["op"], cmd["args"]
        if op == "clear":
            base.paste(parse_color(args[0]), (0, 0, W, H))
            continue

        box = bbox_for(op, args)

        if op == "gradientRect":
            x, y, w, h, stops = args[:5]
            vertical = args[5] if len(args) > 5 else True
            grad = gradient_image(max(1, int(w)), max(1, int(h)), stops, vertical)
            crop = clamp_box((x, y, x + w, y + h))
            if crop:
                x0, y0, x1, y1 = crop
                sub = grad.crop((x0 - x, y0 - y, x1 - x, y1 - y))
                base.alpha_composite(sub, (x0, y0))
            continue

        if op == "glow":
            x, y, r, color = args[:4]
            alpha = args[4] if len(args) > 4 else 0.4
            core = parse_color(color, 1.0)

            def paint(d, ox, oy):
                steps = 22
                for i in range(steps):
                    t = i / (steps - 1)
                    rr = max(1.0, r * (1 - t))
                    a = int(core[3] * alpha * (1 - t) ** 2)
                    if a <= 0:
                        continue
                    d.ellipse((x - rr - ox, y - rr - oy, x + rr - ox, y + rr - oy), fill=(core[0], core[1], core[2], a))
            layer_composite(base, box, paint)
            continue

        if op == "text":
            layer_composite(base, box, lambda d, ox, oy: draw_text_op(d, ox, oy, args))
            continue

        opts = args[-1] if isinstance(args[-1], dict) else {}
        alpha = opts.get("alpha", 1)
        if op == "poly":
            raw_fill = args[1]
        elif op in ("rect", "ellipse", "line"):
            raw_fill = args[4]
        elif op == "circle":
            raw_fill = args[3]
        else:
            raw_fill = None
        fill = with_alpha(raw_fill, alpha)
        stroke = with_alpha(opts.get("stroke"), alpha)
        lw = max(1, int(opts.get("lw", 1) or 1))
        dash = opts.get("dash")

        if op == "rect":
            x, y, w, h = args[:4]
            radius = min(opts.get("r", 0) or 0, w / 2, h / 2)

            def paint(d, ox, oy):
                bounds = (x - ox, y - oy, x + w - ox, y + h - oy)
                if radius > 0:
                    d.rounded_rectangle(bounds, radius=radius, fill=fill, outline=stroke, width=lw if stroke else 1)
                else:
                    d.rectangle(bounds, fill=fill, outline=stroke, width=lw if stroke else 1)
            layer_composite(base, box, paint)

        elif op == "circle":
            x, y, r = args[:3]

            def paint(d, ox, oy):
                d.ellipse((x - r - ox, y - r - oy, x + r - ox, y + r - oy), fill=fill, outline=stroke, width=lw if stroke else 1)
            layer_composite(base, box, paint)

        elif op == "ellipse":
            x, y, rx, ry = args[:4]

            def paint(d, ox, oy):
                d.ellipse((x - rx - ox, y - ry - oy, x + rx - ox, y + ry - oy), fill=fill, outline=stroke, width=lw if stroke else 1)
            layer_composite(base, box, paint)

        elif op == "poly":
            pts = args[0]

            def paint(d, ox, oy):
                shifted = [(p[0] - ox, p[1] - oy) for p in pts]
                d.polygon(shifted, fill=fill)
                if stroke:
                    if dash:
                        dashed_poly(d, shifted, stroke, lw, dash)
                    else:
                        d.line(shifted + [shifted[0]], fill=stroke, width=lw, joint="curve")
            layer_composite(base, box, paint)

        elif op == "line":
            x1, y1, x2, y2, color, width = args[:6]
            line_fill = with_alpha(color, alpha)
            line_opts = args[6] if len(args) > 6 and isinstance(args[6], dict) else {}

            def paint(d, ox, oy):
                coords = (x1 - ox, y1 - oy, x2 - ox, y2 - oy)
                if line_opts.get("dash"):
                    dashed_line(d, *coords, line_fill, max(1, int(width)), line_opts["dash"])
                else:
                    d.line(coords, fill=line_fill, width=max(1, int(width)))
            layer_composite(base, box, paint)

        elif op == "ring":
            x, y, r, color, width = args[:5]
            ring_fill = with_alpha(color, alpha)
            ring_opts = args[5] if len(args) > 5 and isinstance(args[5], dict) else {}
            start = ring_opts.get("from", 0)
            end = ring_opts.get("to", math.tau)

            def paint(d, ox, oy):
                bounds = (x - r - ox, y - r - oy, x + r - ox, y + r - oy)
                if ring_opts.get("dash"):
                    dashed_ring(d, x - ox, y - oy, max(1.0, r), ring_fill, max(1, int(width)), ring_opts["dash"])
                else:
                    d.arc(bounds, math.degrees(start), math.degrees(end), fill=ring_fill, width=max(1, int(width)))
            layer_composite(base, box, paint)
    return base.convert("RGB")


def main():
    names = ["start", "play", "loot", "end"]
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "screenshots"
    os.makedirs(out_dir, exist_ok=True)
    for index, name in enumerate(names, start=1):
        path = f"/tmp/opencode/midnight-{name}.json"
        with open(path, encoding="utf-8") as handle:
            commands = json.load(handle)
        image = render(commands)
        target = os.path.join(out_dir, f"{index}-{name}.jpg")
        image.save(target, quality=91, subsampling=0, optimize=True)
        print(f"{target}: {os.path.getsize(target)} bytes")


if __name__ == "__main__":
    main()
