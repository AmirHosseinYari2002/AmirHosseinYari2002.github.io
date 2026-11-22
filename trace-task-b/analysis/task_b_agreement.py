#!/usr/bin/env python3
"""Task B agreement: human-human (and, when available, AI-human) agreement on segment action labels.

Usage
-----
  python3 task_b_agreement.py \
      --traces trace-task-b/traces.js \
      --annotations task-b_labels_2026-12-01.json [more.json ...] \
      [--ai-labels gemini_labels.json] \
      --out task_b_results

Inputs
  --traces       the site's traces.js: the 36 Task A study windows segmented by Gemini 3.8 Flash (what annotators saw).
  --annotations  JSON export(s) from the researcher page (admin.html). Duplicates are merged
                 (submitted beats draft, newer beats older).
  --ai-labels    optional: a judge file written by notebooks/taskB_judge_labeling.ipynb (TaskB/judges/<judge>.json),
                 or plain JSON {"<window id>": ["CONSTRUCT", ...], ...}, one label per segment in order.
                 Without it, only human-human agreement is reported. To compare several judges and choose one, use the
                 researcher page (Agreement -> Judges): it adds window-bootstrap CIs, J1/J2 and the alt-test.

Unit of analysis
  One item = one fixed segment. Each coder gives one nominal label from {CONSTRUCT, INSPECT, REVISE, REDIRECT,
  NONACTION}. A segment flagged without a label is a missing value for that coder (it counts in the flag tables).

Outputs (in --out)
  report.md       all tables
  pairwise.csv    every coder pair x (pooled, each window): n, % agreement, Cohen's kappa
  items.csv       one row per segment: each coder's label, majority, flags (ready for R / irr)
  confusion.csv   AI label x human-majority label (only with --ai-labels)
  flags.csv       every flag with reason, plausible labels, note and the coder's label
  coders.csv      label distribution per coder

Metrics
  Krippendorff's alpha (nominal; handles missing values), humans only (and humans + AI).
  Fleiss' kappa over segments every human labeled. Pairwise Cohen's kappa and % agreement.
  With --ai-labels: AI vs each human and vs the human majority (ties excluded), per-label specific agreement,
  mean AI-human vs mean human-human kappa with a segment bootstrap 95% CI, and leave-one-out.

Only the Python standard library is required.
"""
import argparse, csv, hashlib, itertools, json, os, random, statistics
from collections import Counter, defaultdict

LABELS = ["CONSTRUCT", "INSPECT", "REVISE", "REDIRECT", "NONACTION"]
AI = "AI"


def load_traces(path):
    """Windows exactly as the site shows them: {id: [segment dicts]}, {id: (text_sha256, seg_sha256)}, order."""
    src = open(path, encoding="utf-8").read()
    k = src.index("window.TRACES = ") + len("window.TRACES = ")
    traces = json.loads(src[k: src.rindex(";")])
    out, hashes, order = {}, {}, []
    for t in traces:
        text = t["text"]
        if hashlib.sha256(text.encode("utf-8")).hexdigest() != t["sha256"]:
            raise SystemExit(t["id"] + ": text does not match its sha256 in traces.js")
        out[t["id"]] = [{"segment_id": sid, "text": text[a:b], "label": t.get("label", t["id"])} for sid, a, b in t["segs"]]
        hashes[t["id"]] = (t["sha256"], t["seg_sha256"])
        order.append(t["id"])
    return out, hashes, order


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


# ---------------------------------------------------------------- metrics
def cohen(a, b):
    pairs = [(x, y) for x, y in zip(a, b) if x and y]
    n = len(pairs)
    if n == 0:
        return float("nan"), float("nan"), 0
    po = sum(x == y for x, y in pairs) / n
    ca, cb = Counter(x for x, _ in pairs), Counter(y for _, y in pairs)
    pe = sum(ca[l] * cb[l] for l in set(ca) | set(cb)) / (n * n)
    k = float("nan") if pe == 1 else (po - pe) / (1 - pe)
    return k, po, n


