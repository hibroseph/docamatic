"""Makes the smaller copies of the fonts that the notes on web pages use.

The notes UI script carries its fonts inside it (src/page/pageFonts.ts), so
every byte of them is loaded on every page with notes. These copies keep only
what the notes need: Latin letters and punctuation (other scripts fall back to
the system font, letter by letter), the weights the notes use, and, for the
titles' font, one optical size. Docamatic's own pages keep the full fonts.

    pip install fonttools brotli
    python scripts/subset-page-fonts.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS = Path(__file__).resolve().parent.parent / "design-system" / "fonts"
OUT = FONTS / "page"

# Basic Latin, Latin-1, Latin Extended-A, and common punctuation and symbols
UNICODES = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0100-017F,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD"

FACES = [
    # Body text: regular to bold
    ("Figtree-Variable.woff2", {"wght": (400, 700)}),
    # Note titles (15-20px, weight 650-700)
    ("BricolageGrotesque-Variable.woff2", {"opsz": 16, "wght": (600, 800)}),
]

OUT.mkdir(exist_ok=True)
for name, axes in FACES:
    font = TTFont(FONTS / name, lazy=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
    subsetter.subset(font)
    font = instancer.instantiateVariableFont(font, axes)
    target = OUT / name
    font.flavor = "woff2"
    font.save(target)
    print(f"{name}: {(FONTS / name).stat().st_size} -> {target.stat().st_size} bytes")
