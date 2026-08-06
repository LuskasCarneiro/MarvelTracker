#!/bin/bash
# Rasterises the inline-SVG artwork out of index.html to PNGs you can actually LOOK
# at with the Read tool. Text-only reasoning about this project's SVG art has already
# failed six passes in a row — run this and look at the output before claiming any
# non-trivial drawing works.
#
#   bash tools/render_mask.sh mask mjolnir      # -> /tmp/mvart/mask_mjolnir_1.png
#   bash tools/render_mask.sh panel antman      # -> /tmp/mvart/panel_antman_*.png
#   bash tools/render_mask.sh                   # every MASK_HTML + PANEL_HTML key
#
# Generalised 2026-08-05. It used to be hardcoded to MASK_HTML.ironmask (which is now
# a photograph, so it has nothing to rasterise); it now takes the collection and the
# key as arguments and renders every top-level <svg> found under it.
#
# WHAT IT CAN AND CANNOT SHOW YOU
#   CAN:    shape, geometry, fills, strokes, gradients, clip paths, text in SVG —
#           i.e. "is the hammer a hammer, is the ant an ant".
#   CANNOT: CSS animation, HTML layout, stacking order between HTML siblings, or
#           where position:absolute decor actually lands. There is NO headless
#           browser here. Anything outside a single <svg> still has to be read by hand.
#
# KNOWN FALSE ALARM — librsvg ignores pathLength="1" when resolving
# stroke-dasharray. This project uses that combination deliberately (webpull's shot
# lines, assemble's ring arcs, mjolnir's cracks, slingring's rings) so ONE
# 0->1 dashoffset keyframe fits paths of any length. Browsers normalise it and draw
# a solid stroke; librsvg treats the "1" as one user unit and draws a fine HATCHED
# line instead. Verified with a two-line control SVG. If a stroke comes out hatched
# here, check for pathLength before "fixing" anything — the page is fine.
#
# Each top-level <svg> is rendered separately over a mid-grey backdrop (so both light
# and dark strokes are visible), with the project's real stylesheet inlined so the
# .xx-yyy classes resolve. @media blocks are stripped (librsvg mishandles them, and
# animation is unrenderable anyway — the static rules are exactly what we want to
# check, since those are also the reduced-motion frame). CSS custom properties are
# pre-resolved, because librsvg's var() support is unreliable.
set -e
cd "$(dirname "$0")/.."
mkdir -p /tmp/mvart

python3 - "${1:-}" "${2:-}" <<'PY'
import re, subprocess, sys, json

which, key = (sys.argv[1] or ''), (sys.argv[2] or '')
html = open('index.html').read()
OUT = '/tmp/mvart'

# ---- the project stylesheet, with top-level @media blocks stripped ----
css = html[html.index('<style>')+7 : html.index('</style>')]
res = []
while True:
    m = re.search(r'@media[^{]*\{', css)
    if not m:
        res.append(css); break
    res.append(css[:m.start()])
    rest, d, j = css[m.end():], 1, 0
    while j < len(rest) and d:
        if rest[j] == '{': d += 1
        elif rest[j] == '}': d -= 1
        j += 1
    css = rest[j:]
css = ''.join(res)

# ---- resolve custom properties (collect every --x:value, then substitute) ----
cvars = dict(re.findall(r'(--[\w-]+)\s*:\s*([^;}]+)[;}]', css))
def resolve(txt):
    for _ in range(6):
        new = re.sub(r'var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*?))?\)',
                     lambda m: cvars.get(m.group(1), m.group(2) or '#888').strip(), txt)
        if new == txt: break
        txt = new
    return txt
css = resolve(css)

# ---- pull PANEL_HTML / MASK_HTML out of the inline script via node ----
def obj_src(name):
    s = html.index('const ' + name)
    f = html.index('{', s); d = 0; i = f
    while i < len(html):
        if html[i] == '{': d += 1
        elif html[i] == '}':
            d -= 1
            if not d: break
        i += 1
    return html[f:i+1]

proc = subprocess.run(
    ['node', '-e', 'const MK_PHOTO="",MK_TEX="";'
                   'process.stdout.write(JSON.stringify({panel:%s,mask:%s}));'
                   % (obj_src('PANEL_HTML'), obj_src('MASK_HTML'))],
    capture_output=True, text=True, check=True)
data = json.loads(proc.stdout)

targets = [(kind, k, mk)
           for kind in ('mask', 'panel') if not which or which == kind
           for k, mk in data[kind].items() if not key or key == k]
if not targets:
    sys.exit('no such key. available: mask=%s panel=%s'
             % (list(data['mask']), list(data['panel'])))

def top_level_svgs(markup):
    """Each top-level <svg>, paired with the class list of the <div>s enclosing it.
       That ancestor chain is NOT decoration: rules like `.rg-ktop .rg-band{fill:pink}`
       only match through it, so an svg rendered bare comes out the wrong colour and
       you would 'verify' a drawing that is not what the browser shows."""
    out, depth, start, divs = [], 0, None, []
    for m in re.finditer(r'<svg\b|</svg>|<div\b[^>]*>|</div>', markup):
        tok = m.group(0)
        if tok == '<svg':
            if depth == 0:
                start = m.start(); ancestors = list(divs)
            depth += 1
        elif tok == '</svg>':
            depth -= 1
            if depth == 0: out.append((markup[start:m.end()], ancestors))
        elif depth == 0:
            if tok == '</div>':
                if divs: divs.pop()
            else:
                c = re.search(r'class="([^"]*)"', tok)
                divs.append(c.group(1) if c else '')
    return out

made = []
for kind, k, markup in targets:
    svgs = top_level_svgs(markup)
    if not svgs:
        print('  %s/%s: no inline <svg> — HTML/CSS art only, nothing to rasterise' % (kind, k))
        continue
    for n, (svg, ancestors) in enumerate(svgs, 1):
        vb = re.search(r'viewBox="([^"]+)"', svg)
        x, y, w, h = ([float(v) for v in vb.group(1).replace(',', ' ').split()]
                      if vb else [0, 0, 300, 300])
        body = resolve(re.sub(r'^<svg\b[^>]*>', '', svg)[:-len('</svg>')])
        # re-create the enclosing <div> chain as <g class="..."> so descendant
        # selectors resolve exactly as they do in the page
        for c in reversed(ancestors):
            body = '<g class="%s">%s</g>' % (c, body)
        scale = max(1, int(900 / max(w, h)))
        doc = ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
               'viewBox="%g %g %g %g" width="%g" height="%g"><style><![CDATA[%s]]></style>'
               '<rect x="%g" y="%g" width="%g" height="%g" fill="#3a3a40"/>%s</svg>'
               % (x, y, w, h, w*scale, h*scale, css, x, y, w, h, body))
        p = '%s/%s_%s_%d' % (OUT, kind, k, n)
        open(p + '.svg', 'w').write(doc)
        r = subprocess.run(['rsvg-convert', p + '.svg', '-o', p + '.png'],
                           capture_output=True, text=True)
        if r.returncode:
            print('  FAILED %s_%s_%d: %s' % (kind, k, n, r.stderr.strip()))
        else:
            made.append(p + '.png')

print('\n'.join('Rendered: ' + m for m in made))
print('Now READ those PNGs. Do not skip this step.')
PY
