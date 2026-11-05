# TRACE · Task B: action-labeling platform

Annotators see the **fixed LLM-judge segmentation** of each trace and give every segment exactly one action
label: CONSTRUCT, INSPECT, REVISE, REDIRECT or NONACTION. The LLM-judge labels are **not** published on the site.
Same 4 traces, same text and order as Task A (reasoning up to and including `</think>`); 1,292 segments in total
(61 / 366 / 232 / 633). Hosted by GitHub Pages at `https://<your-site>/trace-task-b/`.

| File | Purpose |
|---|---|
| `index.html`, `app.js`, `styles.css` | Annotator site: sign in with email → handbook → practice → 4 traces → label segments (no word counts, time estimates or downloads shown to annotators) |
| `admin.html` | Researcher page: add annotators by email, track progress, reopen a trace, export all labels |
| `config.js` | Backend URL and contact email |
| `traces.js` | Trace text, problem statements and segment boundaries (generated; **no** LLM labels) |
| `backend/Code.gs` | Google Apps Script backend (stores everything in a Google Sheet) |
| `tools/build_segments.py` | Regenerates `traces.js` from the frozen pilot bundle |
| `analysis/task_b_agreement.py` | Inter-annotator and AI–human label agreement |

## How annotators work

- The trace is shown in full with each segment numbered. The **active segment** is highlighted in the trace and shown
  in the labeling panel, together with the end of the previous segment for context. Click any segment to select it.
- Keys: `1`–`5` label · `J`/`→` next · `K`/`←` previous · `N` next unresolved · `F` flag · `0` clear · `Ctrl/⌘+Z` undo · `G` guide.
  With **auto-advance** on (default), choosing a label moves to the next segment.
- **Flag** a segment with a reason (*label uncertain*, *segmentation issue*, *other*), optional plausible labels and a
  required note. The annotator may keep a tentative label or leave the segment unlabeled for adjudication.
- **Guide** reopens the full handbook as an overlay without leaving the trace.
- A trace can be submitted only when every segment has a label or an explained flag (checked on the server too)
  and the four checklist items are ticked. Submitted traces are locked until reopened from `admin.html`.

## 1. Set up the backend (about 10 minutes)

Task B uses its **own** Google Sheet and Apps Script, separate from Task A.

1. Create a new Google Sheet, for example "TRACE Task B".
2. **Extensions → Apps Script**. Replace the editor contents with `backend/Code.gs` and save.
3. Select `setup` and click **Run**, then authorize it. The execution log prints the **ADMIN KEY**
   (also in Project Settings → Script Properties → `ADMIN_KEY`).
4. **Deploy → New deployment → Web app**. *Execute as*: **Me**; *Who has access*: **Anyone**. Copy the `/exec` URL.
5. Paste it into `config.js` (`apiUrl: 'https://script.google.com/macros/s/…/exec'`), commit and push.
6. Open `/trace-task-b/admin.html`, enter the admin key and **add each annotator's email address**
   (annotators registered for Task A must be added again here). Send them the link `/trace-task-b/`.

If `apiUrl` is empty, the site runs in *local mode*: work is saved only in the browser and is not sent anywhere.
Annotators have no download option, so keep `apiUrl` set for the real study.

## 2. What gets recorded

For every annotator × trace: `labels` (one entry per segment, in order; `null` = unlabeled), `flags`
(`seg` index, `segment_id`, `reason`, `alts`, `note`), `dwell_ms` (time each segment was the active one),
total active time, number of label changes, status (`draft` / `submitted` / `reopened`), and the SHA-256 of the text
and of the segment boundaries. `segment_id` is the `segment_id` in `deepseek-pilot/results/segments.jsonl`.
Each submission is also written in full to the append-only `Log` sheet.

## 3. Compute agreement

Download the export from `admin.html` ("Download all annotations (JSON)"), then:

```bash
python3 trace-task-b/analysis/task_b_agreement.py \
    --bundle /path/to/frozen-pilot-v2 \
    --annotations task-b_annotations_YYYY-MM-DD.json \
    --out task_b_results
```

Unit: one fixed segment; nominal labels. Outputs `report.md`, `pairwise.csv`, `items.csv` (one row per segment,
ready for R / `irr`), `confusion.csv` (AI × human majority), `flags.csv`, `coders.csv`. Metrics: Krippendorff's α
(humans, humans + AI), Fleiss' κ, pairwise Cohen's κ, AI vs majority with per-label specific agreement, mean AI–human
vs human–human κ with a bootstrap CI, and a leave-one-out test. Options: `--include-drafts`, `--exclude email`.

## Regenerating `traces.js`

```bash
python3 trace-task-b/tools/build_segments.py /path/to/frozen-pilot-v2 trace-task-b/traces.js
```
