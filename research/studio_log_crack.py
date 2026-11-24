#!/usr/bin/env python3
"""Recover Insta360 Studio's encrypted logs WITHOUT the key -- reused-keystream attack.

Container (measured 2026-11-24, Studio 6.0.9):
    file header 16 bytes cd013a985f5beca1bcc1ca036aa5d1a0
    then frames: [u32le length][bf08ac29][length bytes]

Every frame is enciphered with the SAME keystream -- the XOR of two frames is
mostly zeros over a long run -- i.e. a many-time pad:
        C_i[j] = P_i[j] XOR K[j]

So the key is not needed. With N frames there is one K byte per position, and log
text is ASCII, so K[j] is the byte that makes position j decode to plausible text
across all frames.

The catch, and why a plain "most printable" estimator stalls at ~87%: XOR by a
constant is a permutation, so a column's entropy cannot discriminate. When the
plaintext at a position is CONSTANT (every frame carries a digit or a bracket
there) all ~95 printable keys tie and the choice is arbitrary -- which is exactly
the garbled `[timestamp] [logger] [level] ` header. Only known plaintext fixes
it, so this tool takes a template:

    --template "[2026-11-24 17:##:##.###] [logger] [info] "
        # = digit, ? = word char, ~ = any printable, anything else literal

The line format is confirmed by the plain sibling logs, which share the logger:

    [2026-11-22 15:39:32.013] [basic_logger] [info] cur locale area: %s
    (log/detector/*/main_*.log and log/studio/*/*_launcher_*.log are PLAIN)

Usage:
    python research/studio_log_crack.py <logfile> [-o out.txt]
        [--template "[2026-11-24 17:##:##.###] [logger] [info] "]
        [--groups 2] [--show 20]
"""
import argparse
import collections
import datetime
import re
import string
import struct
import sys

MAGIC = bytes.fromhex("bf08ac29")
LINE_RE = re.compile(
    r"^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[[A-Za-z0-9_]+\] \[[a-z]+\] "
)

# Character prior for log text: relative log-likelihoods. The ordering matters,
# not the scale -- plausible characters must beat implausible ones when a
# position is ambiguous.
WEIGHT = {}
for _c in string.ascii_lowercase:
    WEIGHT[ord(_c)] = 2.6
for _c in string.ascii_uppercase:
    WEIGHT[ord(_c)] = 2.3
for _c in "etaoinshrdlu":
    WEIGHT[ord(_c)] = 3.0
for _c in string.digits:
    WEIGHT[ord(_c)] = 2.0
for _c in "012":
    WEIGHT[ord(_c)] = 2.2
WEIGHT[0x20] = 3.2
WEIGHT[0x0A] = 1.2
WEIGHT[0x0D] = 0.9
WEIGHT[0x09] = 0.9
for _c in ".,:;_-/\\=+[](){}'\"|<>*%#@!?$&^~`":
    WEIGHT[ord(_c)] = 1.0
for _c in range(32, 127):
    WEIGHT.setdefault(_c, 0.15)
for _c in range(256):
    WEIGHT.setdefault(_c, -6.0)
WEIGHT[0x00] = -9.0

WORD_CHARS = set(string.ascii_letters + string.digits + "_")


def parse_frames(data):
    frames, pos = [], 16
    while pos + 8 <= len(data):
        (length,) = struct.unpack_from("<I", data, pos)
        if data[pos + 4:pos + 8] != MAGIC:
            pos += 1
            continue
        payload = data[pos + 8:pos + 8 + length]
        if len(payload) != length:
            break
        frames.append(payload)
        pos += 8 + length
    return frames


def allowed_chars(spec):
    """Character set a template position permits."""
    if spec == "#":
        return set(ord(c) for c in string.digits)
    if spec == "?":
        return set(ord(c) for c in WORD_CHARS)
    if spec == "~":
        return set(range(0x20, 0x7F))
    return {ord(spec)}


