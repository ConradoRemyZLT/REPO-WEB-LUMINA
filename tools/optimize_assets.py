"""Genera los recursos optimizados del sitio a partir de los originales.
Uso: python tools/optimize_assets.py <carpeta "Girasoles - Comunicación y Marketing"> <brochure VF 17MB opcional>
Reglas: exif_transpose antes de escalar, LANCZOS, nunca deformar, PNG con alfa sin optimize=True."""
import sys, os, glob
from PIL import Image, ImageOps
SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def out(*p): 
    f = os.path.join(ROOT, *p); os.makedirs(os.path.dirname(f), exist_ok=True); return f
def save_webp(im, dst, maxside, q):
    im = ImageOps.exif_transpose(im)
    if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGBA' if 'A' in im.mode else 'RGB')
    w, h = im.size; s = min(1, maxside / max(w, h))
    if s < 1: im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=q, method=6)
    print(os.path.relpath(dst, ROOT), im.size, os.path.getsize(dst) // 1024, 'KB')

R = os.path.join(SRC, 'Carpeta_Para_Inmobiliarias_Lumina', 'Renders Lumina Para Inmobiliaria')
RENDERS = {  # origen -> nombre web
 '04.png': ('render-calle-principal', 2200), '03.png': ('render-acceso', 1800), '06.png': ('render-patio-pileta', 1800),
 '05.png': ('render-calle-vista', 1800), '02.png': ('render-aerea', 1800), '01.png': ('render-planta-techos', 1800),
 '07.png': ('render-living', 1800), '08.png': ('render-cocina-comedor', 1800)}
for f, (name, mx) in RENDERS.items():
    im = Image.open(os.path.join(R, f)).convert('RGB')
    save_webp(im, out('fotos', 'renders', name + '.webp'), mx, 80)

M = glob.glob(os.path.join(SRC, 'Fotos_y_Videos_Avance_de_Obra', 'Fotos y Videos 2026', 'Fotos y Videos Mayo 2026', 'Lumina-Mayo-*.jpg'))
OBRA = [31, 32, 30, 34, 33, 35, 1, 4, 7, 26, 24, 20, 22, 2, 8, 9, 28]
for n in OBRA:
    im = Image.open(os.path.join(os.path.dirname(M[0]), f'Lumina-Mayo-{n}.jpg'))
    save_webp(im, out('fotos', 'obra', '2026-05', f'obra-2026-05-{n:02d}.webp'), 1500, 74)

im = Image.open(os.path.join(SRC, 'Masterplan', 'Masterplan_Lumina_20250627.jpg'))
save_webp(im, out('fotos', 'masterplan', 'masterplan.webp'), 1600, 86)

if len(sys.argv) > 2:  # plantas en mejor resolución desde el brochure VF (páginas 10 y 12)
    import fitz
    doc = fitz.open(sys.argv[2])
    for pg, name in ((10, 'planta-unidad-1'), (12, 'planta-unidad-2')):
        page = doc[pg - 1]
        for img in page.get_images(full=True):
            xref, smask = img[0], img[1]
            pix = fitz.Pixmap(doc, xref)
            if smask:
                pix = fitz.Pixmap(pix, fitz.Pixmap(doc, smask))
            if pix.width < 1000: continue
            mode = 'RGBA' if pix.alpha else 'RGB'
            im = Image.frombytes(mode, (pix.width, pix.height), pix.samples)
            save_webp(im, out('fotos', 'plantas', name + '.webp'), 1600, 90)
            break
