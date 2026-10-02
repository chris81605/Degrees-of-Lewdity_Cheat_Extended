#!/usr/bin/env python3
import json
import sys
from pathlib import Path

if len(sys.argv) != 4:
    print('Usage: python build_from_opencc.py TSCharacters.txt TSPhrases.txt CE_langDict.js')
    raise SystemExit(2)

chars_path = Path(sys.argv[1])
phrases_path = Path(sys.argv[2])
out_path = Path(sys.argv[3])

def read_opencc(path):
    out = {}
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '\t' not in line:
            continue
        src, dsts = line.split('\t', 1)
        dst = dsts.split()[0]
        out[src] = dst
    return out

chars = read_opencc(chars_path)
phrases = read_opencc(phrases_path)

js = []
js.append('/* Generated from OpenCC TSCharacters.txt + TSPhrases.txt */')
js.append('(function () {')
js.append('\t"use strict";')
js.append('\twindow.CE_T2S_PHRASES = Object.assign(Object.create(null), ' + json.dumps(phrases, ensure_ascii=False, separators=(',', ':')) + ');')
js.append('\twindow.CE_T2S_DICT = Object.assign(Object.create(null), ' + json.dumps(chars, ensure_ascii=False, separators=(',', ':')) + ');')
js.append('})();')
out_path.write_text('\n'.join(js) + '\n', encoding='utf-8')
print(f'Generated {out_path}: {len(chars)} chars, {len(phrases)} phrases')
