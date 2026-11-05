# TRACE · Task A: annotation platform

Annotators read the reasoning traces and insert their own `<CUT>` boundaries from scratch (no LLM
suggestions are shown). Each trace is shown up to and including `</think>`, so it ends with the model's
`**Final Answer**` box; the summary the model writes after `</think>` is not shown. Hosted by GitHub Pages at `https://<your-site>/trace-task-a/`.

| File | Purpose |
|---|---|
| `index.html`, `app.js`, `styles.css` | Annotator site: sign in with email → guidelines → practice → 4 traces |
| `admin.html` | Researcher page: add annotators by email, track progress, reopen a trace, export all annotations |
| `config.js` | Backend URL and contact email |
| `traces.js` | The 4 traces and problem statements (generated, text only, **no** LLM boundaries) |
| `backend/Code.gs` | Google Apps Script backend (stores everything in a Google Sheet) |
| `tools/build_traces.py` | Regenerates `traces.js` from the frozen pilot bundle |
| `analysis/task_a_agreement.py` | Inter-annotator and AI–human agreement |

## 1. Set up the backend (about 10 minutes)

1. Create a new Google Sheet, for example "TRACE Task A".
2. **Extensions → Apps Script**. Replace the editor contents with `backend/Code.gs` and save.
3. Select the `setup` function and click **Run**, then authorize it. The execution log prints the
   **ADMIN KEY** (it's also stored under Project Settings → Script Properties → `ADMIN_KEY`).
4. **Deploy → New deployment → Web app**. Set *Execute as*: **Me** and *Who has access*: **Anyone**.
   Copy the URL that ends in `/exec`.
5. Paste that URL into `config.js` (`apiUrl: 'https://script.google.com/macros/s/…/exec'`), then commit and push.
6. Open `/trace-task-a/admin.html`, enter the admin key, and **add each annotator's email address**.
   Send them the site link; they sign in with that email (case does not matter). Only registered emails can sign in.

If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.
If `apiUrl` is left empty, the site runs in *local mode* (testing only): work is saved only in the browser.

## 2. What gets recorded

For every annotator × trace: the CUT positions (character offsets into `completion_text` of
`deepseek-pilot/results/trajectories.jsonl`, always at the start of a word), the uncertainty flags
(position plus note), status (`draft` / `submitted` / `reopened`), active working time, how much of the trace
was scrolled through, and the SHA-256 of the text. Each submission is also written in full to the append-only
`Log` sheet. A trace can be submitted only after the annotator has scrolled through all of it and ticked
the four checklist items. Submitted traces are locked; reopen one from `admin.html` if needed.

## 3. Compute agreement

Download the export from `admin.html` ("Download all annotations (JSON)"), then:

```bash
python3 trace-task-a/analysis/task_a_agreement.py \
    --bundle /path/to/frozen-pilot-v2 \
    --annotations task-a_annotations_YYYY-MM-DD.json \
    --out task_a_results
```

The LLM (Gemini) segmentation is read from `--bundle` (`segments.jsonl`). It is never published on the site,
so annotators can't see it. Outputs:

- `report.md`: all tables (below)
- `pairwise.csv`: every pair × (pooled, each trace): κ, F1 exact/±1/±2 words, Pk, WindowDiff, 2×2 counts
- `multicoder.csv`: Krippendorff's α and Fleiss' κ, humans only and humans + AI
- `gap_matrix.csv`: one row per candidate boundary, one 0/1 column per coder (ready for R or `irr`)
- `coders.csv`, `flags.csv`: boundary counts per coder; every uncertainty note, with whether the AI and the
  other humans cut at that spot

**Unit:** each word start except the first word of a trace is a candidate boundary. The site only allows CUTs at
word starts, and every LLM boundary also falls on a word start, so humans and the AI are compared on the same units.

**Human–human:** Krippendorff's α, Fleiss' κ, pairwise Cohen's κ, boundary F1 (exact and ±1/±2 words), Pk, WindowDiff.

**AI–human:** AI against each human, AI against the human majority vote, mean AI–human κ vs mean human–human κ
with a block-bootstrap 95% CI of the difference, α with and without the AI, and a leave-one-out test:
κ(AI, majority of the other humans) vs κ(held-out human, the same majority).

By default only the text annotators saw is scored (`--section shown`, up to and including `</think>`).
Useful options: `--section reasoning` (only the text before `</think>`), `--include-drafts`,
`--exclude someone@example.com`, and `pip install segeval` to add Boundary Similarity.

## Regenerating `traces.js`

```bash
python3 trace-task-a/tools/build_traces.py /path/to/frozen-pilot-v2 trace-task-a/traces.js
```

Trace order is fixed (shortest first) and identical for every annotator.
