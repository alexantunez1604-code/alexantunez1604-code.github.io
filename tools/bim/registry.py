"""Registro de los 10 modelos BIM de la ventana 01. Textos de Alex/CV + cifras medidas en cada IFC.
Uso: python3 tools/bim/registry.py <carpeta_out_con_.bim> → escribe src/bimreg.js y las tarjetas de la biblioteca en index.html"""
import sys,json,zlib,struct,os,re,html
OUT=sys.argv[1] if len(sys.argv)>1 else '../bim/out'
CRED_B='Proyecto: Bienestudio Arquitectura · Modelado y coordinación BIM: Alexander Antúnez'
REG=[
 dict(slug='gocta-1b',g='inf',title='Módulo 1B',proj='Gocta Andes Lodge',tags=['Bienestudio 2025'],
  lede='Módulo 1B del Gocta Andes Lodge: pilares y vigas en acero, concreto y madera, con 351 uniones metálicas modeladas como elementos propios, más muros y cubierta. Cada elemento lleva su familia, tipo, nivel y cantidades.',credit=CRED_B),
 dict(slug='gocta-1a',g='inf',title='Módulo 1A',proj='Gocta Andes Lodge',tags=['Bienestudio 2025'],
  lede='Módulo 1A del Gocta Andes Lodge. El modelo separa por fase lo existente (309 elementos) de lo nuevo; el modo Fase del visor lo muestra.',credit=CRED_B),
 dict(slug='hotel-tucan',g='inf',title='Hotel Tucán Suites',proj='Levantamiento 3D en BIM',tags=['Bienestudio 2025'],
  lede='Levantamiento 3D en BIM del Hotel Tucán Suites, ordenado por niveles, con sus puertas, ventanas, escaleras y muros cortina. Para la web, el modelo se giró 21.75° para alinear el edificio con los ejes del visor, y el terreno se reconstruyó como una superficie continua: donde el IFC no lo cubría se completó con la cota más cercana.',credit=CRED_B),
 dict(slug='pumarrinri-mod3a',g='inf',title='Módulo 3A',proj='Pumarrinri Amazon Lodge',tags=['Bienestudio 2025'],
  lede='Módulo 3A del Pumarrinri Amazon Lodge, con estructura de pilares y vigas de madera. Para la web, el terreno se reconstruyó como una superficie continua a partir del sólido topográfico del IFC.',credit=CRED_B),
 dict(slug='pumarrinri-banos',g='inf',title='Baños de recepción',proj='Pumarrinri Amazon Lodge',tags=['Bienestudio 2025'],
  lede='Baños nuevos de la recepción del Pumarrinri Amazon Lodge, con estructura de madera.',credit=CRED_B),
 dict(slug='plantilla-jjcc',g='mue',title='Plantilla estructural LOD 300',proj='Acero y concreto',tags=['Modelo de muestra'],
  lede='Plantilla estructural LOD 300 en acero y concreto. Es un modelo de muestra para un estudio de ingeniería que quería implementar BIM; la desarrollé en Revit para JJCC Ingenieros.',credit='Plantilla desarrollada por Alexander Antúnez para JJCC Ingenieros · modelo de muestra'),
 dict(slug='casa-violeta',g='dis',title='Casa Violeta',proj='Casa habitación en Huarmey',tags=['2022'],
  lede='Casa habitación en Huarmey, sobre un lote de 10×20 m. Proyecto y modelo de Alexander Antúnez, 2022. El entorno se recortó a 5 m alrededor de la vivienda.',credit='Proyecto y modelo: Alexander Antúnez, 2022'),
 dict(slug='casa-h',g='dis',title='Casa H',proj='Encargo particular',tags=['2024'],lede='Casa H, encargo independiente de 2024 para una persona natural. Modelo de diseño en Revit: volumetría y distribución por niveles.',credit='Proyecto y modelo: Alexander Antúnez, 2024'),
 dict(slug='casa-nilo',g='dis',title='Casa Nilo',proj='Proyecto para Bermez',tags=['2022'],lede='Casa Nilo, proyecto de 2022 desarrollado para Bermez, para un tercero. Modelo de diseño en Revit: volumetría y distribución por niveles.',credit='Proyecto y modelo: Alexander Antúnez, 2022 · para Bermez'),
 dict(slug='mastil-2',g='dis',title='Mástil 2',proj='Proyecto con Bermez y SRT',tags=['2024'],lede='Mástil 2, proyecto de 2024 desarrollado para Bermez y SRT, en asociación, para un cliente particular. Modelo de diseño en Revit: volumetría y distribución por niveles.',credit='Proyecto y modelo: Alexander Antúnez, 2024 · para Bermez y SRT, en asociación'),
]
GROUPS={
 'inf':('Modelos de información BIM','Cinco modelos con lo que necesita quien construye: cada elemento lleva su familia, tipo, nivel, fase de obra y cantidades, y se recorren por sistema, nivel y material.'),
 'mue':('Plantilla de muestra','Una plantilla estructural para ingeniería: el modelo base sobre el que un estudio empieza a trabajar en BIM.'),
 'dis':('Modelos de diseño','Modelos para decidir forma y distribución. El detalle constructivo viene después, como en los modelos de información.')}
