"""Task B: action labels by judge, window by window (researcher-only PDF, like TaskA/reports/taskA_judge_review).

usage: python3 judge_review_report.py TRACES_JS KEY_CSV COSTS_CSV OUT_HTML JUDGE_JSON...
"""
import csv, collections, datetime, html, json, sys
import numpy as np

TRACES_JS, KEY_CSV, COSTS_CSV, OUT = sys.argv[1:5]
JUDGE_FILES = sys.argv[5:]
L = ["CONSTRUCT", "INSPECT", "REVISE", "REDIRECT", "NONACTION"]
SEED, B = 20261115, 2000
NAMES = {"claude-haiku-5.5-think": "Claude Haiku 5.5 (thinking)", "claude-haiku-5.5": "Claude Haiku 5.5",
         "g3.5-flash-lite": "Gemini 3.5 Flash-Lite", "g3.8-flash": "Gemini 3.8 Flash", "g2.5-flash-lite": "Gemini 2.5 Flash-Lite"}
SHORT = {"claude-haiku-5.5-think": "Claude", "claude-haiku-5.5": "Claude (no think)", "g3.5-flash-lite": "G3.5-Lite",
         "g3.8-flash": "G3.8", "g2.5-flash-lite": "G2.5-Lite"}
esc = lambda s: html.escape(str(s))

src = open(TRACES_JS, encoding="utf-8").read()
W = json.loads(src[src.index("window.TRACES = ") + 16: src.rindex(";")])
INFO = json.loads(src[src.index("window.TASKB_SOURCE = ") + 22: src.index(";", src.index("window.TASKB_SOURCE"))])
KEY = {r["item_id"]: r for r in csv.DictReader(open(KEY_CSV, encoding="utf-8"))}
J = {}
for f in JUDGE_FILES:
    d = json.load(open(f, encoding="utf-8")); J[d["judge"]] = d
ORDER = [n for n in ["claude-haiku-5.5-think", "claude-haiku-5.5", "g2.5-flash-lite", "g3.5-flash-lite", "g3.8-flash"] if n in J]
for d in J.values():
    assert all(d["seg_sha256"][w["id"]] == w["seg_sha256"] and len(d["labels"][w["id"]]) == len(w["segs"]) for w in W), d["judge"]

# ---------------------------------------------------------------- statistics
def coincidence_alpha(rows):
    """Krippendorff's alpha (nominal) for units with >=2 values; rows: list of label lists (None = missing)."""
    o = np.zeros((5, 5)); idx = {l: i for i, l in enumerate(L)}
    for vals in rows:
        v = [idx[x] for x in vals if x]
        m = len(v)
        if m < 2: continue
        for a in range(m):
            for b in range(m):
                if a != b: o[v[a], v[b]] += 1 / (m - 1)
    n = o.sum()
    if n == 0: return float("nan")
    nc = o.sum(1); do = n - np.trace(o); de = (n * n - (nc ** 2).sum()) / (n - 1)
    return 1 - do / de if de else float("nan")

def cohen(a, b):
    p = [(x, y) for x, y in zip(a, b) if x and y]
    n = len(p)
    if not n: return float("nan"), float("nan"), 0
    po = sum(x == y for x, y in p) / n
    pe = sum((sum(x == l for x, _ in p) / n) * (sum(y == l for _, y in p) / n) for l in L)
    return po, (po - pe) / (1 - pe) if pe < 1 else float("nan"), n

def fleiss(rows):
    rows = [[x for x in r] for r in rows if all(r)]
    k = len(rows[0]); N = len(rows)
    cnt = np.array([[r.count(l) for l in L] for r in rows], float)
    P = ((cnt * (cnt - 1)).sum(1) / (k * (k - 1))).mean()
    pj = cnt.sum(0) / (N * k); Pe = (pj ** 2).sum()
    return (P - Pe) / (1 - Pe), N

wins = [w["id"] for w in W]
LAB = {n: {w: J[n]["labels"][w] for w in wins} for n in ORDER}
rng = np.random.default_rng(SEED)
BOOT = [rng.integers(0, len(wins), len(wins)) for _ in range(B)]

