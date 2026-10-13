"""Arma la carpeta para publicar como artefacto de Claude: un HTML con CSS y JS integrados, más imágenes y datos.
Uso: npx vite build -c vite.inline.config.js && python3 tools/make_artifact.py <carpeta_salida>"""
import re, shutil, base64, os, sys, json
SRC = 'dist-inline'; DST = sys.argv[1]
shutil.rmtree(DST, ignore_errors=True); shutil.copytree(SRC, DST)
shutil.rmtree(DST + '/assets')
# etiquetas para compartir e íconos: solo valen en un sitio propio, no dentro del artefacto
for nm in ('og.png','favicon.svg','favicon-32.png','favicon.ico','apple-touch-icon.png'):
    if os.path.exists(DST + '/' + nm): os.remove(DST + '/' + nm)
# el servidor del artefacto no entrega .glb: se publica en base64 (.glb.txt) y el visor lo lee de ahí
for nm in os.listdir(DST + '/models'):
    if nm.endswith('.glb'):
        g = open(DST + '/models/' + nm, 'rb').read()
        open(DST + '/models/' + nm + '.txt', 'w').write(base64.b64encode(g).decode()); os.remove(DST + '/models/' + nm)
    if nm.endswith('.bim'):
        g = open(DST + '/models/' + nm, 'rb').read()
        open(DST + '/models/' + nm + '.txt', 'w').write(base64.b64encode(g).decode()); os.remove(DST + '/models/' + nm)
s = open(SRC + '/index.html', encoding='utf-8').read()
js_href = re.search(r'<script type="module"[^>]*src="\./(assets/[^"]+)"[^>]*></script>', s)
css_href = re.search(r'<link rel="stylesheet"[^>]*href="\./(assets/[^"]+)"[^>]*>', s)
js = open(SRC + '/' + js_href.group(1), encoding='utf-8').read().replace('</script', '<\\/script')
css = open(SRC + '/' + css_href.group(1), encoding='utf-8').read().replace('../img/', './img/')
title = re.search(r'<title>.*?</title>', s).group(0)
body = s[s.index('<body>') + 6:s.index('</body>')]
body = body.replace(js_href.group(0), '').strip()
body = body.replace('id="visor"', 'id="visor" data-b64="1"', 1)
out = title + '\n' + '<style>' + css + '</style>\n' + body + '\n<script type="module">' + js + '</script>\n'
open(DST + '/index.html', 'w', encoding='utf-8').write(out)
files = []
for r, _, fs in os.walk(DST):
    for f in fs:
        p = os.path.relpath(os.path.join(r, f), DST)
        if p != 'index.html': files.append({'path': p})
json.dump(files, open(DST + '_files.json', 'w'))
print(len(files), 'archivos auxiliares; index.html', os.path.getsize(DST + '/index.html') // 1024, 'KB')
