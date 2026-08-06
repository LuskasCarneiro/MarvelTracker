#!/bin/bash
# Rasterise ANY inline-SVG artwork out of index.html so it can actually be LOOKED AT
# with the Read tool, instead of reasoned about blindly. This generalises the
# Iron-Man-specific tools/render_mask.sh (kept for history — see CLAUDE.md).
#
#   Usage: bash tools/render_art.sh PANEL_HTML ragnarok  [width] [bg]
#          bash tools/render_art.sh MASK_HTML  mjolnir   [width] [bg]
#
#   Output: /tmp/art_<TABLE>_<key>_<n>.png — one PNG per <svg> found in that
#           entry's markup, in source order, plus a combined montage
#           /tmp/art_<TABLE>_<key>.png when there is more than one.
#
# WHAT IT DOES AND DOES NOT SHOW YOU
#   - It renders the STATIC frame: everything inside `@media (prefers-reduced-motion
#     : no-preference)` and every @keyframes block is dropped. That is on purpose —
#     it is exactly the reduced-motion state the project requires to be complete on
#     its own, so this doubles as the reduced-motion check.
#   - There is no headless browser here. HTML decor (divs, gradients, ::before) is
#     NOT rendered — only the inline <svg> elements. CSS class rules are pulled from
#     index.html's stylesheet and flattened (a selector like `.panel-x .rg-ink` is
#     rewritten to `.rg-ink`) so fills/strokes declared in CSS actually apply.
#   - Cascade, stacking contexts and z-index between HTML layers still have to be
#     read by hand. This tool is for "is the drawing the shape I think it is".
set -e
cd "$(dirname "$0")/.."

TABLE="${1:-PANEL_HTML}"
KEY="${2:?usage: render_art.sh <PANEL_HTML|MASK_HTML> <key> [width] [bg]}"
WIDTH="${3:-900}"
BG="${4:-#101014}"

TABLE="$TABLE" KEY="$KEY" node > /tmp/art_markup.html << 'EOF'
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const table = process.env.TABLE, key = process.env.KEY;
// find `const <TABLE> = {` and take the balanced brace block after it
const at = html.indexOf('const ' + table + ' = {');
if (at < 0) { console.error('no such table: ' + table); process.exit(1); }
const from = html.indexOf('{', at);
let depth = 0, i = from;
for (; i < html.length; i++) {
  if (html[i] === '{') depth++;
  else if (html[i] === '}') { depth--; if (!depth) break; }
}
// MASK_HTML references MK_PHOTO (a base64 constant declared earlier); stub it so
// the eval works without dragging ~240KB of image into the extraction.
const MK_PHOTO = '';
const obj = eval('(' + html.slice(from, i + 1) + ')');
if (!(key in obj)) { console.error('no such key: ' + key + ' in ' + table); process.exit(1); }
process.stdout.write(obj[key]);
EOF

WIDTH="$WIDTH" BG="$BG" TABLE="$TABLE" KEY="$KEY" python3 << 'EOF'
import os, re, subprocess, html as htmlmod

width, bg = int(os.environ['WIDTH']), os.environ['BG']
table, key = os.environ['TABLE'], os.environ['KEY']
markup = open('/tmp/art_markup.html').read()
src = open('index.html').read()

# ---- 1. the stylesheet, minus every animation ----------------------------------
css = src[src.index('<style>') + 7 : src.index('</style>')]
# strip /* comments */ FIRST — they contain commas and braces-free prose that the
# selector flattener below would otherwise happily treat as part of a selector
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
# drop @keyframes / @media blocks wholesale (balanced braces)
out, i = [], 0
while i < len(css):
    if css.startswith('@', i):
        j = css.index('{', i); depth = 0; k = j
        while k < len(css):
            if css[k] == '{': depth += 1
            elif css[k] == '}':
                depth -= 1
                if not depth: break
            k += 1
        i = k + 1
        continue
    out.append(css[i]); i += 1
css = ''.join(out)

# flatten descendant selectors: `.panel-x .rg-ink, .a .b{...}` -> `.rg-ink,.b{...}`
def flatten(m):
    sel = m.group(1)
    parts = []
    for one in sel.split(','):
        one = one.strip()
        if not one: continue
        last = one.split()[-1]
        # `.foo svg{width:100%}` flattens to `svg{width:100%}`, which would size the
        # ROOT <svg> of the extracted document to a containing block that does not
        # exist and collapse it to nothing. Same for `*`. Drop those outright — they
        # are layout-in-the-page rules, meaningless for a standalone rasterisation.
        if last in ('svg', '*') or last.startswith('*'):
            continue
        parts.append(last)
    if not parts:
        return 'x-dropped-rule{'
    return ','.join(parts) + '{'
css = re.sub(r'([^{}]+)\{', flatten, css)

# librsvg 2.60 does NOT implement CSS custom properties: `fill:var(--x)` renders
# black, silently, which is what a dark artwork on a dark backdrop looks like when
# it is working. And the ancestor those properties are declared on (.note-inner /
# .av-layer / …) does not exist once the <svg> is pulled out alone anyway. So
# var() is substituted textually here, using the first declaration of each name.
vals = {}
for name, val in re.findall(r'(--[\w-]+)\s*:\s*([^;}]+)', css):
    vals.setdefault(name.strip(), val.strip())
def devar(m):
    name, _, fallback = m.group(1).partition(',')
    return vals.get(name.strip(), fallback.strip() or '#ff00ff')   # magenta = unresolved
for _ in range(4):                                   # values may themselves be var()
    new = re.sub(r'var\(\s*(--[^()]+?)\s*\)', devar, css)
    if new == css: break
    css = new

# ---- 2. every <svg> in the entry's markup --------------------------------------
svgs, pos = [], 0
while True:
    s = markup.find('<svg', pos)
    if s < 0: break
    depth, j = 0, s
    while j < len(markup):
        if markup.startswith('<svg', j): depth += 1; j += 4
        elif markup.startswith('</svg>', j):
            depth -= 1; j += 6
            if not depth: break
        else: j += 1
    svgs.append(markup[s:j]); pos = j

if not svgs:
    raise SystemExit('no <svg> in %s.%s — nothing to rasterise (HTML-only decor)' % (table, key))

made = []
for n, svg in enumerate(svgs, 1):
    m = re.search(r'viewBox="([^"]+)"', svg)
    vb = [float(x) for x in m.group(1).split()] if m else [0, 0, 300, 300]
    h = int(width * vb[3] / vb[2])
    # inject the flattened CSS + an opaque backdrop as the first children
    head_end = svg.index('>') + 1
    doc = (svg[:head_end].replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" '
           'xmlns:xlink="http://www.w3.org/1999/xlink"', 1)
           + '<style><![CDATA[' + css.replace(']]>', '') + ']]></style>'
           + '<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (vb[0], vb[1], vb[2], vb[3], bg)
           + svg[head_end:])
    p = '/tmp/art_%s_%s_%d' % (table, key, n)
    open(p + '.svg', 'w').write(doc)
    subprocess.run(['rsvg-convert', '-w', str(width), '-h', str(h), p + '.svg', '-o', p + '.png'], check=True)
    made.append(p + '.png')
    print('rendered', p + '.png')

if len(made) > 1:
    combo = '/tmp/art_%s_%s.png' % (table, key)
    subprocess.run(['montage', *made, '-tile', 'x1', '-geometry', '+8+8',
                    '-background', '#000', combo], check=True)
    print('montage  ', combo)
EOF
echo "Look at the PNG(s) with the Read tool. Do not claim the art works without doing that."