def estimate(frames, length, template=""):
    """Per-position keystream byte, constrained by the template where given."""
    tspec = list(template)
    cols = [collections.Counter() for _ in range(length)]
    for f in frames:
        for j, b in enumerate(f[:length]):
            cols[j][b] += 1

    ks = bytearray(length)
    conf = []
    for j, hist in enumerate(cols):
        total = sum(hist.values())
        if total == 0:
            conf.append(0.0)
            continue
        allowed = allowed_chars(tspec[j]) if j < len(tspec) else set(range(0x20, 0x7F))
        best_k, best = None, None
        for k in range(256):
            score = 0.0
            for b, cnt in hist.items():
                c = b ^ k
                score += cnt * (WEIGHT[c] if c in allowed else -6.0)
            if best is None or score > best:
                best_k, best = k, score
        ks[j] = best_k
        conf.append(best / total)
    return bytes(ks), conf


def frame_fit(frame, ks):
    n = min(len(frame), len(ks))
    if n == 0:
        return -99.0
    return sum(WEIGHT[frame[j] ^ ks[j]] for j in range(n)) / n


def decode(frame, ks):
    return bytes(b ^ ks[j] for j, b in enumerate(frame[: len(ks)])).decode("utf-8", "replace")


def report(lines, label):
    """How many lines look like real log lines, and do the stamps run forward?"""
    matches = [ln for ln in lines if LINE_RE.match(ln)]
    print(f"  Gruppe {label}: {len(lines)} Zeilen, {len(matches)} mit erkanntem "
          f"Log-Kopfformat ({len(matches)/max(1,len(lines)):.1%})", file=sys.stderr)
    stamps = []
    for ln in matches:
        try:
            stamps.append(datetime.datetime.strptime(ln[1:24], "%Y-%m-%d %H:%M:%S.%f"))
        except ValueError:
            continue
    if len(stamps) > 2:
        back = sum(1 for a, b in zip(stamps, stamps[1:]) if b < a)
        print(f"    Zeitstempel {stamps[0].time()} .. {stamps[-1].time()}, "
              f"Rückschritte: {back}", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("logfile")
    ap.add_argument("-o", "--out")
    ap.add_argument("--template", default="")
    ap.add_argument("--groups", type=int, default=2)
    ap.add_argument("--show", type=int, default=20)
    args = ap.parse_args()

    frames = parse_frames(open(args.logfile, "rb").read())
    maxlen = max(len(f) for f in frames)
    print(f"{len(frames)} Frames, max. Payload {maxlen} Bytes", file=sys.stderr)
    if args.template:
        print(f"Template: {args.template!r}", file=sys.stderr)

    ks, _ = estimate(frames, maxlen, args.template)
    fits = [frame_fit(f, ks) for f in frames]

    order = sorted(range(len(frames)), key=lambda i: -fits[i])
    members = [order]
    if args.groups > 1:
        best_split, best_gap = len(order), -1.0
        for s in range(1, len(order)):
            gap = fits[order[s - 1]] - fits[order[s]]
            if gap > best_gap:
                best_gap, best_split = gap, s
        if best_gap > 0.05:
            members = [order[:best_split], order[best_split:]]
            print(f"Zwei-Keystream-Split bei Rang {best_split} "
                  f"(Sprung {best_gap:.2f})", file=sys.stderr)

    out = []
    for label, idxs in enumerate(members):
        if not idxs:
            continue
        ks_g, _c = estimate([frames[i] for i in idxs], maxlen, args.template)
        lines = [decode(frames[i], ks_g) for i in idxs]
        report(lines, label)
        out.append(f"########## Gruppe {label} ({len(idxs)} Frames) ##########")
        out.append("\n".join(lines))

    text = "\n".join(out)
    if args.out:
        with open(args.out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        print(f"geschrieben: {args.out}", file=sys.stderr)
    print("\n".join(out[: args.show]))


if __name__ == "__main__":
    main()
