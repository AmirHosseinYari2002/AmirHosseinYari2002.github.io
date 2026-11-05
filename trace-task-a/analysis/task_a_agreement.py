#!/usr/bin/env python3
"""Task A agreement: human-human and AI-human agreement on segment boundaries.

Usage
-----
  python3 task_a_agreement.py \
      --bundle /path/to/frozen-pilot-v2 \
      --annotations task-a_annotations_2026-11-20.json [more.json ...] \
      --out results/

Inputs
  --bundle       the frozen pilot folder (gives the trace text and the LLM segmentation,
                 deepseek-pilot/results/{trajectories,segments}.jsonl). The LLM boundaries
                 are read here, never from the website, so annotators cannot see them.
  --annotations  one or more JSON files: the researcher export (admin.html) and/or
                 annotator backups ("Download a backup of my work"). Duplicates are merged
                 (submitted beats draft, newer beats older).

Unit of analysis
  Every word start (start of a whitespace-delimited token) except the first word of a trace
  is a candidate boundary ("gap"). Each coder assigns 0/1 to every gap. The website only
  allows CUTs at word starts and every LLM boundary also falls on a word start, so human and
  AI segmentations live on exactly the same candidate set.

Metrics (pooled over traces and per trace)
  Multi-coder  : Krippendorff's alpha (nominal) and Fleiss' kappa, humans only and humans + AI.
  Pairwise     : Cohen's kappa, positive agreement / boundary F1 (exact and within +-1, +-2 words,
                 one-to-one matching), Pk and WindowDiff (lower = better; k = half the mean
                 segment length of the pair, in words), and Boundary Similarity B if `segeval`
                 is installed.
  AI vs humans : AI vs each human, AI vs the human majority vote, mean AI-human vs mean
                 human-human kappa (block-bootstrap 95% CI of the difference), and a
                 leave-one-out test: for every human h, kappa(h, majority of the other humans)
                 vs kappa(AI, same majority).

Only the Python standard library is required.
"""
import argparse, csv, hashlib, itertools, json, math, os, random, re, statistics, sys
from collections import defaultdict

EOS = "<｜end▁of▁sentence｜>"
AI = "AI"


# ---------------------------------------------------------------- loading
def utf16_to_cp(text):
    """Map UTF-16 offsets (browser) to code-point offsets (Python). Identity for BMP-only text."""
    if all(ord(c) <= 0xFFFF for c in text):
        return None
    m, u = {}, 0
    for i, c in enumerate(text):
        m[u] = i
        u += 2 if ord(c) > 0xFFFF else 1
    m[u] = len(text)
    return m


