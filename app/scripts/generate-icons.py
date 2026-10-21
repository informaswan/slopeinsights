#!/usr/bin/env python3
"""Renders the SlopeInsights mountain mark (same shapes as components/MountainLogo.tsx) to the icon files.
Original artwork drawn from basic shapes, so there is nothing third-party in it. Run: python3 scripts/generate-icons.py"""
from PIL import Image, ImageDraw
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
NAVY, WHITE, SNOW = (18, 48, 77), (230, 238, 246), (186, 230, 253)
SS = 4  # supersample for smooth edges

def mark(size, bg, fg=WHITE, pad=0.0):
    """Mark on a size x size canvas. bg None = transparent; pad = fraction of margin on each side."""
    n = size * SS
    img = Image.new('RGBA', (n, n), bg + (255,) if bg else (0, 0, 0, 0))
    inner = n * (1 - 2 * pad)
    k, ox = inner / 64, n * pad
    P = lambda pts: [(ox + x * k, ox + y * k) for x, y in pts]
    layer = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    outer = P([(32, 8), (52, 48), (12, 48)])
    mid = P([(32, 20), (42, 42), (22, 42)])
    d.polygon(mid, fill=fg + (51,))
    d.line(outer + outer[:1], fill=fg + (255,), width=int(3 * k), joint='curve')
    d.line(mid + mid[:1], fill=fg + (255,), width=int(2 * k), joint='curve')
    for pts, w in ((outer, 3), (mid, 2)):
        r = w * k / 2
        for x, y in pts:
            d.ellipse([x - r, y - r, x + r, y + r], fill=fg + (255,))
    d.line(P([(24, 36), (40, 36)]), fill=SNOW + (255,), width=int(2 * k))
    img.alpha_composite(layer)
    return img.resize((size, size), Image.LANCZOS)

def save(img, *parts):
    path = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)

# App icons (iOS can't have transparency; Android adaptive icon keeps the mark inside the safe zone).
save(mark(1024, NAVY, pad=0.14).convert('RGB'), 'assets', 'icon.png')
save(mark(1024, None, pad=0.27), 'assets', 'adaptive-icon.png')
# Website: favicon, Google's icon sizes, Apple touch icon, and the share image.
fav = [mark(s, NAVY, pad=0.08) for s in (16, 32, 48)]
fav[2].save(os.path.join(ROOT, 'public', 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)], append_images=fav[:2])
save(mark(48, NAVY, pad=0.08), 'public', 'favicon-48.png')
save(mark(192, NAVY, pad=0.1), 'public', 'icon-192.png')
save(mark(512, NAVY, pad=0.12), 'public', 'icon-512.png')
save(mark(180, NAVY, pad=0.12).convert('RGB'), 'public', 'apple-touch-icon.png')
