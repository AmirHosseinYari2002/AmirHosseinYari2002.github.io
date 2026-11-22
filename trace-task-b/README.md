# TRACE · Task B: action labels on Gemini 3.8 Flash segments

Annotators label the segments of the **36 Task A study windows** as segmented by **Gemini 3.8 Flash**, the judge
closest to the human segmentation in Task A (validation report 2026-11-22: κ_B 0.765 vs human–human 0.781,
non-inferior). Every segment gets exactly one action: CONSTRUCT, INSPECT, REVISE, REDIRECT or NONACTION.
947 segments in total (3–63 per window). Hosted at `https://<your-site>/trace-task-b/`.

| File | Purpose |
|---|---|
| `index.html`, `app.js`, `styles.css` | Annotator site: email sign-in → handbook → practice → 36 windows, one at a time |
| `admin.html` | Researcher page: progress of every annotator (with cost so far / remaining), access to Task B, workload & cost estimate, reopen a window, export |
| `traces.js` | The windows and their Gemini 3.8 Flash segment boundaries (generated; no model, outcome or labels) |
| `config.js` | Backend URL and contact email |
| `backend/Code.gs` | Google Apps Script backend (Google Sheet: Annotators, Annotations, Log) |
| `tools/build_segments.py` | Regenerates `traces.js` |
| `analysis/task_b_agreement.py` | Inter-annotator (and, later, LLM–human) label agreement |

## The data

`traces.js` is built from three files:

* `trace-task-a/data/items.json` (= `TaskA/platform/items.json`): the problem, the grey context before the window
  and the window text, for every window;
* `judge_units.json` from `TaskA/reports/taskA_judge_agreement_v3.zip`: each judge's CUTs per window as unit
  indices, i.e. already in window coordinates (`judges/g3.8-flash.jsonl` holds full-trace offsets and a `code`
  that reveals the model and outcome, so it is not used);
* `trace-task-a/data/assignments.json`: the shared window order (slot `A1`), as in Task A. Practice items are skipped.

A segment runs from one Gemini CUT to the next. The first segment starts at the window start, so it can continue an
operation that began in the grey context; the handbook tells annotators to label what that segment itself does.

```bash
python3 trace-task-b/tools/build_segments.py \
    trace-task-a/data/items.json judge_agreement_v3/judge_units.json trace-task-a/data/assignments.json \
    trace-task-b/traces.js --judge g3.8-flash
```

## How annotators work

* Windows open **one at a time, in the shared order**; after a submit the next window opens automatically.
  A locked window cannot be opened by URL.
* Each window shows the problem, the **grey context** (read only, not labeled) and the numbered segments.
  The active segment is highlighted and shown in the labeling panel with the end of the previous segment.
* Keys: `1`–`5` label · `J`/`→` next · `K`/`←` previous · `N` next unresolved · `F` flag · `0` clear · `Ctrl/⌘+Z` undo · `G` guide.
  With auto-advance on (default), choosing a label moves to the next segment.
* **Flag** a segment with a reason (*label uncertain*, *segmentation issue*, *other*), optional plausible labels and a
  required note; the label can be kept as tentative or left empty for adjudication.
* A window can be submitted only when every segment has a label or an explained flag (also checked by the server).
  Submitted windows are locked until reopened from `admin.html`.
* Annotators never see word counts, time estimates, active time, the model or the outcome.

## Who can sign in

**Only the email addresses in `ANNOTATORS` at the top of `backend/Code.gs`** (case does not matter):

```js
const ANNOTATORS = [
  'ahyari2002@gmail.com',
  'aliyari1380@gmail.com'
];
```

Every sign-in, save and submit is checked against this list; any other email gets "not registered". To change who
takes part, edit the list (and `annotators` in `config.js`, which the researcher page shows) and deploy a new version.
**Block** on the researcher page keeps one of them out without deleting their data; **Allow** undoes it.

## Researcher page

Enter the **admin key** (printed by `setup`; also Project Settings → Script Properties → `ADMIN_KEY`) and press
**Load progress**.

* **Progress** (top of the page; until the key is accepted it says what to do): per annotator: % done, windows
  submitted, labels, flags, active time, median per window, last activity, estimated time and cost remaining (at the
  annotator's own pace once 3 windows are in), cost so far; "has not opened Task B yet" before the first window.
  Totals: windows submitted, cost so far, estimated cost remaining, projected total cost. Per-window details and
  **Reopen**. **Refresh now**, or refresh every minute.
* **Annotators:** the two emails, whether they can sign in, first sign-in, Block / Allow.
* **Workload & cost estimate** (works before you enter the admin key). Per window:
  words of window text ÷ reading speed + segments × seconds per label + problem and grey-context words ÷ context
  reading speed + overhead. Plus onboarding (handbook + practice) and a buffer, times the hourly rate and the number
  of annotators. Defaults: 150 words/min, 6 s per label, 250 words/min context, 1 min overhead, 30 min onboarding,
  10 % buffer, 10 USD/h, 2 annotators → about 5 h 27 min and 54.50 USD per annotator, 109 USD for two. Every
  assumption is editable and remembered in the browser; a per-window table shows time and cost per window.
  Once windows are submitted, the observed pace appears and can replace the time per label.
* **Download all labels (JSON):** format `trace-task-b/v2`, current windows only (rows from the earlier full-trace
  version of Task B stay in the sheet but are not exported). Per annotator × window: `labels` (one per segment, in
  order; `null` = unlabeled), `flags` (`seg`, `reason`, `alts`, `note`), `dwell_ms` per segment, `active_ms`, status,
  and the text and segmentation hashes.

## Backend

After changing `backend/Code.gs`: open the Task B Google Sheet → Extensions → Apps Script, replace all the code, save,
then Deploy → Manage deployments → Edit (pencil) → Version: **New version** → Deploy. The URL stays the same, so
`config.js` does not change. Existing data is kept; the Annotators sheet gets two extra columns on the next request.

## Agreement

```bash
python3 trace-task-b/analysis/task_b_agreement.py \
    --traces trace-task-b/traces.js \
    --annotations task-b_labels_YYYY-MM-DD.json \
    --out task_b_results
```

Krippendorff's α, Fleiss' κ, pairwise Cohen's κ and % agreement (pooled and per window), label distribution per
annotator, all flags. When an LLM labels the same segments, pass `--ai-labels file.json`
(`{"W875": ["CONSTRUCT", ...], ...}`, one label per segment in order) to add AI vs each human, AI vs the human
majority with a confusion matrix, mean AI–human vs human–human κ with a bootstrap CI, and leave-one-out.