def head(slug):
    z=zlib.decompress(open(f'{OUT}/{slug}.bim','rb').read());jl=struct.unpack('<I',z[4:8])[0]
    return json.loads(z[16:16+jl]),os.path.getsize(f'{OUT}/{slug}.bim')
def fmt(n): return f'{n:,}'
meta={}
for r in REG:
    h,sz=head(r['slug']);st=h['st']
    lv=[l for l in h['lv'] if l['z'] is not None and l['c']>0]
    r.update(n=st['n'],shown=st['shown'],types=st['types'],levels=len(lv),kb=round(sz/1024),tris=st['tris'],app=re.sub(r'\s*\(.*?\)','',h['app']).replace('Autodesk ','').strip(),schema=h['schema'])
    if r['slug']=='casa-violeta': r['schema']='IFC2X3'
# --- src/bimreg.js
open('src/bimreg.js','w',encoding='utf-8').write('/* generado por tools/bim/registry.py: no editar a mano */\nexport default '+json.dumps({'models':REG,'groups':GROUPS},ensure_ascii=False,indent=1)+';\n')
# --- tarjetas
alts={'inf':'coloreado por sistemas constructivos','mue':'coloreado por sistemas constructivos','dis':'coloreado por sistemas'}
def card(r):
    e=html.escape
    return (f'<button type="button" class="bxc" data-slug="{r["slug"]}" aria-pressed="false">'
      f'<span class="bxc-im"><img src="img/bx-{r["slug"]}.webp" alt="Vista 3D del modelo {e(r["title"])} ({e(r["proj"])}), {alts[r["g"]]}." loading="lazy" width="640" height="420"></span>'
      f'<span class="bxc-t"><b>{e(r["title"])}</b><small>{e(r["proj"])}</small></span>'
      f'<span class="bxc-n"><i><b>{fmt(r["n"])}</b> elementos</i><i><b>{r["types"]}</b> tipos</i><i><b>{r["levels"]}</b> niveles</i></span>'
      f'<span class="bxc-g"><span class="tech">{e(" · ".join(r["tags"]) if r["tags"] else r["app"]+" · "+r["schema"])}</span><span class="bxc-go tech">Abrir modelo</span></span></button>')
parts=[]
order=['inf','mue','dis'];tot=len(REG)
for gi,g in enumerate(order,1):
    rs=[r for r in REG if r['g']==g]
    parts.append(f'<section class="bxg" aria-labelledby="bxg-{g}"><header class="bxg-h"><span class="tech">Grupo {gi} de 3 · {len(rs)} {"modelos" if len(rs)>1 else "modelo"}</span><h4 id="bxg-{g}">{html.escape(GROUPS[g][0])}</h4><p>{html.escape(GROUPS[g][1])}</p></header><div class="bxgrid" style="--n:{len(rs)}">'+''.join(card(r) for r in rs)+'</div></section>')
snip='<!--BIM:CARDS-->'+''.join(parts)+'<!--/BIM:CARDS-->'
s=open('index.html',encoding='utf-8').read()
s=re.sub(r'<!--BIM:CARDS-->.*?<!--/BIM:CARDS-->',lambda m:snip,s,flags=re.S)
open('index.html','w',encoding='utf-8').write(s)
print('ok',[(r['slug'],r['n'],r['types'],r['levels'],r['kb']) for r in REG])