def pair_stats(a, b, ids):
    A = [x for w in ids for x in LAB[a][w]]; Bv = [x for w in ids for x in LAB[b][w]]
    po, k, n = cohen(A, Bv)
    al = coincidence_alpha([[x, y] for x, y in zip(A, Bv)])
    return po, k, al, n

def ci(fn):
    vals = []
    for s in BOOT:
        ids = [wins[i] for i in s]; v = fn(ids)
        if v == v: vals.append(v)
    return np.percentile(vals, 2.5), np.percentile(vals, 97.5)

pairs = [(a, b) for i, a in enumerate(ORDER) for b in ORDER[i + 1:]]
PAIR = {}
for a, b in pairs:
    po, k, al, n = pair_stats(a, b, wins)
    PAIR[(a, b)] = dict(po=po, k=k, al=al, n=n,
                        po_ci=ci(lambda ids: pair_stats(a, b, ids)[0]),
                        k_ci=ci(lambda ids: pair_stats(a, b, ids)[1]),
                        al_ci=ci(lambda ids: pair_stats(a, b, ids)[2]))
all_rows = [[LAB[n][w][i] for n in ORDER] for w in wins for i in range(len(LAB[ORDER[0]][w]))]
ALPHA_ALL = coincidence_alpha(all_rows)
ALPHA_ALL_CI = ci(lambda ids: coincidence_alpha([[LAB[n][w][i] for n in ORDER] for w in ids for i in range(len(LAB[ORDER[0]][w]))]))
FLEISS, FLEISS_N = fleiss(all_rows)
full = [r for r in all_rows if all(r)]
UNAN = sum(len(set(r)) == 1 for r in full); SPLIT = sum(len(set(r)) == len(r) for r in full)

def confusion(a, b):
    m = collections.Counter((x, y) for w in wins for x, y in zip(LAB[a][w], LAB[b][w]) if x and y)
    return m

# costs (latest row per judge x model, stage 05_semantics)
COST = collections.defaultdict(dict)
for r in csv.DictReader(open(COSTS_CSV, encoding="utf-8")):
    if r["stage"] == "05_semantics": COST[r["judge"]][r["model_code"]] = r
def tot(n, k): return sum(float(r[k] or 0) for r in COST[n].values())

# strata
def stratum_rows():
    out = []
    for field, title in [("model_code", "creator model"), ("domain", "domain"), ("correct", "outcome"), ("position", "window position")]:
        groups = collections.defaultdict(list)
        for w in wins: groups[KEY[w][field]].append(w)
        for g in sorted(groups):
            ids = groups[g]; row = [title, {"True": "correct", "False": "incorrect"}.get(g, g), len(ids),
                                    sum(len(LAB[ORDER[0]][w]) for w in ids)]
            for a, b in pairs:
                po, k, _, _ = pair_stats(a, b, ids); row.append((po, k))
            rr = [[LAB[n][w][i] for n in ORDER] for w in ids for i in range(len(LAB[ORDER[0]][w]))]
            row.append(coincidence_alpha(rr))
            out.append(row)
    return out
STRATA = stratum_rows()

def shares(n, ids=None):
    c = collections.Counter(x for w in (ids or wins) for x in LAB[n][w] if x); t = sum(c.values())
    return {l: c[l] / t for l in L}, t

