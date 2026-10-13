#!/usr/bin/env python3
"""Limpia y adapta los bocetos de Alex a la paleta del sitio.

Uso:  python3 tools/process_sketches.py <carpeta con 01_panorama.png ... 09_papelB.jpg> <carpeta de salida (public)>

Qué hace con cada lámina (los originales no se tocan):
  03_persp   perspectiva a línea      -> tinta azul grafito sobre fondo transparente
  02_elev    elevación con marcador   -> recorta bordes, amarillo a verde azulado, fondo transparente
  07_seccion sección con ventilación  -> recorta la leyenda, violeta a lavanda, fondo transparente
  04_plan    planta con marcadores    -> colores remapeados a la paleta, fondo transparente
  05_urban   mapa urbano en axonometría -> recorta borde, amarillos y beige a la paleta fría
  06_playa   foto de playa con boceto -> borra el texto incrustado y calma el naranja del cerro
  01_panorama render al atardecer     -> recorta la leyenda y pasa los cálidos a un crepúsculo frío
  08/09_papel texturas de papel arrugado -> láminas translúcidas RGBA (papel mantequilla)
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter
import cv2

src, out = sys.argv[1], sys.argv[2]
IMG = os.path.join(out, 'img'); TEX = os.path.join(out, 'tex')
os.makedirs(IMG, exist_ok=True); os.makedirs(TEX, exist_ok=True)

INK = np.array([20, 27, 46], np.float32) / 255.0      # tinta azul grafito


def load(name):
    for ext in ('.png', '.jpg'):
        p = os.path.join(src, name + ext)
        if os.path.exists(p):
            im = Image.open(p)
            if im.mode == 'RGBA':
                bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3]); im = bg
            return np.asarray(im.convert('RGB'), np.float32) / 255.0
    raise FileNotFoundError(name)


def save(arr, path, q=88, alpha=False):
    a = np.clip(arr, 0, 1)
    im = Image.fromarray((a * 255 + .5).astype(np.uint8), 'RGBA' if alpha else 'RGB')
    if path.endswith('.webp'):
        im.save(path, 'WEBP', quality=q, alpha_quality=60, method=4)
    else:
        im.save(path, optimize=True)
    print(os.path.basename(path), im.size, os.path.getsize(path) // 1024, 'KB')


def flatten_paper(a, k=61):
    """Corrige el brillo desigual del papel: lo divide por una estimación del fondo."""
    g = a.max(axis=2).astype(np.float32)
    h, w = g.shape
    f = 4                                                       # se estima en baja resolución (rápido)
    gs = cv2.resize(g, (w // f, h // f), interpolation=cv2.INTER_AREA)
    kk = max(3, (k // f) | 1)
    bg = cv2.dilate(gs, cv2.getStructuringElement(cv2.MORPH_RECT, (kk, kk)))
    bg = cv2.GaussianBlur(bg, (0, 0), kk / 3)
    bg = cv2.resize(bg, (w, h), interpolation=cv2.INTER_LINEAR)
    bg = np.clip(bg, .55, 1)
    return np.clip(a / bg[..., None], 0, 1)


def color_to_alpha(a, lo=.07, hi=.9, gamma=1.0):
    """Quita el blanco del papel: devuelve RGBA con la tinta/marcador y transparencia en el resto."""
    al = 1 - a.min(axis=2)
    col = (a - (1 - al[..., None])) / np.maximum(al[..., None], 1e-3)
    al2 = np.clip((al - lo) / (hi - lo), 0, 1) ** gamma
    return np.clip(col, 0, 1), al2


def hsv(a):
    return cv2.cvtColor(a.astype(np.float32), cv2.COLOR_RGB2HSV)       # H 0..360, S,V 0..1


def rgb(h):
    return cv2.cvtColor(h.astype(np.float32), cv2.COLOR_HSV2RGB)


def hue_map(H, pts):
    """Mapa de matiz por tramos (con cierre circular). pts: lista (desde, hasta) ordenada por 'desde'."""
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    xs2 = [xs[-1] - 360] + xs + [xs[0] + 360]
    # desenrolla los destinos para interpolar sin saltos
    ys_u = [ys[0]]
    for y in ys[1:]:
        while y - ys_u[-1] > 180: y -= 360
        while y - ys_u[-1] < -180: y += 360
        ys_u.append(y)
    ys2 = [ys_u[-1] - 360] + ys_u + [ys_u[0] + 360]
    return np.interp(H, xs2, ys2) % 360


def crop(a, box):
    x0, y0, x1, y1 = box
    return a[y0:y1, x0:x1]


def to_rgba(col, al):
    return np.dstack([col, al])


def write_rgba(col, al, path, q=90):
    save(to_rgba(col, al), path, q, alpha=True)


# ---------------------------------------------------------------- 03 perspectiva
def persp():
    a = crop(load('03_persp'), (0, 0, 1873, 908))
    a = flatten_paper(a, 81)
    lum = a.mean(axis=2)
    al = np.clip((1 - lum - .06) / (.78 - .06), 0, 1) ** .85           # grafito suave queda tenue, tinta firme
    al = cv2.GaussianBlur(al, (0, 0), .6)
    al = np.clip(al * 1.12, 0, 1)
    col = np.ones_like(a) * INK
    write_rgba(col, al, os.path.join(IMG, 'sk-persp.webp'), 92)
    return col, al


# ---------------------------------------------------------------- 02 elevación
def elev():
    a = crop(load('02_elev'), (46, 40, 1996, 736))
    a = flatten_paper(a, 71)
    H = hsv(a)
    yellow = (H[..., 0] > 26) & (H[..., 0] < 80) & (H[..., 1] > .09)
    H[..., 0] = np.where(yellow, 182 + (H[..., 0] - 50) * .2, H[..., 0])
    H[..., 1] = np.where(yellow, np.minimum(1, H[..., 1] * .62), H[..., 1])
    H[..., 2] = np.where(yellow, H[..., 2] * .66, H[..., 2])
    a = rgb(H)
    col, al = color_to_alpha(a, .11, .92)
    al[:110, 1840:] = 0                                            # resto de cinta en la esquina
    # los negros pasan a tinta azul grafito
    dark = np.clip(1 - col.max(axis=2) * 3.2, 0, 1)[..., None]
    col = col * (1 - dark) + INK * dark
    al = np.clip(cv2.GaussianBlur(al, (0, 0), .5) * 1.05, 0, 1)
    write_rgba(col, al, os.path.join(IMG, 'sk-elev.webp'), 90)


# ---------------------------------------------------------------- 07 sección
def seccion():
    a = crop(load('07_seccion'), (14, 56, 1414, 990))
    a = flatten_paper(a, 71)
    H = hsv(a)
    purple = (H[..., 0] > 240) & (H[..., 0] < 290) & (H[..., 1] > .12)
    H[..., 0] = np.where(purple, 233 + (H[..., 0] - 262) * .4, H[..., 0])
    H[..., 1] = np.where(purple, H[..., 1] * .62, H[..., 1])
    H[..., 2] = np.where(purple, H[..., 2] * .86, H[..., 2])
    blue = (H[..., 0] > 205) & (H[..., 0] <= 240) & (H[..., 1] > .2)
    H[..., 1] = np.where(blue, H[..., 1] * .9, H[..., 1])
    a = rgb(H)
    col, al = color_to_alpha(a, .06, .95)
    dark = np.clip(1 - col.max(axis=2) * 3.2, 0, 1)[..., None]
    col = col * (1 - dark) + INK * dark
    write_rgba(col, al, os.path.join(IMG, 'sk-seccion.webp'), 90)


# ---------------------------------------------------------------- 04 planta
def plan():
    a = crop(load('04_plan'), (0, 0, 1777, 1035))
    a = flatten_paper(a, 91)
    H = hsv(a)
    h = H[..., 0]
    # matiz: verdes -> salvia, rosa -> lavanda, naranja/salmón -> verde azulado, celestes y azules -> cobalto/azul pizarra
    nh = hue_map(h, [(0, 205), (20, 176), (45, 168), (75, 150), (130, 150), (170, 176), (200, 214), (230, 222), (280, 250), (330, 246), (360, 205)])
    sat = H[..., 1]
    s_scale = np.interp(h, [0, 30, 60, 100, 150, 190, 215, 260, 330, 360], [.62, .7, .5, .55, .55, .75, .7, .6, .62, .62])
    H[..., 0] = nh
    H[..., 1] = sat * s_scale
    # el marrón del contorno (oscuro, naranja) pasa a tinta
    brown = (h > 18) & (h < 55) & (H[..., 2] < .62) & (sat > .25)
    H[..., 1] = np.where(brown, sat * .2, H[..., 1])
    H[..., 2] = np.where(brown, H[..., 2] * .55, H[..., 2])
    a = rgb(H)
    col, al = color_to_alpha(a, .05, .85)
    dark = np.clip(1 - col.max(axis=2) * 3.0, 0, 1)[..., None]
    col = col * (1 - dark) + INK * dark
    col = cv2.resize(col, (1500, 874), interpolation=cv2.INTER_AREA); al = cv2.resize(al, (1500, 874), interpolation=cv2.INTER_AREA)
    write_rgba(col, al, os.path.join(IMG, 'sk-plan.webp'), 82)


# ---------------------------------------------------------------- 05 mapa urbano
def urban():
    a = crop(load('05_urban'), (24, 4, 1520, 1022))
    H = hsv(a)
    h, s, v = H[..., 0], H[..., 1], H[..., 2]
    # fondo beige/rosado -> gris frío; amarillos -> verde azulado claro; rojos -> azul pizarra oscuro
    base = (s < .2) & (v > .55)
    H2 = H.copy()
    yel = (h > 38) & (h < 75) & (s > .35)
    red = ((h < 14) | (h > 340)) & (s > .45)
    H2[..., 0] = np.where(base, 196, H2[..., 0])
    H2[..., 1] = np.where(base, s * .35, H2[..., 1])
    H2[..., 0] = np.where(yel, 172, H2[..., 0])
    H2[..., 1] = np.where(yel, s * .7, H2[..., 1])
    H2[..., 2] = np.where(yel, np.minimum(1, v * .96), H2[..., 2])
    H2[..., 0] = np.where(red, 214, H2[..., 0])
    H2[..., 1] = np.where(red, s * .8, H2[..., 1])
    H2[..., 2] = np.where(red, v * .62, H2[..., 2])
    # violeta del paseo: un poco más azul; verdes más salvia
    pur = (h > 270) & (h < 325) & (s > .25)
    H2[..., 0] = np.where(pur, 258 + (h - 295) * .35, H2[..., 0])
    H2[..., 1] = np.where(pur, s * .72, H2[..., 1])
    grn = (h > 80) & (h < 160) & (s > .2)
    H2[..., 0] = np.where(grn, 150, H2[..., 0])
    H2[..., 1] = np.where(grn, s * .6, H2[..., 1])
    save(rgb(H2), os.path.join(IMG, 'tq-urbano.webp'), 88)


# ---------------------------------------------------------------- 06 playa
def playa():
    a8 = (load('06_playa') * 255).astype(np.uint8)
    g = a8.min(axis=2)
    mask = np.zeros(g.shape, np.uint8)
    # dos columnas de texto sobre el cielo (el cielo azul tiene el canal rojo bajo; el texto blanco no)
    mask[:330, 20:500] = (g[:330, 20:500] > 105)
    mask[:350, 940:1396] = (g[:350, 940:1396] > 105)
    # título sobre la arena (la arena llega a ~215; el texto es 255)
    mask[755:845, 330:1130] = (g[755:845, 330:1130] > 226)
    mask = cv2.dilate(mask * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    inp = cv2.inpaint(a8, mask, 7, cv2.INPAINT_TELEA)
    a = inp.astype(np.float32) / 255
    H = hsv(a)
    h, s = H[..., 0], H[..., 1]
    warm = (h > 5) & (h < 55) & (s > .22)
    H[..., 0] = np.where(warm, 12 + (h - 25) * .4, h)
    H[..., 1] = np.where(warm, s * .5, s)
    H[..., 2] = np.where(warm, H[..., 2] * .96, H[..., 2])
    save(rgb(H), os.path.join(IMG, 'tq-sitio.webp'), 88)
    Image.fromarray(mask).save(os.path.join(src, '_mask_playa.png'))


# ---------------------------------------------------------------- 01 panorama
def gradient_map(L, stops):
    xs = [x for x, _ in stops]; cs = np.array([c for _, c in stops], np.float32) / 255
    return np.dstack([np.interp(L, xs, cs[:, k]) for k in range(3)])


def panorama():
    a = crop(load('01_panorama'), (0, 10, 1976, 500))
    a = cv2.fastNlMeansDenoisingColored((a * 255).astype(np.uint8), None, 3, 3, 5, 15).astype(np.float32) / 255   # quita el ruido JPEG antes de virar
    L = a @ np.array([.299, .587, .114], np.float32)
    L = np.clip((L - np.percentile(L, 1)) / (np.percentile(L, 99.5) - np.percentile(L, 1)), 0, 1)
    gm = gradient_map(L, [(0, (14, 24, 27)), (.28, (48, 66, 92)), (.55, (104, 118, 156)), (.8, (190, 200, 216)), (1, (238, 241, 240))])
    gray = np.repeat(a.mean(axis=2, keepdims=True), 3, axis=2)
    H = hsv(a); H[..., 1] *= .3
    soft = rgb(H)
    out = .78 * gm + .22 * soft
    save(out, os.path.join(IMG, 'tq-panorama.webp'), 86)


# ---------------------------------------------------------------- papeles
def papel(name, outname, size, flip=False):
    a = load(name)
    im = Image.fromarray((a * 255).astype(np.uint8))
    im = im.resize(size, Image.LANCZOS)
    a = np.asarray(im, np.float32) / 255
    L = a.mean(axis=2)
    # normaliza: pliegues claros -> 1, sombras -> 0
    lo, hi = np.percentile(L, 2), np.percentile(L, 99)
    Ln = np.clip((L - lo) / (hi - lo), 0, 1)
    sh = 1 - Ln                                             # cuánto pliegue/sombra hay
    # color: blanco frío con sombras gris azuladas
    tint_hi = np.array([248, 250, 250], np.float32) / 255
    tint_lo = np.array([160, 174, 183], np.float32) / 255
    col = tint_hi * (1 - sh[..., None] * 1.0) + tint_lo * (sh[..., None] * 1.0)
    # transparencia: la hoja deja ver lo de abajo; los pliegues oscuros son más opacos
    al = .36 + .42 * sh ** 1.15
    al = np.clip(al, 0, .9)
    write_rgba(col, al, os.path.join(TEX, outname), 70)


if __name__ == '__main__':
    todo = {'persp': persp, 'elev': elev, 'seccion': seccion, 'plan': plan, 'urban': urban, 'playa': playa, 'panorama': panorama,
            'papel': lambda: (papel('08_papelA', 'paper-a.webp', (1800, 1200)), papel('09_papelB', 'paper-b.webp', (1100, 1508)))}
    for k in (sys.argv[3:] or todo):
        todo[k]()