def kripp_alpha(units):
    """units: list of lists of labels (None = missing). Nominal alpha."""
    o = Counter()
    for u in units:
        vals = [v for v in u if v]
        m = len(vals)
        if m < 2:
            continue
        c = Counter(vals)
        for a in c:
            for b in c:
                o[a, b] += c[a] * (c[b] - (a == b)) / (m - 1)
    n_c = Counter()
    for (a, b), v in o.items():
        n_c[a] += v
    n = sum(n_c.values())
    if n <= 1:
        return float("nan")
    do = sum(v for (a, b), v in o.items() if a != b)
    de = sum(n_c[a] * n_c[b] for a in n_c for b in n_c if a != b) / (n - 1)
    return float("nan") if de == 0 else 1 - do / de


def fleiss(units):
    units = [u for u in units if all(u)]
    if not units:
        return float("nan"), 0
    m = len(units[0])
    if m < 2:
        return float("nan"), len(units)
    tot = Counter()
    P = []
    for u in units:
        c = Counter(u)
        tot.update(c)
        P.append((sum(v * v for v in c.values()) - m) / (m * (m - 1)))
    N = len(units)
    pbar = sum(P) / N
    pe = sum((v / (N * m)) ** 2 for v in tot.values())
    return (float("nan") if pe == 1 else (pbar - pe) / (1 - pe)), N


def majority(labels):
    c = Counter(l for l in labels if l)
    if not c:
        return None
    top = c.most_common()
    if len(top) > 1 and top[0][1] == top[1][1]:
        return None  # tie
    return top[0][0]