# ---------------------------------------------------------------- HTML
CSS = """
@page { size: A4 landscape; margin: 11mm 10mm 12mm 10mm; }
body { font: 8.6pt/1.32 'Helvetica Neue', Arial, sans-serif; color: #1b1f24; margin: 0; }
h1 { font-size: 15pt; margin: 0 0 3px; } h2 { font-size: 11pt; margin: 12px 0 4px; } h3 { font-size: 9.5pt; margin: 8px 0 3px; }
p { margin: 3px 0; } .muted { color: #5c6670; } .small { font-size: 7.6pt; }
table { border-collapse: collapse; width: 100%; margin: 3px 0 6px; }
th, td { border: 1px solid #d5dbe1; padding: 2px 4px; vertical-align: top; text-align: left; }
th { background: #eef2f6; font-weight: 600; } td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.page { page-break-before: always; } tr { break-inside: avoid; } .keep { break-inside: avoid; } thead { display: table-header-group; }
.warn { border: 1.5px solid #b42318; background: #fef3f2; color: #7a271a; padding: 5px 8px; margin: 6px 0; font-weight: 600; }
.chip { display: inline-block; min-width: 62px; text-align: center; border-radius: 3px; padding: 0 3px; font-size: 7.4pt; font-weight: 700; color: #fff; }
.CONSTRUCT { background: #2563eb; } .INSPECT { background: #059669; } .REVISE { background: #d97706; } .REDIRECT { background: #9333ea; } .NONACTION { background: #6b7280; }
.none { background: #fff; color: #6b7280; border: 1px dashed #9aa4ae; }
.odd { outline: 2px solid #111; outline-offset: -1px; }
tr.unan td.st { background: #dcfce7; } tr.maj td.st { background: #fef3c7; } tr.split td.st { background: #fee2e2; } tr.na td.st { background: #f3f4f6; }
td.st { width: 12px; text-align: center; font-weight: 700; }
td.seg { font-size: 7.9pt; white-space: pre-wrap; word-break: break-word; } td.num { width: 18px; text-align: right; color: #5c6670; }
td.lab { width: 74px; text-align: center; }
.ctx { color: #6b7280; font-size: 7.5pt; white-space: pre-wrap; border-left: 3px solid #d5dbe1; padding-left: 6px; margin: 3px 0 5px; max-height: 60px; overflow: hidden; }
.hdr { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1b1f24; margin-bottom: 3px; }
.hdr b { font-size: 11pt; } .legend span { margin-right: 10px; }
.sw { display: inline-block; width: 10px; height: 10px; vertical-align: -1px; border: 1px solid #999; margin-right: 3px; }
"""
def chip(x, odd=False):
    return f'<span class="chip {x or "none"}{" odd" if odd else ""}">{esc(x.title() if x else "—")}</span>'
def f3(x): return "—" if x != x else f"{x:.3f}"
def f2(x): return "—" if x != x else f"{x:.2f}"

today = datetime.date.today().isoformat()
H = [f"<!doctype html><html><head><meta charset='utf-8'><title>Task B judge review</title><style>{CSS}</style></head><body>"]
H.append("<h1>Task B: action labels by judge, window by window</h1>")
H.append(f"<p>{len(W)} study windows, {sum(len(w['segs']) for w in W)} segments (segmentation: {esc(INFO['judge'])}, platform order slot {esc(INFO['order_slot'])}). "
         f"Judges: {', '.join(esc(NAMES[n]) for n in ORDER)}. Every judge labelled the same segments through reasoning-anatomy "
         f"v{esc(J[ORDER[0]]['package_version'])} (<code>anatomy relabel</code>, segmentation replayed). Generated {today}. "
         f"Windows appear in the platform order that every annotator shares (numbered 1–{len(W)}).</p>")
H.append("<div class='warn'>Researcher only: shows the creator model, the outcome and every judge's labels. Never give it to an annotator, and do not read "
         "the window pages before your own Task B annotation is submitted: seeing the judges' labels first would bias the human labels the judges are compared with.</div>")
H.append("<h2>How to read the window pages</h2><p>Each row is one segment of the window, as annotators see it; the columns give each judge's action. "
         "Row marker: <span class='sw' style='background:#dcfce7'></span>all judges agree · <span class='sw' style='background:#fef3c7'></span>"
         "majority, the dissenting label is outlined · <span class='sw' style='background:#fee2e2'></span>all judges differ · "
         "<span class='sw' style='background:#f3f4f6'></span>not compared (— : a segment in an unresolved segmentation boundary, labelled TECHNICAL_MISSING "
         "by the package, or the final answer COMMIT). The grey text above the table is the context annotators see before the window (shortened).</p>"
         "<p class='legend'>" + " ".join(f"<span>{chip(l)}</span>" for l in L) + "</p>")