def load_bundle(root):
    res = os.path.join(root, "deepseek-pilot", "results")
    traces = {}
    with open(os.path.join(res, "trajectories.jsonl"), encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            t = r["completion_text"]
            if t.endswith(EOS):
                t = t[: -len(EOS)]
            traces[r["trace_id"]] = t
    ai = defaultdict(set)
    with open(os.path.join(res, "segments.jsonl"), encoding="utf-8") as f:
        for line in f:
            s = json.loads(line)
            ai[s["trace_id"]].add(int(s["char_start"]))
    return traces, ai


def load_annotations(paths, include_drafts):
    best = {}
    rank = {"submitted": 3, "reopened": 1, "draft": 1}
    for p in paths:
        with open(p, encoding="utf-8") as f:
            d = json.load(f)
        for a in d.get("annotations", []):
            if not include_drafts and a.get("status") != "submitted":
                continue
            k = (str(a["annotator_id"]).lower(), a["trace_id"])
            score = (rank.get(a.get("status"), 0), str(a.get("server_updated") or a.get("client_updated") or ""))
            if k not in best or score > best[k][0]:
                best[k] = (score, a)
    return {k: v[1] for k, v in best.items()}


# ---------------------------------------------------------------- units
class TraceUnits:
    def __init__(self, tid, text, section):
        self.tid, self.text = tid, text
        starts = [m.start() for m in re.finditer(r"\S+", text)]
        end = len(text)
        if section == "reasoning" and "</think>" in text:
            end = text.index("</think>")
        self.word_starts = [s for s in starts if s < end]
        self.n_words = len(self.word_starts)
        self.gaps = self.word_starts[1:]  # candidate boundary positions
        self.index = {p: i for i, p in enumerate(self.gaps)}
        self.sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    def snap(self, pos):
        """Snap a char offset to the next word start (AI segments start at the preceding space)."""
        t = self.text
        while pos < len(t) and t[pos].isspace():
            pos += 1
        return pos

    def vector(self, positions):
        v = [0] * len(self.gaps)
        bad = 0
        for p in positions:
            i = self.index.get(p)
            if i is None:
                bad += 1
            else:
                v[i] = 1
        return v, bad

    def context(self, pos, n=6):
        i = self.word_starts.index(pos) if pos in set(self.word_starts) else None
        if i is None:
            return ""
        ws = re.findall(r"\S+", self.text)
        return " ".join(ws[max(0, i - n):i]) + " ‖ " + " ".join(ws[i:i + n])


# ---------------------------------------------------------------- metrics
def table(a, b):
    n11 = n10 = n01 = n00 = 0
    for x, y in zip(a, b):
        if x and y: n11 += 1
        elif x: n10 += 1
        elif y: n01 += 1
        else: n00 += 1
    return n11, n10, n01, n00


def kappa_from(t):
    n11, n10, n01, n00 = t
    n = n11 + n10 + n01 + n00
    if n == 0:
        return float("nan")
    po = (n11 + n00) / n
    pa, pb = (n11 + n10) / n, (n11 + n01) / n
    pe = pa * pb + (1 - pa) * (1 - pb)
    return float("nan") if pe == 1 else (po - pe) / (1 - pe)


def f1_from(t):
    n11, n10, n01, _ = t
    d = 2 * n11 + n10 + n01
    return float("nan") if d == 0 else 2 * n11 / d


def tolerant_f1(a, b, tol):
    """One-to-one matching of boundaries within +-tol gap units (greedy by distance)."""
    A = [i for i, x in enumerate(a) if x]
    B = [i for i, x in enumerate(b) if x]
    if not A and not B:
        return float("nan")
    pairs = sorted((abs(i - j), i, j) for i in A for j in B[bisect_left(B, i - tol):bisect_right(B, i + tol)])
    ua, ub, m = set(), set(), 0
    for _, i, j in pairs:
        if i not in ua and j not in ub:
            ua.add(i); ub.add(j); m += 1
    return 2 * m / (len(A) + len(B))


from bisect import bisect_left, bisect_right


def word_bounds(v):
    """gap vector -> boundary-before-word vector over words (index 0 = first word, never a boundary)."""
    return [0] + list(v)


def pk_wd(ref, hyp, k=None):
    r, h = word_bounds(ref), word_bounds(hyp)
    n = len(r)
    if k is None:
        segs = (sum(r) + 1 + sum(h) + 1) / 2
        k = max(2, int(round(n / segs / 2)))
    if n <= k:
        return float("nan"), float("nan"), k
    pr, ph = [0], [0]
    for x in r: pr.append(pr[-1] + x)
    for x in h: ph.append(ph[-1] + x)
    pk_err = wd_err = 0
    m = n - k
    for i in range(m):
        cr = pr[i + k + 1] - pr[i + 1]  # boundaries before words i+1..i+k
        ch = ph[i + k + 1] - ph[i + 1]
        pk_err += (cr > 0) != (ch > 0)
        wd_err += cr != ch
    return pk_err / m, wd_err / m, k


def fleiss(vectors):
    coders = len(vectors)
    n = len(vectors[0])
    if coders < 2 or n == 0:
        return float("nan")
    P, p1 = 0.0, 0
    for i in range(n):
        c1 = sum(v[i] for v in vectors)
        c0 = coders - c1
        p1 += c1
        P += (c1 * (c1 - 1) + c0 * (c0 - 1)) / (coders * (coders - 1))
    P /= n
    pj = p1 / (n * coders)
    pe = pj ** 2 + (1 - pj) ** 2
    return float("nan") if pe == 1 else (P - pe) / (1 - pe)


def kripp_alpha(vectors):
    """Nominal Krippendorff's alpha, binary values, no missing data."""
    coders = len(vectors)
    n = len(vectors[0])
    if coders < 2 or n == 0:
        return float("nan")
    o01 = 0.0
    n1 = 0
    for i in range(n):
        c1 = sum(v[i] for v in vectors)
        c0 = coders - c1
        o01 += 2 * c1 * c0 / (coders - 1)
        n1 += c1
    N = n * coders
    n0 = N - n1
    do = o01 / N
    de = 2 * n0 * n1 / (N * (N - 1))
    return float("nan") if de == 0 else 1 - do / de


def majority(vectors, strict=False):
    m = len(vectors)
    out = []
    for i in range(len(vectors[0])):
        s = sum(v[i] for v in vectors)
        out.append(1 if (s * 2 > m if strict else s * 2 >= m) else 0)
    return out


def try_segeval(a, b):
    try:
        import segeval  # optional
    except Exception:
        return float("nan")
    def masses(v):
        sizes, cur = [], 1
        for x in v:
            if x: sizes.append(cur); cur = 1
            else: cur += 1
        sizes.append(cur)
        return sizes
    try:
        return float(segeval.boundary_similarity(masses(a), masses(b)))
    except Exception:
        return float("nan")


def fmt(x, d=3):
    return "—" if x is None or (isinstance(x, float) and math.isnan(x)) else ("%.*f" % (d, x))


def mean(xs):
    xs = [x for x in xs if not (isinstance(x, float) and math.isnan(x))]
    return statistics.mean(xs) if xs else float("nan")


# ---------------------------------------------------------------- bootstrap
def block_tables(vecs, pairs, block):
    """Per block, the 2x2 table of every pair. vecs: list over traces of {coder: vector}."""
    blocks = []
    for tv in vecs:
        n = len(next(iter(tv.values())))
        for s in range(0, n, block):
            blocks.append({p: table(tv[p[0]][s:s + block], tv[p[1]][s:s + block]) for p in pairs})
    return blocks


def boot_ci(blocks, stat, reps, seed):
    rnd = random.Random(seed)
    vals = []
    for _ in range(reps):
        sample = [blocks[rnd.randrange(len(blocks))] for _ in blocks]
        vals.append(stat(sample))
    vals = sorted(v for v in vals if not math.isnan(v))
    if not vals:
        return float("nan"), float("nan")
    lo = vals[int(0.025 * (len(vals) - 1))]
    hi = vals[int(0.975 * (len(vals) - 1))]
    return lo, hi


def summed(sample, p):
    t = [0, 0, 0, 0]
    for b in sample:
        for i, x in enumerate(b[p]):
            t[i] += x
    return t


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--bundle", required=True)
    ap.add_argument("--annotations", nargs="+", required=True)
    ap.add_argument("--out", default="task_a_results")
    ap.add_argument("--include-drafts", action="store_true", help="also use unsubmitted drafts")
    ap.add_argument("--section", choices=["all", "reasoning"], default="all",
                    help="'reasoning' = only the text before </think>")
    ap.add_argument("--exclude", nargs="*", default=[], help="annotator IDs to leave out")
    ap.add_argument("--block", type=int, default=200, help="bootstrap block size in gaps")
    ap.add_argument("--reps", type=int, default=2000)
    ap.add_argument("--seed", type=int, default=20261105)
    args = ap.parse_args()

    texts, ai_starts = load_bundle(args.bundle)
    ann = load_annotations(args.annotations, args.include_drafts)
    exclude = {e.lower() for e in args.exclude}
    os.makedirs(args.out, exist_ok=True)
    warnings = []

    trace_ids = sorted({tid for (_, tid) in ann} & set(texts), key=lambda t: len(texts[t]))
    humans_all = sorted({a for (a, _) in ann if a not in exclude})
    units, vecs, flags_rows = {}, [], []
    complete = []  # traces where every included human has an annotation
    for tid in trace_ids:
        U = TraceUnits(tid, texts[tid], args.section)
        units[tid] = U
        cp = utf16_to_cp(texts[tid])
        tv = {}
        ai_pos = {U.snap(p) for p in ai_starts.get(tid, ()) if p > 0}
        tv[AI], bad = U.vector(ai_pos)
        for h in humans_all:
            a = ann.get((h, tid))
            if not a:
                continue
            if a.get("text_sha256") and a["text_sha256"] != U.sha:
                warnings.append("%s/%s: text hash differs from the bundle — offsets may be wrong" % (h, tid))
            cuts = [cp[c] if cp else c for c in a.get("cuts", [])]
            if args.section == "reasoning":
                cuts = [c for c in cuts if c in U.index]
            tv[h], bad = U.vector(cuts)
            if bad:
                warnings.append("%s/%s: %d CUT(s) not at a word start were ignored" % (h, tid, bad))
            for fl in a.get("flags", []):
                pos = cp[fl["pos"]] if cp else fl["pos"]
                i = U.index.get(pos)
                flags_rows.append({
                    "trace_id": tid, "annotator_id": h, "char_pos": pos, "gap_index": "" if i is None else i,
                    "annotator_cut_here": "" if i is None else tv[h][i],
                    "ai_cut_here": "" if i is None else tv[AI][i],
                    "other_humans_cut_here": "",
                    "context": U.context(pos), "note": fl.get("note", ""),
                })
        missing = [h for h in humans_all if h not in tv]
        if missing:
            warnings.append("%s: no annotation from %s — trace excluded from pooled multi-coder stats" % (tid, ", ".join(missing)))
        else:
            complete.append(tid)
        vecs.append((tid, tv))

    # fill "other humans" for flags
    tvmap = dict(vecs)
    for r in flags_rows:
        if r["gap_index"] != "":
            others = [h for h in humans_all if h != r["annotator_id"] and h in tvmap[r["trace_id"]]]
            r["other_humans_cut_here"] = "%d/%d" % (sum(tvmap[r["trace_id"]][h][r["gap_index"]] for h in others), len(others))

    humans = humans_all
    coders = humans + [AI]
    lines = []
    P = lines.append
    P("# Task A — segmentation agreement report\n")
    P("- Annotation files: %s" % ", ".join(os.path.basename(p) for p in args.annotations))
    P("- Humans: %d (%s); drafts %s; section: %s" % (len(humans), ", ".join(humans), "included" if args.include_drafts else "excluded", args.section))
    P("- Traces with annotations: %d; complete (all humans): %d" % (len(trace_ids), len(complete)))
    P("- Unit: candidate boundary = every word start except the first word (n gaps per trace below).\n")
    if not humans:
        P("No human annotations found."); write(args.out, lines, warnings); return

    # ---------------- descriptives
    coder_rows = []
    P("## Boundaries per coder\n")
    P("| Coder | " + " | ".join(units[t].tid[:11] + " (%d gaps)" % len(units[t].gaps) for t in trace_ids) + " | words / segment (pooled) |")
    P("|---|" + "---:|" * (len(trace_ids) + 1))
    for c in coders:
        cells, nb, nw, nt = [], 0, 0, 0
        for tid, tv in vecs:
            if c in tv:
                b = sum(tv[c]); cells.append(str(b)); nb += b; nw += units[tid].n_words; nt += 1
                coder_rows.append({"coder": c, "trace_id": tid, "boundaries": b, "segments": b + 1,
                                   "words": units[tid].n_words, "mean_words_per_segment": round(units[tid].n_words / (b + 1), 2)})
            else:
                cells.append("—")
        P("| %s | %s | %s |" % (c, " | ".join(cells), fmt(nw / (nb + nt) if nt else float("nan"), 1)))
    P("")

    # ---------------- multi-coder
    def multi(tids, group):
        pooled = [[] for _ in group]
        for tid, tv in vecs:
            if tid in tids:
                for j, c in enumerate(group):
                    pooled[j].extend(tv[c])
        return pooled
    trace_rows = []
    P("## Multi-coder agreement\n")
    P("| Scope | α humans | Fleiss κ humans | α humans + AI | Fleiss κ humans + AI |")
    P("|---|---:|---:|---:|---:|")
    scopes = [("Pooled (complete traces)", complete)] + [(t, [t]) for t in complete]
    for name, tids in scopes:
        if not tids or len(humans) < 2:
            continue
        H = multi(tids, humans); HA = multi(tids, coders)
        row = {"scope": name, "alpha_humans": kripp_alpha(H), "fleiss_humans": fleiss(H), "alpha_humans_ai": kripp_alpha(HA), "fleiss_humans_ai": fleiss(HA)}
        trace_rows.append(row)
        P("| %s | %s | %s | %s | %s |" % (name, fmt(row["alpha_humans"]), fmt(row["fleiss_humans"]), fmt(row["alpha_humans_ai"]), fmt(row["fleiss_humans_ai"])))
    if len(humans) < 2:
        P("\n(Needs at least two human annotators.)")
    P("")

    # ---------------- pairwise
    pair_rows = []
    pairs = list(itertools.combinations(humans, 2)) + [(AI, h) for h in humans]
    for a, b in pairs:
        for scope, tids in [("pooled", [t for t, tv in vecs if a in tv and b in tv])] + [(t, [t]) for t, tv in vecs if a in tv and b in tv]:
            va, vb = [], []
            pkv, wdv, ws = [], [], []
            for tid, tv in vecs:
                if tid in tids:
                    va.extend(tv[a]); vb.extend(tv[b])
                    pk1, wd1, k = pk_wd(tv[a], tv[b]); pk2, wd2, _ = pk_wd(tv[b], tv[a])
                    pkv.append((pk1 + pk2) / 2); wdv.append((wd1 + wd2) / 2); ws.append(len(tv[a]))
            if not va:
                continue
            t = table(va, vb)
            wmean = lambda xs: sum(x * w for x, w in zip(xs, ws)) / sum(ws) if ws else float("nan")
            # tolerant F1 must not match across traces: compute per trace and pool counts
            tol = {}
            for k in (1, 2):
                num = den = 0
                for tid, tv in vecs:
                    if tid in tids:
                        A, B = sum(tv[a]), sum(tv[b])
                        f = tolerant_f1(tv[a], tv[b], k)
                        if not math.isnan(f):
                            num += f * (A + B); den += A + B
                tol[k] = num / den if den else float("nan")
            pair_rows.append({
                "type": "AI-human" if a == AI else "human-human", "coder_a": a, "coder_b": b, "scope": scope, "gaps": len(va),
                "both": t[0], "only_a": t[1], "only_b": t[2], "neither": t[3],
                "cohen_kappa": kappa_from(t), "f1_exact": f1_from(t), "f1_tol1": tol[1], "f1_tol2": tol[2],
                "pk": wmean(pkv), "windowdiff": wmean(wdv),
                "boundary_similarity": try_segeval(va, vb) if scope != "pooled" else float("nan"),
            })

    def pr(kind):
        return [r for r in pair_rows if r["type"] == kind and r["scope"] == "pooled"]
    P("## Pairwise agreement (pooled over traces)\n")
    P("| Pair | κ | F1 exact | F1 ±1 word | F1 ±2 words | Pk ↓ | WindowDiff ↓ |")
    P("|---|---:|---:|---:|---:|---:|---:|")
    for r in pr("human-human") + pr("AI-human"):
        P("| %s – %s | %s | %s | %s | %s | %s | %s |" % (r["coder_a"], r["coder_b"], fmt(r["cohen_kappa"]), fmt(r["f1_exact"]), fmt(r["f1_tol1"]), fmt(r["f1_tol2"]), fmt(r["pk"]), fmt(r["windowdiff"])))
    P("")
    P("| Mean over pairs | κ | F1 exact | F1 ±1 | F1 ±2 | Pk ↓ | WindowDiff ↓ |")
    P("|---|---:|---:|---:|---:|---:|---:|")
    for kind in ("human-human", "AI-human"):
        rs = pr(kind)
        if rs:
            P("| %s (%d pairs) | %s | %s | %s | %s | %s | %s |" % (kind, len(rs), *(fmt(mean([r[m] for r in rs])) for m in ("cohen_kappa", "f1_exact", "f1_tol1", "f1_tol2", "pk", "windowdiff"))))
    P("")

    # ---------------- AI vs humans
    P("## AI vs humans\n")
    cv = [(tid, tv) for tid, tv in vecs if tid in complete]
    if cv and humans:
        allh = {c: sum((tv[c] for _, tv in cv), []) for c in coders}
        maj = majority([allh[h] for h in humans])
        P("Human majority vote (boundary if at least half of the %d humans cut; ties count as a boundary)." % len(humans))
        t = table(allh[AI], maj)
        P("\n- AI vs majority: κ = %s, F1 = %s; AI boundaries %d, majority boundaries %d, both %d." % (fmt(kappa_from(t)), fmt(f1_from(t)), t[0] + t[1], t[0] + t[2], t[0]))
        if len(humans) >= 3:
            P("\n**Leave-one-out** — each human and the AI against the majority of the *other* humans:\n")
            P("| Held-out human h | κ(h, others) | κ(AI, others) | Δ (AI − h) |")
            P("|---|---:|---:|---:|")
            deltas = []
            for h in humans:
                others = majority([allh[o] for o in humans if o != h])
                kh, ka = kappa_from(table(allh[h], others)), kappa_from(table(allh[AI], others))
                deltas.append(ka - kh)
                P("| %s | %s | %s | %s |" % (h, fmt(kh), fmt(ka), fmt(ka - kh)))
            P("| **mean** | | | **%s** |" % fmt(mean(deltas)))
            P("\nΔ ≥ 0 means the AI agrees with the human panel at least as well as a held-out human does.")
        if len(humans) >= 2:
            hh = list(itertools.combinations(humans, 2)); ah = [(AI, h) for h in humans]
            blocks = block_tables([tv for _, tv in cv], hh + ah, args.block)
            def stat_hh(s): return mean([kappa_from(summed(s, p)) for p in hh])
            def stat_ah(s): return mean([kappa_from(summed(s, p)) for p in ah])
            def stat_d(s): return stat_ah(s) - stat_hh(s)
            full = blocks
            P("\n**Mean pairwise κ with block-bootstrap 95%% CI** (%d blocks of %d gaps, %d reps):\n" % (len(blocks), args.block, args.reps))
            P("| Quantity | estimate | 95% CI |")
            P("|---|---:|---|")
            for name, st in (("human–human", stat_hh), ("AI–human", stat_ah), ("difference (AI–human − human–human)", stat_d)):
                lo, hi = boot_ci(blocks, st, args.reps, args.seed)
                P("| %s | %s | [%s, %s] |" % (name, fmt(st(full)), fmt(lo), fmt(hi)))
    else:
        P("Needs at least one trace annotated by every human.")
    P("")

    # ---------------- per trace
    P("## Per-trace pairwise κ\n")
    P("| Trace | mean human–human κ | mean AI–human κ |")
    P("|---|---:|---:|")
    for tid in trace_ids:
        hh = [r["cohen_kappa"] for r in pair_rows if r["scope"] == tid and r["type"] == "human-human"]
        ah = [r["cohen_kappa"] for r in pair_rows if r["scope"] == tid and r["type"] == "AI-human"]
        P("| %s | %s | %s |" % (tid, fmt(mean(hh)), fmt(mean(ah))))
    P("")

    P("## Uncertainty flags\n")
    if flags_rows:
        by = defaultdict(int)
        for r in flags_rows: by[r["annotator_id"]] += 1
        P(", ".join("%s: %d" % kv for kv in sorted(by.items())) + " — details in `flags.csv`.")
    else:
        P("No flags.")
    P("")
    P("## Reading the numbers\n")
    P("- κ / α: chance-corrected agreement over every candidate gap (most gaps are non-boundaries, so raw % agreement is not reported).")
    P("- F1 ±k: a boundary placed up to k words away still counts as a match (one-to-one). Useful because operations can begin one or two words apart (e.g. before or after “So,”).")
    P("- Pk / WindowDiff: error rates of sliding-window segmentation metrics; 0 = identical.")
    P("- Boundary Similarity (per trace, in `pairwise.csv`) needs `pip install segeval`.")

    # ---------------- write files
    write_csv(os.path.join(args.out, "pairwise.csv"), pair_rows)
    write_csv(os.path.join(args.out, "multicoder.csv"), trace_rows)
    write_csv(os.path.join(args.out, "coders.csv"), coder_rows)
    write_csv(os.path.join(args.out, "flags.csv"), flags_rows)
    with open(os.path.join(args.out, "gap_matrix.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["trace_id", "gap_index", "char_pos", "next_word"] + coders)
        for tid, tv in vecs:
            U = units[tid]
            for i, p in enumerate(U.gaps):
                nxt = re.match(r"\S+", U.text[p:]).group(0)[:30]
                w.writerow([tid, i, p, nxt] + [tv[c][i] if c in tv else "" for c in coders])
    write(args.out, lines, warnings)


def write_csv(path, rows):
    if not rows:
        open(path, "w").close(); return
    keys = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for r in rows:
            w.writerow({k: (round(v, 4) if isinstance(v, float) and not math.isnan(v) else ("" if isinstance(v, float) else v)) for k, v in r.items()})


def write(out, lines, warnings):
    if warnings:
        lines += ["## Warnings\n"] + ["- " + w for w in warnings] + [""]
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))
    print("\nWrote %s/{report.md, pairwise.csv, multicoder.csv, coders.csv, flags.csv, gap_matrix.csv}" % out)


if __name__ == "__main__":
    main()