def fmt(x, d=3):
    return "—" if x != x else ("%.*f" % (d, x))


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--traces", required=True)
    ap.add_argument("--ai-labels")
    ap.add_argument("--annotations", nargs="+", required=True)
    ap.add_argument("--out", default="task_b_results")
    ap.add_argument("--include-drafts", action="store_true")
    ap.add_argument("--exclude", nargs="*", default=[])
    ap.add_argument("--boot", type=int, default=2000)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    bundle, hashes, order = load_traces(args.traces)
    ai_labels = json.load(open(args.ai_labels, encoding="utf-8")) if args.ai_labels else {}
    if isinstance(ai_labels.get("labels"), dict):          # a judge file from notebooks/taskB_judge_labeling.ipynb
        ai_labels = ai_labels["labels"]
    has_ai = bool(ai_labels)
    ann = load_annotations(args.annotations, args.include_drafts)
    excl = {e.lower() for e in args.exclude}
    humans = sorted({k[0] for k in ann if k[0] not in excl})
    traces = [t for t in order if any((h, t) in ann for h in humans)]
    skipped = sorted({k[1] for k in ann if k[1] not in bundle})

    items, flags, warn = [], [], []
    for tid in traces:
        segs = bundle[tid]
        for h in humans:
            a = ann.get((h, tid))
            if a and a.get("text_sha256") and a["text_sha256"] != hashes[tid][0]:
                warn.append("%s %s: text hash differs from traces.js — this annotation was made on different text" % (h, tid))
            if a and a.get("seg_sha256") and a["seg_sha256"] != hashes[tid][1]:
                warn.append("%s %s: segmentation hash differs from traces.js — labels may not line up with segments" % (h, tid))
            if a and len(a.get("labels") or []) != len(segs):
                warn.append("%s %s: %d labels for %d segments" % (h, tid, len(a.get("labels") or []), len(segs)))
        for i, s in enumerate(segs):
            al = ai_labels.get(tid) or []
            row = {"trace_id": tid, "seg": i, "segment_id": s["segment_id"], AI: al[i] if i < len(al) and al[i] in LABELS else None}
            fl = {}
            for h in humans:
                a = ann.get((h, tid))
                lab = None
                if a:
                    ls = a.get("labels") or []
                    lab = ls[i] if i < len(ls) and ls[i] in LABELS else None
                    for f in a.get("flags") or []:
                        if f.get("seg") == i:
                            fl[h] = f
                            flags.append({"trace_id": tid, "seg": i + 1, "segment_id": s["segment_id"], "coder": h,
                                          "reason": f.get("reason"), "alts": "|".join(f.get("alts") or []), "coder_label": lab or "",
                                          "ai_label": row[AI] or "", "note": f.get("note", ""), "text": s["text"].strip()[:300]})
                row[h] = lab
            row["majority"] = majority([row[h] for h in humans])
            row["n_flags"] = len(fl)
            row["text"] = s["text"].strip()
            items.append(row)

    coders = humans + ([AI] if has_ai else [])
    L = []

    def P(s=""):
        L.append(s)

    P("# Task B — action-label agreement\n")
    P("Coders: %d humans (%s)%s. Windows: %d. Segments: %d.%s\n" % (
        len(humans), ", ".join(humans), " + AI (--ai-labels)" if has_ai else "", len(traces), len(items), " Drafts included." if args.include_drafts else ""))
    if skipped:
        P("> note: %d annotation(s) for windows not in traces.js were ignored (%s)." % (len(skipped), ", ".join(skipped[:6]) + (" …" if len(skipped) > 6 else "")))
    for w in warn:
        P("> warning: " + w)

    # multi-coder
    P("## Multi-coder agreement\n")
    P("| Scope | α humans | α humans + AI | Fleiss κ humans (n) |")
    P("|---|---|---|---|")
    scopes = [("All windows", items)] + [(tid, [r for r in items if r["trace_id"] == tid]) for tid in traces]
    for name, rs in scopes:
        ah = kripp_alpha([[r[h] for h in humans] for r in rs])
        aa = kripp_alpha([[r[c] for c in coders] for r in rs]) if has_ai else float("nan")
        fk, fn = fleiss([[r[h] for h in humans] for r in rs])
        P("| %s | %s | %s | %s (%d) |" % (name, fmt(ah), fmt(aa), fmt(fk), fn))
    P()

    # pairwise
    pw_rows = []
    for name, rs in scopes:
        for a, b in itertools.combinations(coders, 2):
            k, po, n = cohen([r[a] for r in rs], [r[b] for r in rs])
            pw_rows.append({"scope": name, "a": a, "b": b, "n": n, "agreement": po, "kappa": k})
    with open(os.path.join(args.out, "pairwise.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["scope", "a", "b", "n", "agreement", "kappa"]); w.writeheader(); w.writerows(pw_rows)
    P("## Pairwise (all windows)\n")
    P("| A | B | n | % agree | Cohen κ |")
    P("|---|---|---|---|---|")
    for r in pw_rows:
        if r["scope"] == "All windows":
            P("| %s | %s | %d | %s | %s |" % (r["a"], r["b"], r["n"], fmt(100 * r["agreement"], 1), fmt(r["kappa"])))
    P()

    if has_ai:
        # AI vs majority
        k, po, n = cohen([r[AI] for r in items], [r["majority"] for r in items])
        P("## AI vs human majority\n")
        P("κ = %s, agreement = %s%% over %d segments with a clear majority (%d ties / unlabeled excluded).\n" % (
            fmt(k), fmt(100 * po, 1), n, sum(1 for r in items if not r["majority"])))
        conf = Counter((r[AI], r["majority"]) for r in items if r[AI] and r["majority"])
        with open(os.path.join(args.out, "confusion.csv"), "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f); w.writerow(["AI \\ majority"] + LABELS)
            for a in LABELS:
                w.writerow([a] + [conf[a, b] for b in LABELS])
        P("| AI \\ majority | " + " | ".join(LABELS) + " |")
        P("|---|" + "---|" * len(LABELS))
        for a in LABELS:
            P("| **%s** | %s |" % (a, " | ".join(str(conf[a, b]) for b in LABELS)))
        P()
        P("Specific agreement per label (2·both / (AI + majority)):\n")
        for l in LABELS:
            both = conf[l, l]
            na = sum(conf[l, b] for b in LABELS); nm = sum(conf[a, l] for a in LABELS)
            P("- %s: %s (AI %d, majority %d)" % (l, fmt(2 * both / (na + nm)) if na + nm else "—", na, nm))
        P()

        # AI-human vs human-human with bootstrap
        if len(humans) >= 2:
            def gap(rs):
                hh = [cohen([r[a] for r in rs], [r[b] for r in rs])[0] for a, b in itertools.combinations(humans, 2)]
                ah = [cohen([r[AI] for r in rs], [r[h] for r in rs])[0] for h in humans]
                hh = [x for x in hh if x == x]; ah = [x for x in ah if x == x]
                if not hh or not ah:
                    return float("nan"), float("nan")
                return statistics.mean(ah), statistics.mean(hh)
            mah, mhh = gap(items)
            rnd = random.Random(7)
            diffs = []
            for _ in range(args.boot):
                s = [items[rnd.randrange(len(items))] for _ in items]
                a, h = gap(s)
                if a == a and h == h:
                    diffs.append(a - h)
            diffs.sort()
            lo = diffs[int(.025 * len(diffs))] if diffs else float("nan")
            hi = diffs[int(.975 * len(diffs)) - 1] if diffs else float("nan")
            P("## Is the AI as consistent with humans as humans are with each other?\n")
            P("Mean κ(AI, human) = %s; mean κ(human, human) = %s; difference = %s (95%% bootstrap CI %s to %s, %d resamples of segments).\n" % (
                fmt(mah), fmt(mhh), fmt(mah - mhh), fmt(lo), fmt(hi), len(diffs)))
        if len(humans) >= 3:
            P("### Leave-one-out\n")
            P("| Held-out human | κ(human, others' majority) | κ(AI, others' majority) | n |")
            P("|---|---|---|---|")
            for h in humans:
                others = [o for o in humans if o != h]
                maj = [majority([r[o] for o in others]) for r in items]
                k1, _, n1 = cohen([r[h] for r in items], maj)
                k2, _, _ = cohen([r[AI] for r in items], maj)
                P("| %s | %s | %s | %d |" % (h, fmt(k1), fmt(k2), n1))
            P()

    # coder distributions
    P("## Label distribution per coder\n")
    P("| Coder | " + " | ".join(LABELS) + " | unlabeled | flags |")
    P("|---|" + "---|" * (len(LABELS) + 2))
    crow = []
    for c in coders:
        cnt = Counter(r[c] for r in items)
        nf = sum(1 for f in flags if f["coder"] == c)
        P("| %s | %s | %d | %s |" % (c, " | ".join(str(cnt[l]) for l in LABELS), cnt[None], nf if c != AI else "—"))
        crow.append(dict({"coder": c, "unlabeled": cnt[None], "flags": nf}, **{l: cnt[l] for l in LABELS}))
    with open(os.path.join(args.out, "coders.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["coder"] + LABELS + ["unlabeled", "flags"]); w.writeheader(); w.writerows(crow)
    P()

    # flags
    P("## Flags\n")
    rc = Counter(f["reason"] for f in flags)
    P("%d flags: %s.\n" % (len(flags), ", ".join("%s %d" % kv for kv in rc.most_common()) or "none"))
    multi = Counter((f["trace_id"], f["seg"]) for f in flags if f["reason"] == "segmentation_issue")
    if multi:
        P("Segments flagged as segmentation issues by 2+ humans: %d.\n" % sum(1 for v in multi.values() if v >= 2))
    with open(os.path.join(args.out, "flags.csv"), "w", newline="", encoding="utf-8") as f:
        fn = ["trace_id", "seg", "segment_id", "coder", "reason", "alts", "coder_label"] + (["ai_label"] if has_ai else []) + ["note", "text"]
        if not has_ai:
            for f_ in flags: f_.pop("ai_label", None)
        w = csv.DictWriter(f, fieldnames=fn); w.writeheader(); w.writerows(flags)

    with open(os.path.join(args.out, "items.csv"), "w", newline="", encoding="utf-8") as f:
        fn = ["trace_id", "seg", "segment_id"] + ([AI] if has_ai else []) + humans + ["majority", "n_flags", "text"]
        w = csv.DictWriter(f, fieldnames=fn); w.writeheader()
        for r in items:
            w.writerow({k: ("" if r.get(k) is None else r.get(k)) for k in fn})

    with open(os.path.join(args.out, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