H.append("<h2>Judges</h2><table><tr><th>judge</th><th>model</th><th>settings</th><th class='n'>labelled (of 947)</th>" +
         "".join(f"<th class='n'>{l.title()}</th>" for l in L) +
         "<th class='n'>requests</th><th class='n'>input tok</th><th class='n'>output tok</th><th class='n'>of which thinking</th><th class='n'>cost (36 traces)</th></tr>")
for n in ORDER:
    d = J[n]; sh, t = shares(n)
    s = ", ".join(f"{k}={v}" for k, v in d["settings"].items() if v is not None and k not in ("temperature",))
    H.append(f"<tr><td>{esc(NAMES[n])}</td><td>{esc(d['model'])}</td><td class='small'>{esc(s)}</td><td class='n'>{t}</td>" +
             "".join(f"<td class='n'>{100 * sh[l]:.1f}%</td>" for l in L) +
             f"<td class='n'>{int(tot(n, 'requests')):,}</td><td class='n'>{int(tot(n, 'input_tokens')):,}</td><td class='n'>{int(tot(n, 'output_tokens')):,}</td>"
             f"<td class='n'>{int(tot(n, 'thinking_tokens')):,}</td><td class='n'>${tot(n, 'cost_usd'):.2f}</td></tr>")
H.append("</table><p class='small muted'>Requests, tokens and cost are for labelling the 36 whole traces the windows come from (the package labels every segment of a trace; "
         "about 11% of them lie in the windows), from the package's provider receipts at the prices in each judge's configuration. Label shares are over the window segments a judge labelled.</p>")

H.append(f"<h2>Agreement between judges</h2><p class='small muted'>Unit: one window segment; segments a judge did not label are left out of that judge's pairs. "
         f"95% percentile bootstrap CIs over windows ({B} resamples, seed {SEED}).</p>")
H.append("<table><tr><th>pair</th><th class='n'>segments</th><th class='n'>raw agreement</th><th class='n'>Cohen κ</th><th class='n'>Krippendorff α (nominal)</th></tr>")
for (a, b), s in PAIR.items():
    H.append(f"<tr><td>{esc(NAMES[a])} vs {esc(NAMES[b])}</td><td class='n'>{s['n']}</td>"
             f"<td class='n'>{s['po']:.3f} [{s['po_ci'][0]:.2f}, {s['po_ci'][1]:.2f}]</td><td class='n'>{s['k']:.3f} [{s['k_ci'][0]:.2f}, {s['k_ci'][1]:.2f}]</td>"
             f"<td class='n'>{s['al']:.3f} [{s['al_ci'][0]:.2f}, {s['al_ci'][1]:.2f}]</td></tr>")
H.append(f"</table><p>All {len(ORDER)} judges together: Krippendorff α = <b>{ALPHA_ALL:.3f}</b> [{ALPHA_ALL_CI[0]:.2f}, {ALPHA_ALL_CI[1]:.2f}], "
         f"Fleiss κ = {FLEISS:.3f} (on the {FLEISS_N} segments every judge labelled). All judges agree on {UNAN} of {len(full)} segments "
         f"({100 * UNAN / len(full):.1f}%); all differ on {SPLIT}.</p>")

H.append("<div class='keep'><h3>Confusion between judges (rows: first judge, columns: second judge)</h3><div style='display:flex;gap:10px'>")
for a, b in pairs:
    m = confusion(a, b)
    t = "<table style='width:auto'><tr><th class='small'>" + esc(SHORT[a]) + " ↓ / " + esc(SHORT[b]) + " →</th>" + "".join(f"<th class='n small'>{l[:4].title()}</th>" for l in L) + "</tr>"
    for x in L:
        t += f"<tr><th class='small'>{x[:4].title()}</th>" + "".join(
            f"<td class='n small' style='{'background:#eef2f6;font-weight:700' if x == y else ''}'>{m[(x, y)]}</td>" for y in L) + "</tr>"
    H.append(t + "</table>")
H.append("</div></div>")

H.append("<h2>Agreement by stratum</h2><table><tr><th>stratum</th><th>level</th><th class='n'>windows</th><th class='n'>segments</th>" +
         "".join(f"<th class='n small'>{esc(SHORT[a])}–{esc(SHORT[b])}<br>agree / κ</th>" for a, b in pairs) + "<th class='n'>α (all judges)</th></tr>")
