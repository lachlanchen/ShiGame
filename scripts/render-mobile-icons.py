"""Render SHI's existing seal as vectors with an explicit CJK glyph outline.

No image model or new artwork: preserve favicon geometry, avoiding missing-glyph
boxes in headless SVG engines. Noto Serif CJK is SIL OFL-1.1; see the existing
font provenance in docs/production/THIRD_PARTY_NOTICES.md. Generated store/iOS PNGs are opaque.
"""
from pathlib import Path
import cairosvg
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

root = Path(__file__).resolve().parents[1]
font = TTFont("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc", fontNumber=2)
glyphs = font.getGlyphSet()
glyph = glyphs[font.getBestCmap()[ord("勢")]]
pen = SVGPathPen(glyphs)
glyph.draw(pen)
scale = 45 / font["head"].unitsPerEm
left = 32 - glyph.width * scale / 2
seal = f'''<rect width="64" height="64" fill="#70291f"/>
<rect x="5" y="5" width="54" height="54" rx="2" fill="none" stroke="#cda968" stroke-width="2"/>
<path fill="#eee4ce" transform="translate({left} 47) scale({scale} {-scale})" d="{pen.getCommands()}"/>'''
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{seal}</svg>'
asset = root / "assets/mobile"
asset.mkdir(parents=True, exist_ok=True)
(asset / "shi-seal-outlined.svg").write_text(svg)
def render(path, size, source=svg):
    path.parent.mkdir(parents=True, exist_ok=True)
    cairosvg.svg2png(bytestring=source.encode(), write_to=str(path), output_width=size, output_height=size)
render(asset / "shi-icon-1024.png", 1024)
render(asset / "shi-icon-512.png", 512)
render(root / "apps/mobile/ios/SHI/Assets.xcassets/AppIcon.appiconset/AppIcon.png", 1024)
res = root / "apps/mobile/android/app/src/main/res"
for density, size in [("mdpi",48),("hdpi",72),("xhdpi",96),("xxhdpi",144),("xxxhdpi",192)]:
    for name in ["ic_launcher", "ic_launcher_round"]:
        render(res / f"mipmap-{density}/{name}.png", size)
    foreground = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><g transform="translate(22 22)">{seal}</g></svg>'
    render(res / f"mipmap-{density}/ic_launcher_foreground.png", round(size*108/48), foreground)
print("Rendered existing seal with Noto Serif CJK outlines, iOS and Android sizes.")
