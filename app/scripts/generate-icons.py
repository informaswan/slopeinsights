#!/usr/bin/env python3
"""Builds every icon file from assets/logo-source.png (the rounded-square SlopeInsights logo).
Run: python3 scripts/generate-icons.py"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = Image.open(os.path.join(ROOT, 'assets', 'logo-source.png')).convert('RGB')
N = SRC.size[0]

def corner_mask():
    """White where the source is its black, rounded-off corners."""
    m = Image.new('L', (N, N), 0)
    px = SRC.load()
    dark = Image.new('L', (N, N), 0)
    dp = dark.load()
    for y in range(N):
        for x in range(N):
            if sum(px[x, y]) < 24: dp[x, y] = 255
    for pt in ((0, 0), (N - 1, 0), (0, N - 1), (N - 1, N - 1)):
        ImageDraw.floodfill(dark, pt, 128, thresh=0)
    return dark.point(lambda v: 255 if v == 128 else 0)

CORNERS = corner_mask()

def full_bleed():
    """Square with the corners filled in by the nearest background colour (iOS and Android round it themselves)."""
    img = SRC.copy()
    px, mp = img.load(), CORNERS.load()
    for y in range(N):
        for x in range(N):
            if mp[x, y]:
                step = 1 if x < N / 2 else -1
                xx = x
                while 0 <= xx < N and mp[xx, y]: xx += step
                px[x, y] = px[min(max(xx + step * 4, 0), N - 1), y]
    return img

def rounded():
    """The logo with transparent corners, for the browser tab and sidebar."""
    img = SRC.convert('RGBA')
    alpha = ImageChops.invert(CORNERS).filter(ImageFilter.GaussianBlur(1.2))
    img.putalpha(alpha)
    return img

def size(img, s): return img.resize((s, s), Image.LANCZOS)

def save(img, *parts):
    path = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)

FULL, ROUND = full_bleed(), rounded()

save(size(FULL, 1024), 'assets', 'icon.png')
# Android adaptive icon: the rounded logo kept inside the central safe zone on a transparent canvas;
# app.json supplies the matching blue behind it.
canvas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
canvas.alpha_composite(size(ROUND, 680), (172, 172))
save(canvas, 'assets', 'adaptive-icon.png')
save(size(ROUND, 256), 'assets', 'logo.png')  # sidebar header

fav = [size(ROUND, s) for s in (16, 32, 48)]
fav[2].save(os.path.join(ROOT, 'public', 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)], append_images=fav[:2])
save(size(ROUND, 48), 'public', 'favicon-48.png')
save(size(ROUND, 192), 'public', 'icon-192.png')
save(size(ROUND, 512), 'public', 'icon-512.png')
save(size(FULL, 180), 'public', 'apple-touch-icon.png')
