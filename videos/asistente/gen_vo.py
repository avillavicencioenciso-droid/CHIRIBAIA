"""Voz en off con ElevenLabs, sincronizada con el video.
Uso:  ELEVENLABS_API_KEY=... python3 gen_vo.py [--only 1,3] [--dry]
Lee vo/script.json → un audio por escena (vo/cache/) con tiempos por palabra → vo/timing.js (duraciones de escena y subtítulos)
y audio/vo.wav (todas las escenas colocadas en su sitio, listo para build.sh). La clave solo se lee del entorno, nunca se guarda."""
import os, sys, json, base64, hashlib, subprocess, urllib.request, urllib.error
import numpy as np
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
cfg = json.load(open('vo/script.json')); SC = cfg['scenes']; SR = 44100
TR = [0, .8, .8, .8, .8, .8, .9, .8, .9]            # duración de la transición de entrada de cada escena (igual que video.js)
TAIL = [.3] * 8 + [1.4]; MIN = 4.5
only = {int(x) - 1 for x in sys.argv[sys.argv.index('--only') + 1].split(',')} if '--only' in sys.argv else None
os.makedirs('vo/cache', exist_ok=True)

def tts(i, text):
    key = hashlib.sha1(json.dumps([cfg['voice'], cfg['model'], text]).encode()).hexdigest()[:16]
    p = f'vo/cache/{i + 1:02d}-{key}.json'
    if os.path.exists(p): return json.load(open(p))
    if '--dry' in sys.argv: raise SystemExit(f'falta generar escena {i + 1}')
    k = os.environ['ELEVENLABS_API_KEY']
    body = {'text': text, 'model_id': cfg['model'],
            'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75, 'style': 0.15, 'use_speaker_boost': True, 'speed': 1.1},
            'previous_text': SC[i - 1] if i else None, 'next_text': SC[i + 1] if i + 1 < len(SC) else None}
    body = {a: b for a, b in body.items() if b is not None}
    rq = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{cfg['voice']}/with-timestamps?output_format=mp3_44100_128", json.dumps(body).encode(), {'xi-api-key': k, 'content-type': 'application/json'})
    try: r = json.load(urllib.request.urlopen(rq, timeout=120))
    except urllib.error.HTTPError as e: raise SystemExit(f'ElevenLabs {e.code}: {e.read().decode()[:400]}')
    json.dump(r, open(p, 'w')); return r

def decode(b64):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], input=base64.b64decode(b64), capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32)

def words(al):
    ch, a, b = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']; out = []; cur = ''; s = None
    for c, x, y in zip(ch, a, b):
        if c.isspace():
            if cur: out.append({'w': cur, 's': s, 'e': e}); cur = ''
        else:
            if not cur: s = x
            cur += c; e = y
    if cur: out.append({'w': cur, 's': s, 'e': e})
    return out

res = []
for i, t in enumerate(SC):
    if only is not None and i not in only and not os.path.exists(f'vo/cache'): continue
    r = tts(i, t); res.append((decode(r['audio_base64']), words(r.get('alignment') or r['normalized_alignment'])))
    print(f'escena {i + 1}: {len(res[-1][0]) / SR:.2f}s · {len(t)} caracteres')
LEAD = [.35] + [TR[i] * .75 + .1 for i in range(1, len(SC))]
dur = [max(MIN, LEAD[i] + len(res[i][0]) / SR + TAIL[i]) for i in range(len(SC))]
start = np.cumsum([0] + dur[:-1]); total = sum(dur)
mix = np.zeros(int((total + 1) * SR), np.float32); W = []; LOCAL = []
for i, (au, ws) in enumerate(res):
    off = start[i] + LEAD[i]; j = int(off * SR); mix[j:j + len(au)] += au
    LOCAL.append([{'w': w['w'], 's': round(LEAD[i] + w['s'], 3), 'e': round(LEAD[i] + w['e'], 3)} for w in ws])
    W += [{'w': w['w'], 's': round(off + w['s'], 3), 'e': round(off + w['e'], 3)} for w in ws]
import wave
with wave.open('audio/vo.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
open('vo/timing.js', 'w').write('// generado por gen_vo.py — no editar a mano\nexport const DUR = ' + json.dumps([round(x, 3) for x in dur]) + ';\nexport const WORDS = ' + json.dumps(W, ensure_ascii=False) + ';\nexport const LOCAL = ' + json.dumps(LOCAL, ensure_ascii=False) + ';\n')
print(f'TOTAL {total:.1f}s · voz: {cfg["voice_name"]}')