for row in STRATA:
    H.append(f"<tr><td>{esc(row[0])}</td><td>{esc(row[1])}</td><td class='n'>{row[2]}</td><td class='n'>{row[3]}</td>" +
             "".join(f"<td class='n'>{po:.2f} / {f2(k)}</td>" for po, k in row[4:4 + len(pairs)]) + f"<td class='n'>{f3(row[-1])}</td></tr>")
H.append("</table>")

H.append("<h2>Label shares by creator model</h2><table><tr><th>model</th><th>judge</th>" + "".join(f"<th class='n'>{l.title()}</th>" for l in L) + "<th class='n'>labelled</th></tr>")
for mcode in sorted({KEY[w]["model_code"] for w in wins}):
    ids = [w for w in wins if KEY[w]["model_code"] == mcode]
    for n in ORDER:
        sh, t = shares(n, ids)
        H.append(f"<tr><td>{esc(mcode)}</td><td>{esc(NAMES[n])}</td>" + "".join(f"<td class='n'>{100 * sh[l]:.1f}%</td>" for l in L) + f"<td class='n'>{t}</td></tr>")
H.append("</table>")

# window pages
for k, w in enumerate(W, 1):
    key = KEY[w["id"]]
    labs = [LAB[n][w["id"]] for n in ORDER]
    rows, un, cmp_ = [], 0, 0
    for i, (_, a, b) in enumerate(w["segs"]):
        vals = [l[i] for l in labs]
        if not all(vals): cls = "na"; mark = ""
        else:
            cmp_ += 1; c = collections.Counter(vals)
            if len(c) == 1: cls, mark = "unan", ""; un += 1
            elif c.most_common(1)[0][1] > 1: cls, mark = "maj", "•"
            else: cls, mark = "split", "×"
        top = collections.Counter(v for v in vals if v).most_common(1)
        maj = top[0][0] if top and top[0][1] > 1 else None
        cells = "".join(f"<td class='lab'>{chip(v, cls == 'maj' and v != maj)}</td>" for v in vals)
        rows.append(f"<tr class='{cls}'><td class='st'>{mark}</td><td class='num'>{i + 1}</td><td class='seg'>{esc(w['text'][a:b].strip())}</td>{cells}</tr>")
    pw = " · ".join(f"{esc(SHORT[a])}–{esc(SHORT[b])} {pair_stats(a, b, [w['id']])[0]:.2f}" for a, b in pairs)
    outcome = {"True": "correct", "False": "incorrect"}.get(key["correct"], key["correct"])
    ctx = w.get("context") or ""
    ctx = ("…" + ctx[-700:]) if len(ctx) > 700 else ctx
    H.append(f"<div class='page'><div class='hdr'><span><b>{k}. {esc(w['id'])} · {esc(key['code'])}</b></span>"
             f"<span class='small'>model {esc(key['model_code'])} · {esc(key['domain'])} · {esc(outcome)} · {esc(key['position'])} window · "
             f"{len(w['segs'])} segments · platform position #{k}</span></div>"
             f"<p class='small'>All judges agree on <b>{un}/{cmp_}</b> compared segments · raw agreement per pair: {pw}</p>"
             f"<p class='small muted'><b>Problem:</b> {esc((w.get('question') or '')[:420])}{'…' if len(w.get('question') or '') > 420 else ''}</p>"
             + (f"<div class='ctx'>{esc(ctx)}</div>" if ctx else "") +
             "<table><thead><tr><th></th><th>#</th><th>segment</th>" + "".join(f"<th class='lab'>{esc(SHORT[n])}</th>" for n in ORDER) + "</tr></thead>" +
             "".join(rows) + "</table></div>")
H.append("</body></html>")
open(OUT, "w", encoding="utf-8").write("\n".join(H))
print(json.dumps({"pairs": {f"{a}|{b}": [round(s['po'], 3), round(s['k'], 3), round(s['al'], 3)] for (a, b), s in PAIR.items()},
                  "alpha_all": round(ALPHA_ALL, 3), "fleiss": round(FLEISS, 3), "unanimous": [UNAN, len(full)]}))
