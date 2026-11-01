#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
tools/audio.py — 全片声音（纯程式合成，无任何外部素材）
  * 每 2 秒一句，用“该年代的乐器”演奏同一个两音动机；序与后记是钟声
  * 每个接缝：一声低鼓 + 一层 whoosh + 一点轻响
  * 底下铺一条 drone，结尾在 73 秒起一个解决和弦
输出：out/audio/music.wav  out/audio/mix.wav
"""
import os, sys, math, json, wave
import numpy as np

SR = 48000
DUR = 82.0
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out', 'audio')
os.makedirs(OUT, exist_ok=True)

# ---------------- timeline ----------------
SCENES = [
    ('prologue', 0.0, 5.0), ('cave', 5.0, 11.0), ('egypt', 11.0, 17.0),
    ('greece', 17.0, 23.0), ('pompeii', 23.0, 27.0), ('song', 27.0, 31.0),
    ('medieval', 31.0, 35.0), ('supper', 35.0, 39.0), ('ukiyo', 39.0, 43.0),
    ('starry', 43.0, 47.0), ('dali', 47.0, 51.0), ('popart', 51.0, 55.0),
    ('synth', 55.0, 59.0), ('pixel', 59.0, 63.0), ('winxp', 63.0, 67.0),
    ('tiktok', 67.0, 73.0), ('epilogue', 73.0, 82.0),
]
SEAMS = [5.0, 11.0, 17.0, 23.0, 27.0, 31.0, 35.0, 39.0, 43.0, 47.0,
         51.0, 55.0, 59.0, 63.0, 67.0, 73.0]

def scene_at(t):
    for sid, a, b in SCENES:
        if a <= t < b:
            return sid, a, b
    return SCENES[-1][0], SCENES[-1][1], SCENES[-1][2]

# ---------------- small DSP toolbox ----------------
def env_adsr(n, a=0.005, d=0.1, s=0.7, r=0.2):
    t = np.arange(n) / SR
    out = np.zeros(n)
    A = min(int(a * SR), n)
    D = min(int(d * SR), max(0, n - A))
    R = min(int(r * SR), max(0, n - A - D))
    S = max(0, n - A - D - R)
    i = 0
    if A:
        out[i:i+A] = np.linspace(0, 1, A); i += A
    if D:
        out[i:i+D] = np.linspace(1, s, D); i += D
    if S:
        out[i:i+S] = s; i += S
    if R and i < n:
        out[i:n] = np.linspace(s, 0, n - i)
    return out

def sine(f, n, ph=0.0):
    return np.sin(2 * np.pi * f * np.arange(n) / SR + ph)

def saw(f, n, ph=0.0):
    x = (f * np.arange(n) / SR + ph) % 1.0
    return 2 * x - 1

def square(f, n, duty=0.5, ph=0.0):
    x = (f * np.arange(n) / SR + ph) % 1.0
    return np.where(x < duty, 1.0, -1.0)

def noise(n):
    return np.random.default_rng(7).standard_normal(n)

def lowpass(x, cutoff):
    # one pole
    a = math.exp(-2 * math.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(0, len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y

def lowpass_fast(x, cutoff, passes=2):
    # FFT brick-ish smoothing (cheap and good enough)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1.0 / SR)
    X[f > cutoff] = 0
    y = np.fft.irfft(X, len(x))
    for _ in range(passes - 1):
        X = np.fft.rfft(y); X[f > cutoff] = 0; y = np.fft.irfft(X, len(x))
    return y

def highpass(x, cutoff):
    return x - lowpass_fast(x, cutoff)

def bandpass(x, lo, hi):
    return lowpass_fast(x, hi) - lowpass_fast(x, lo)

def fft_convolve(x, ir):
    """overlap-add convolution"""
    n = len(x); m = len(ir)
    if m > 8192:
        ir = ir[:8192]; m = len(ir)
    nfft = 1
    while nfft < m * 2:
        nfft *= 2
    H = np.fft.rfft(ir, nfft)
    out = np.zeros(n + m)
    step = nfft - m + 1
    for s in range(0, n, step):
        seg = x[s:s + nfft]
        if len(seg) == 0:
            break
        buf = np.zeros(nfft)
        buf[:len(seg)] = seg
        y = np.fft.irfft(np.fft.rfft(buf) * H, nfft)
        take = min(len(y), len(out) - s)
        if take <= 0:
            break
        out[s:s + take] += y[:take]
    return out[:n]

def make_ir(sec, decay=3.0, seed=1, predelay=0.0):
    n = int(sec * SR)
    ir = np.random.default_rng(seed).standard_normal(n) * np.exp(-decay * np.arange(n) / SR)
    d = int(predelay * SR)
    if d:
        ir = np.concatenate([np.zeros(d), ir])
    ir[0] += 1.0
    return ir

def delay_line(x, ms, feedback=0.3, mix=0.3, taps=4):
    d = int(SR * ms / 1000)
    out = x.copy()
    buf = x.copy()
    g = feedback
    for k in range(taps):
        buf = np.concatenate([np.zeros(d), buf])[:len(x)]
        out += g * buf
        g *= feedback
    return out * (1 - mix) + out * mix

def bitcrush(x, bits):
    q = 2 ** bits
    return np.round(x * q) / q

def drive(x, k=2.0):
    return np.tanh(x * k)

def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf) - i, len(sig))
    buf[i:i + j] += sig[:j] * gain

def karplus(freq, n, damp=0.996, seed=3, bright=0.5):
    N = max(2, int(SR / freq))
    rng = np.random.default_rng(seed)
    buf = rng.standard_normal(N)
    buf = lowpass_fast(buf, max(freq * 4, 400))
    buf = buf / (np.max(np.abs(buf)) + 1e-9)
    buf = buf * (0.4 + 0.6 * bright)
    out = np.zeros(n)
    idx = 0
    for i in range(n):
        v = buf[idx]
        nxt = buf[(idx + 1) % N]
        out[i] = v
        buf[idx] = (v + nxt) * 0.5 * damp
        idx = (idx + 1) % N
    return out

# ---------------- motif ----------------
# The two-note motif: a rising whole step that resolves down — "six ... seven"
ROOT_HZ = 196.0                     # G3
SIX_HZ = ROOT_HZ * (2 ** (6 / 12))  # tritone up  -> "six"
SEVEN_HZ = ROOT_HZ * (2 ** (7 / 12)) # fifth up      -> "seven"
MOTIF = [(0.0, SIX_HZ, 0.42), (0.5, SEVEN_HZ, 0.42)]

def instruments(scene, t0, t1, bar):
    """returns a mono buffer for one bar of the motif on the era instrument"""
    dur = 2.0
    n = int(dur * SR)
    b = np.zeros(n)
    s = scene
    def tone(f, start, length, kind, amp=1.0, **kw):
        nn = int(length * SR)
        if kind == 'sine':
            x = sine(f, nn)
        elif kind == 'saw':
            x = saw(f, nn)
        elif kind == 'square':
            x = square(f, nn, kw.get('duty', 0.5))
        elif kind == 'pluck':
            x = karplus(f, nn, kw.get('damp', 0.996), seed=int(f * 7) % 97, bright=kw.get('bright', 0.5))
        else:
            x = sine(f, nn)
        e = env_adsr(nn, kw.get('a', 0.004), kw.get('d', 0.08), kw.get('s', 0.55), kw.get('r', 0.25))
        place(b, x * e, start, amp)
        return x * e

    if s == 'cave':
        # frame drum + bone flute
        for (st, f, ln) in MOTIF:
            nn = int(0.35 * SR)
            k = sine(np.linspace(120, 55, nn), nn) * np.exp(-np.arange(nn) / (0.07 * SR))
            place(b, k, st, 0.9)
            fl = sine(f * 2, int(0.9 * SR), ) * env_adsr(int(0.9 * SR), 0.05, 0.1, 0.7, 0.3)
            fl += 0.35 * sine(f * 3, int(0.9 * SR)) * env_adsr(int(0.9 * SR), 0.06, 0.1, 0.6, 0.3)
            place(b, fl, st, 0.35)
    elif s == 'egypt':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln, 'pluck', 0.8, damp=0.997, bright=0.75, a=0.002, d=0.4, s=0.35, r=0.5)
        tone(ROOT_HZ * 0.5, 0.0, 2.0, 'sine', 0.25, a=0.05, d=0.3, s=0.7, r=0.6)
    elif s == 'greece':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln, 'pluck', 0.85, damp=0.995, bright=0.9, a=0.002, d=0.35, s=0.4, r=0.45)
            tone(f * 2, st, ln * 0.6, 'pluck', 0.25, damp=0.99, bright=0.95)
    elif s == 'pompeii':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 0.8, 'saw', 0.35, a=0.06, d=0.12, s=0.6, r=0.25)
            nn = int(0.18 * SR)
            place(b, noise(nn) * np.exp(-np.arange(nn) / (0.03 * SR)) * 0.5, st, 0.4)
    elif s == 'song':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 1.2, 'pluck', 0.8, damp=0.9985, bright=0.35, a=0.004, d=0.6, s=0.25, r=0.8)
        tone(ROOT_HZ * 0.5, 0.0, 2.0, 'pluck', 0.22, damp=0.999, bright=0.25, a=0.02, d=0.8, s=0.2, r=0.9)
    elif s == 'medieval':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 1.1, 'square', 0.16, duty=0.42, a=0.02, d=0.2, s=0.7, r=0.3)
            tone(f * 2, st, ln * 1.1, 'square', 0.12, duty=0.5, a=0.03, d=0.2, s=0.6, r=0.3)
            tone(f * 3, st, ln, 'sine', 0.1, a=0.03, d=0.2, s=0.5, r=0.3)
    elif s == 'supper':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 1.0, 'pluck', 0.7, damp=0.9965, bright=0.7, a=0.003, d=0.4, s=0.4, r=0.4)
        tone(ROOT_HZ * 0.5, 0.0, 2.0, 'pluck', 0.25, damp=0.998, bright=0.5)
    elif s == 'ukiyo':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 0.9, 'saw', 0.35, a=0.002, d=0.2, s=0.4, r=0.3)
        nn = int(0.12 * SR)
        place(b, noise(nn) * np.exp(-np.arange(nn) / (0.025 * SR)) * 0.45, 0.0, 0.5)
        place(b, noise(nn) * np.exp(-np.arange(nn) / (0.02 * SR)) * 0.3, 1.0, 0.4)
    elif s == 'starry':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 1.4, 'sine', 0.55, a=0.08, d=0.3, s=0.55, r=0.5)
            tone(f * 2.001, st, ln * 1.4, 'sine', 0.2, a=0.12, d=0.3, s=0.5, r=0.5)
        tone(ROOT_HZ * 0.5, 0.0, 2.0, 'sine', 0.2, a=0.2, d=0.4, s=0.6, r=0.6)
    elif s == 'dali':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 1.6, 'sine', 0.5, a=0.002, d=0.5, s=0.3, r=0.8)
            tone(f * 3.01, st, ln * 1.2, 'sine', 0.12, a=0.002, d=0.4, s=0.2, r=0.8)
    elif s == 'popart':
        # pop beat: kick / snare / hat + square lead
        for st in (0.0, 1.0):
            nn = int(0.25 * SR)
            k = sine(np.linspace(150, 50, nn), nn) * np.exp(-np.arange(nn) / (0.05 * SR))
            place(b, k, st, 0.9)
        for st in (0.5, 1.5):
            nn = int(0.18 * SR)
            place(b, noise(nn) * np.exp(-np.arange(nn) / (0.035 * SR)), st, 0.45)
        for st in (0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75):
            nn = int(0.05 * SR)
            place(b, highpass(noise(nn), 6000) * np.exp(-np.arange(nn) / (0.008 * SR)), st, 0.18)
        for (st, f, ln) in MOTIF:
            tone(f, st, ln, 'square', 0.22, duty=0.5, a=0.005, d=0.1, s=0.7, r=0.2)
    elif s == 'synth':
        for (st, f, ln) in MOTIF:
            tone(f * 0.5, st, ln, 'saw', 0.45, a=0.01, d=0.1, s=0.7, r=0.2)
            tone(f * 2, st, ln * 0.6, 'square', 0.14, duty=0.25, a=0.005, d=0.1, s=0.5, r=0.25)
        for i in range(8):
            f = ROOT_HZ * (2 ** ([0, 3, 7, 10, 12, 10, 7, 3][i] / 12))
            nn = int(0.2 * SR)
            place(b, square(f, nn, 0.25) * env_adsr(nn, 0.003, 0.08, 0.4, 0.1), i * 0.25, 0.12)
    elif s == 'pixel':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 0.8, 'square', 0.3, duty=0.5, a=0.001, d=0.05, s=0.85, r=0.05)
        for st in (0.0, 1.0):
            nn = int(0.12 * SR)
            k = square(np.linspace(200, 60, nn), nn) * np.exp(-np.arange(nn) / (0.03 * SR))
            place(b, k, st, 0.6)
    elif s == 'winxp':
        for (st, f, ln) in MOTIF:
            tone(f * 2, st, ln, 'sine', 0.4, a=0.003, d=0.2, s=0.5, r=0.3)
            tone(f * 3, st + 0.06, ln * 0.8, 'sine', 0.2, a=0.003, d=0.2, s=0.5, r=0.3)
    elif s == 'tiktok':
        for (st, f, ln) in MOTIF:
            tone(f * 0.5, st, ln, 'square', 0.5, duty=0.5, a=0.002, d=0.1, s=0.8, r=0.15)
            tone(f, st + 0.02, ln * 0.7, 'saw', 0.15, a=0.002, d=0.1, s=0.6, r=0.2)
        for i in range(8):
            nn = int(0.04 * SR)
            place(b, highpass(noise(nn), 7000) * np.exp(-np.arange(nn) / (0.006 * SR)), i * 0.25, 0.2)
    elif s == 'opening':
        for (st, f, ln) in MOTIF:
            tone(f * 0.5, st, ln * 0.8, 'sine', 0.45, a=0.01, d=0.3, s=0.4, r=0.6)
    elif s == 'ending':
        for (st, f, ln) in MOTIF:
            tone(f, st, ln * 1.2, 'pluck', 0.6, damp=0.9975, bright=0.6, a=0.003, d=0.4, s=0.4, r=0.5)
            tone(f * 1.5, st, ln * 1.2, 'pluck', 0.2, damp=0.997, bright=0.8)
        tone(ROOT_HZ * 0.5, 0.0, 2.0, 'pluck', 0.3, damp=0.999, bright=0.4)
    return b

def pad_layer(n):
    """a slow drone that runs under the whole scroll and opens as it goes"""
    t = np.arange(n) / SR
    out = np.zeros(n)
    for i, f in enumerate([98.0, 146.83, 196.0, 246.94, 293.66]):
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (0.031 + i * 0.009) * t + i * 1.7)
        amp = (0.32 / (i + 1)) * (0.30 + 0.70 * lfo)
        out += amp * np.sin(2 * np.pi * f * t + 0.4 * i)
        out += 0.30 * amp * np.sin(2 * np.pi * f * 2.002 * t + 0.2 * i)
    out += 0.10 * np.sin(2 * np.pi * 49.0 * t)
    swell = 0.35 + 0.65 * np.minimum(1.0, t / 14.0)
    out = out * swell
    return lowpass_fast(out, 900)

def bell(f, dur=2.6, amp=1.0):
    nn = int(dur * SR)
    t = np.arange(nn) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.4)
    x += 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4.5)
    x += 0.22 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 7.0)
    return x * amp

def build_music():
    n = int(DUR * SR)
    buf = np.zeros(n)
    t = 0.0
    while t < DUR - 0.1:
        sid = scene_at(t + 0.5)[0]
        if sid in ('prologue', 'epilogue'):
            place(buf, bell(146.83, 3.2, 0.30), t, 1.0)
            place(buf, bell(220.00, 2.6, 0.16), t + 0.5, 1.0)
        else:
            place(buf, instruments(sid, t, t + 2.0, t), t, 1.0)
        t += 2.0
    buf += pad_layer(n) * 0.42
    # every join between two mounted sheets: a low thump and a silk whoosh
    for at in SEAMS:
        nn = int(0.30 * SR)
        th = sine(np.linspace(96, 44, nn), nn) * np.exp(-np.arange(nn) / (0.055 * SR))
        place(buf, th * 0.55, at - 0.30, 1.0)
        wn = int(1.05 * SR)
        k = np.arange(wn) / wn
        w = noise(wn) * np.sin(np.pi * k) ** 2
        w = bandpass(w, 700, 6800)
        place(buf, w * 0.34, at - 0.55, 1.0)
        nn2 = int(0.05 * SR)
        tk = sine(2600, nn2) * np.exp(-np.arange(nn2) / (0.010 * SR))
        place(buf, tk * 0.16, at - 0.02, 1.0)
    # the last sheet: a resolving chord under the colophon
    for f, a in [(98.0, 0.42), (146.83, 0.30), (196.0, 0.22), (246.94, 0.16)]:
        place(buf, bell(f, 6.5, a), 73.0, 1.0)
    return buf

def write_wav(path, x, sr=SR):
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())

def norm(x, peak=0.45):
    m = np.max(np.abs(x))
    return x / (m + 1e-9) * peak if m > 0 else x

def main():
    music = build_music()
    music = fft_convolve(music, make_ir(1.8, 3.6, 5))
    music = norm(music, 0.92)
    n = len(music)
    t = np.arange(n) / SR
    fade = np.clip((DUR - 0.15 - t) / 2.2, 0, 1) * np.clip(t / 0.5, 0, 1)
    music = np.tanh(music * 1.15) * fade
    music = norm(music, 0.89)
    write_wav(os.path.join(OUT, 'mix.wav'), music)
    write_wav(os.path.join(OUT, 'music.wav'), music)
    print('mix.wav done (%.1f s)' % (n / SR))

if __name__ == '__main__':
    main()
