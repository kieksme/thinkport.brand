#!/usr/bin/env python3
"""Apply Thinkport Corporate Design to an existing PowerPoint deck.

- Sets theme colors to Thinkport palette (Dark Blue, Orange, Turquoise, neutrals).
- Sets all text runs to Montserrat where possible.

Usage:
  pip install -r scripts/requirements-pptx.txt   # or: uv pip install python-pptx
  python scripts/apply-cd-to-pptx.py [--source path/to/source.pptx] [--output path/to/out.pptx]

Defaults: source = Downloads/Thinkport_Firmenvorstellung.pptx, output = examples/powerpoint/thinkport-company-intro.pptx
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

# Theme color names in OOXML a:clrScheme (no leading a: in xpath child names)
CLR_SCHEME_NAMES = (
    "dk1", "lt1", "dk2", "lt2",
    "accent1", "accent2", "accent3", "accent4", "accent5", "accent6",
    "hlink", "folHlink",
)

# Thinkport CD: map scheme slots to hex (no #)
THINKPORT_THEME = {
    "dk1": "0B2649",       # Dark Blue – primary dark
    "lt1": "FFFFFF",       # White – text on dark
    "dk2": "333333",       # Dark Gray – body text
    "lt2": "E8E8E8",       # Light gray – secondary on dark
    "accent1": "FF5722",   # Orange – CTA, highlights
    "accent2": "00BCD4",   # Turquoise – secondary accent
    "accent3": "0B2649",   # Dark Blue
    "accent4": "00A4BA",   # Turquoise darker
    "accent5": "E64C1E",   # Orange darker
    "accent6": "174E96",   # Blue medium
    "hlink": "00BCD4",
    "folHlink": "00A4BA",
}

BRAND_FONT = "Montserrat"


def set_theme_colors(prs, theme_hex: dict[str, str]) -> None:
    """Set presentation theme colors via theme part XML (python-pptx has no API for this)."""
    from pptx.opc.constants import RELATIONSHIP_TYPE as RT
    from lxml import etree

    if not prs.slide_masters:
        return
    slide_master = prs.slide_masters[0]
    part = slide_master.part
    theme_part = part.part_related_by(RT.THEME)
    theme = etree.fromstring(theme_part.blob)

    ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
    clr_scheme = theme.find(".//a:clrScheme", namespaces=ns)
    if clr_scheme is None:
        return

    for name, hex_val in theme_hex.items():
        if name not in CLR_SCHEME_NAMES:
            continue
        elem = clr_scheme.find(f".//a:{name}", namespaces=ns)
        if elem is None:
            continue
        srgb = elem.find("a:srgbClr", namespaces=ns)
        if srgb is not None:
            srgb.set("val", hex_val)
        else:
            # Replace sysClr with srgbClr so our hex is used
            sys_clr = elem.find("a:sysClr", namespaces=ns)
            if sys_clr is not None:
                elem.remove(sys_clr)
                child = etree.SubElement(elem, f"{{{ns['a']}}}srgbClr")
                child.set("val", hex_val)
                child.tail = "\n    "

    theme_part._blob = etree.tostring(theme, encoding="unicode").encode("utf-8")


def set_font_on_shape(shape, font_name: str) -> None:
    """Set font on all text runs in a shape (and in grouped shapes)."""
    if shape.has_text_frame:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                run.font.name = font_name
    if shape.has_table:
        for row in shape.table.rows:
            for cell in row.cells:
                for para in cell.text_frame.paragraphs:
                    for run in para.runs:
                        run.font.name = font_name
    try:
        if shape.shapes:
            for child in shape.shapes:
                set_font_on_shape(child, font_name)
    except Exception:
        pass


def apply_font_to_slides(prs, font_name: str) -> None:
    """Set font on every text run in the presentation (slides only, not masters)."""
    for slide in prs.slides:
        for shape in slide.shapes:
            set_font_on_shape(shape, font_name)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    default_source = root / "examples" / "powerpoint" / "content" / "Thinkport_Firmenvorstellung.pptx"
    if not default_source.exists():
        default_source = Path.home() / "Downloads" / "Thinkport_Firmenvorstellung.pptx"
    default_out = root / "examples" / "powerpoint" / "thinkport-company-intro.pptx"

    parser = argparse.ArgumentParser(description="Apply Thinkport CD to a PowerPoint deck")
    parser.add_argument("--source", type=Path, default=default_source, help="Source PPTX path")
    parser.add_argument("--output", type=Path, default=default_out, help="Output PPTX path")
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()
    if not source.exists():
        raise SystemExit(f"Source file not found: {source}")

    try:
        from pptx import Presentation
    except ImportError as e:
        err = f"Install python-pptx first: pip install -r scripts/requirements-pptx.txt\n{e}"
        try:
            r = Path(__file__).resolve().parent.parent
            p = r / "examples" / "powerpoint" / "apply-cd-log.txt"
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(err, encoding="utf-8")
        except Exception:
            pass
        raise SystemExit(err)

    # Copy source to output if different, then open output (so we don't mutate in place unless same path)
    if source != output:
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, output)

    prs = Presentation(str(output))
    set_theme_colors(prs, THINKPORT_THEME)
    apply_font_to_slides(prs, BRAND_FONT)
    prs.save(str(output))
    print(f"Saved: {output}")


if __name__ == "__main__":
    main()
