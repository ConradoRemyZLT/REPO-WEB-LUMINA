"""Normaliza logos: recorte al bbox del alfa (sin reencuadrar el diseño), recoloreo plano preservando alfa.
PNG guardado SIN optimize=True (evita cuantizar el color)."""
import sys, os
from PIL import Image
SRC = sys.argv[1]; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def flat(im, rgb, pad=0):
    im = im.convert('RGBA'); a = im.getchannel('A'); bb = a.getbbox(); im = im.crop(bb); a = im.getchannel('A')
    o = Image.new('RGBA', im.size, rgb + (0,)); o.putalpha(a); return o
def save(im, name, maxw=None):
    if maxw and im.width > maxw:  # escalar solo el alfa y recomponer: el color queda exacto
        a = im.getchannel('A').resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
        rgb = next(c[:3] for c in im.get_flattened_data() if c[3] == 255)  # color plano del logo
        im = Image.new('RGBA', a.size, rgb + (0,)); im.putalpha(a)
    p = os.path.join(ROOT, 'logos', name); im.save(p)
    px = [c for c in im.get_flattened_data() if c[3] == 255]; print(name, im.size, os.path.getsize(p)//1024, 'KB', 'colores opacos:', len(set(c[:3] for c in px)))
L = os.path.join(SRC, 'Manual_de_Marca_Lumina', 'Logos Lumina')
blanco = Image.open(os.path.join(L, 'Logo Lumina Blanco-04.png'))       # con "CASAS EN FUNES"
sinsl = Image.open(os.path.join(L, 'Logo Lumina Blanco sin slogan.png'))
save(flat(blanco, (255, 255, 255)), 'lumina-blanco.png', 1400)
save(flat(blanco, (0x32, 0x32, 0x32)), 'lumina-ink.png', 1400)
save(flat(sinsl, (255, 255, 255)), 'lumina-wordmark-blanco.png', 954)
save(flat(sinsl, (0x32, 0x32, 0x32)), 'lumina-wordmark-ink.png', 954)
S = os.path.join(SRC, 'Logos_Socios')
save(flat(Image.open(os.path.join(S, 'Logo invertido PNG.png')), (0x32, 0x32, 0x32)), 'jauke-ink.png', 400)
save(flat(Image.open(os.path.join(S, 'Logo Crestale.png')), (0x32, 0x32, 0x32)), 'crestale-ink.png', 700)
