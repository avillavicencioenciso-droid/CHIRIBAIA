"""Música instrumental generada por código (síntesis aditiva, sin IA generativa): pad suave + arpegio tipo piano + pulso ligero.
Uso: python3 music_gen.py audio/music.mp3 [segundos]   — 92 BPM, progresión Cmaj7 · Am7 · Fmaj7 · G6"""
import sys, subprocess, numpy as np
out = sys.argv[1] if len(sys.argv) > 1 else 'audio/music.mp3'; DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 86
SR = 44100; BPM = 92; beat = 60 / BPM; N = int(DUR * SR); rng = np.random.default_rng(7)
t_all = np.arange(N) / SR; mix = np.zeros(N)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [[48, 55, 59, 64], [45, 55, 60, 64], [41, 53, 57, 64], [43, 55, 59, 64]]      # voicings (MIDI)
ARP = [[72, 76, 79, 83], [72, 76, 79, 81], [72, 77, 81, 84], [71, 74, 79, 83]]
def add(sig, start):
    i = int(start * SR); j = min(N, i + len(sig))
    if i < N: mix[i:j] += sig[:j - i]
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr)); return e
bar = 4 * beat
for b in range(int(DUR / bar) + 1):
    c = CH[b % 4]; t0 = b * bar
    # pad
    n = int((bar + 0.6) * SR); tt = np.arange(n) / SR; pad = np.zeros(n)
    for m in c:
        for d in (-0.15, 0.15): pad += np.sin(2 * np.pi * (hz(m) * (1 + d / 100)) * tt) * 0.5 + np.sin(2 * np.pi * hz(m) * 2 * tt) * 0.08
    add(pad * env(n, 0.5, 0.6) * 0.045, t0)
    # bajo
    n = int(bar * SR); tt = np.arange(n) / SR; add(np.sin(2 * np.pi * hz(c[0] - 12) * tt) * env(n, 0.02, 0.5) * 0.10, t0)
    # arpegio (corcheas)
    for k in range(8):
        m = ARP[b % 4][[0, 1, 2, 3, 2, 1, 2, 1][k]]; n = int(1.1 * SR); tt = np.arange(n) / SR
        pl = (np.sin(2 * np.pi * hz(m) * tt) + 0.35 * np.sin(2 * np.pi * hz(m) * 2 * tt) + 0.12 * np.sin(2 * np.pi * hz(m) * 3 * tt)) * np.exp(-tt * 3.2)
        add(pl * 0.075 * (0.6 + 0.4 * (k % 2 == 0)), t0 + k * beat / 2)
    # pulso suave y shaker
    for k in range(4):
        n = int(0.35 * SR); tt = np.arange(n) / SR; add(np.sin(2 * np.pi * 52 * tt * (1 + 0.6 * np.exp(-tt * 30))) * np.exp(-tt * 9) * 0.16 * (k % 2 == 0), t0 + k * beat)
        n = int(0.08 * SR); nz = rng.standard_normal(n); nz = np.convolve(nz, [1, -1], 'same'); add(nz * np.exp(-np.arange(n) / SR * 60) * 0.018, t0 + k * beat + beat / 2)
# eco sutil y normalización
d = int(0.28 * SR); echo = np.zeros(N); echo[d:] = mix[:-d] * 0.28; mix += echo
mix *= env(N, 2.0, 4.0); mix = np.tanh(mix * 1.4) / 1.4; mix /= np.abs(mix).max() / 0.7
pcm = (mix * 32767).astype('<i2').tobytes()
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2', '-b:a', '192k', out], input=pcm, check=True)
print('OK', out)
