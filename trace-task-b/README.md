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
| `metrics.js` | Agreement statistics for the researcher page (α, κ, π, AC1, per-label agreement, window bootstrap, claims H / J1 / J2, alt-test, strata); runs in the browser and in Node |
| `notebooks/taskB_judge_study.ipynb` | Colab notebook: label the same segments with candidate judges through the package itself (`anatomy relabel`), record the cost, write `TaskB/judges/<judge>.json` |
| `analysis/task_b_agreement.py` | Offline agreement report (human–human, optionally one judge) |

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

## Agreement on the researcher page (live)

The **Agreement** section is recomputed on every *Load progress* / refresh from the windows **both** annotators have
submitted, so it grows window by window. Unit: one segment; a segment flagged without a label is missing.

* **Inter-annotator:** Krippendorff's α (nominal, primary), Cohen's κ, Scott's π, Gwet's AC1, raw agreement, each
  with a 95% percentile bootstrap CI over **windows** (2,000 resamples, seed 20261115); per label: counts, positive
  specific agreement with CI, one-vs-rest κ; the confusion matrix. **Claim H:** α ≥ 0.80 and one-sided 95% lower bound
  ≥ 0.667 (thresholds in `metrics.js`, `PREREG`; fix them before looking at judge results).
* **Judges:** load `TaskB/judges/*.json` (from the notebook) and `TaskA/private/key.csv` under *Agreement → Judges*;
  they stay in the browser and are never uploaded. Per judge: α / κ / AC1 / raw agreement against each annotator
  (mean), Δ = judge α − annotator α with a paired window bootstrap (**J1**: one-sided 95% lower bound > −0.05),
  accuracy, macro-F1 and per-label F1 against the labels both annotators agree on, the Alternative Annotator Test
  (supporting evidence; little power with two annotators), **J2** (no creator model with an α gap below −0.10;
  needs key.csv), cost of the run. **VALIDATED** = H + J1 + J2; the best validated judge (highest α) is named.
* With key.csv: label shares per creator model (annotators vs each judge, Spearman ρ of the model ranking) and α per
  model, domain, outcome and window position.
* **Download all metrics (JSON)** saves everything shown.

`metrics.js` was checked against `krippendorff` and scikit-learn (α with missing values for 2 and 3 coders, κ,
macro-F1) to floating-point precision.

## The judge notebook (labels exactly as the package)

`notebooks/taskB_judge_study.ipynb` (Colab; a copy is in `TaskB/notebooks/` on Drive) never segments or prompts a
model itself; it only runs **reasoning-anatomy v1.8.12** commands (`Reasoning Behavior/reasoning-anatomy-v1.8.12.zip`).

**Resumable.** While a model is labeled, its package run (on the Colab disk) is checkpointed to Drive every
`CHECKPOINT_MINUTES` (3) as `labels/<judge>/<MODEL>/checkpoint.tar.gz`; the package process is paused for the second
it takes to copy its folder, so the copy is consistent. After a disconnect, run all cells again and the judge cell:
finished models are skipped, a running one is restored from its checkpoint and the package continues (tested: a
hard kill mid-stage, the disk wiped, then resumed with only the remaining requests and byte-identical prompts).

**Why v1.8.12.** Labeling ran one request at a time: each wave admits one live request per problem but was filled with
segments of a single problem. v1.8.12 fills a wave with one segment per problem (about 6x faster); prompts and labels
are unchanged (verified on a finished run: the same 675 requests with byte-identical prompts).

**Why v1.8.11.** The labeling stage capped retries only for some rejection kinds: a judge that kept answering with a
wrong segment ID was asked the identical prompt again without limit (Gemini 2.5 Flash-Lite: 930 calls for one
segment). v1.8.11 enforces the documented cap of 3 (then `TECHNICAL_MISSING`), for `anatomy run` and `relabel`.
Runs are written to the Colab disk while they run and archived to Drive (`labels/<judge>/<MODEL>/run.tar.gz`,
`export.json`); Gemini judges run at `GEMINI_RPM` (300) requests per minute (pace only).

**Why v1.8.10.** v1.8.9 did not replay two kinds of saved segmentation answers in derived runs (the native-ID
selections `native_selection_missing_candidate` / `native_selection_low_cut_density` and their split checks), so
`relabel` stopped (exit 6: *a segmentation request is not among the source run's saved responses*) and `resegment`
asked them again (Gemini answers vary, so segments could change). v1.8.10 replays every saved answer, and adds
`relabel --allow-unresolved-segments`: all six Task A Gemini 3.8 Flash runs have a few unresolved boundaries
(`quality.json`: 34–6,123 tokens per model), which v1.8.9 refused to label at all (exit 3); with the option the
segments stay exactly the source run's and the ones inside an unresolved boundary are recorded `TECHNICAL_MISSING`.
`anatomy run` and every recorded result are unchanged (study policy 1.8.8). Tests: `tests/test_derived_replay.py`.

Per creator model:

1. **Checks before anything is paid (section 4):** a replay audit of each Task A run with the package's own rules
   (every saved segmentation answer must be replayable); the Task A runs must cover all 947 website segments; the
   website segments inside an unresolved boundary are listed and excluded for every judge (`judge_study/excluded.json`).
2. **Judges (section 6):** `anatomy check-judge`, then `anatomy relabel --source-run TaskA/judge_study/g3.8-flash/<MODEL>
   [--allow-unresolved-segments]` (segmentation replayed, never re-run; `segments_identical_to_source` must be true;
   the package's own `05_semantics`: same prompt, request rendering, earlier-context selection, referenced-setup
   context, COMMIT and answer-section rules, validation, retries and receipts), `anatomy export-annotations`, and the
   mapping onto the website's segments. A website segment takes the label of the package segment(s) inside it;
   COMMIT (the final answer), unlabeled and excluded segments are not compared.

Inputs and outputs are on Drive (`Reasoning Behavior/TaskB/`): `platform/traces.js`, `judge_study/source_exports/`,
`judge_study/labels/<judge>/<MODEL>/` (package runs), `judge_study/costs.csv`, `judges/<judge>.json`.

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
