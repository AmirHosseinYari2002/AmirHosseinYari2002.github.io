# TRACE · Task A: annotation platform (window design)

The annotator site for **Part A → Part B** of `taskA_human_validation.ipynb`. Annotators segment short
**windows** (about 2,600 characters) of model reasoning from scratch, in their own random order, and the
researcher page exports one file per annotator in exactly the format Part B reads.

| File | Purpose |
|---|---|
| `index.html`, `app.js`, `styles.css` | Annotator site: email sign-in → guidelines → warm-up (2 passages with feedback) → study windows |
| `admin.html` | Researcher page: add annotators and their slot, progress, workload & cost estimate, reopen a window, export `A1.json`, `A2.json`, … |
| `data/items.json`, `data/assignments.json` | Copied from `TaskA/platform/` (written by Part A); `assignments.json` gives both annotators A1's order (see below). Nothing that un-blinds an item is here |
| `config.js` | Backend URL, contact email, dry-run banner |
| `backend/Code.gs` | Google Apps Script backend (Google Sheet: Annotators, Windows, Events, Corrections) |

## What the annotator sees

* The problem (sidebar), the preceding text **greyed out** (context only) and the window to segment.
* A CUT can be placed before any **unit**: a word or a punctuation mark (`\w+|[^\w\s]`, the notebook's
  `UNIT_RE`). The positions come from `unit_starts` in `items.json`, so every CUT is already snapped.
* Windows open **one at a time, in the order of `assignments.json` for the annotator's slot**.
  A submitted window is locked and the next one opens.
* **No practice windows.** The warm-up (two short passages checked against a reference) is the only
  practice. Part A still writes `N_PRACTICE` practice items; the site skips every item with
  `"practice": true` and Part B never reads them, so the notebook needs no change.
* No model, outcome, answer, judge CUTs or active time are ever shown. Item IDs are the random IDs from Part A.

## The study sample (two stages)

`data/` holds the **frozen stage-1 sample**: Part A of the notebook with `EXPECTED_MODELS = 5`
(GEM, GPT, NEM, PHI, QWN): 30 study windows, one per model × domain × outcome, on 30 distinct problems.
Annotation runs on these windows; they never change.

**Adding DeepSeek later (stage 2).** Run sections 0 and A1 and then cell **A5** of the notebook with
`APPEND_MODEL` = DeepSeek's code. A5 verifies the frozen files, draws DeepSeek's 6 windows by a rule fixed in
advance (one per domain × outcome, problems not yet used, positions 2/2/2, seed `"20261115-append-<code>"`),
and appends them to `items.json`, `key.csv` and to the end of each annotator's order. Then copy
`TaskA/platform/items.json` and `assignments.json` here. Nothing else changes:

* `config.js` has a fixed `datasetId` (`taskA-study-1`), so every saved annotation stays attached when windows
  are added. Never change it during the study.
* Annotators who already finished see the new windows open at the end of their list; the researcher page and
  exports count them automatically.

Never copy anything from `TaskA/private/`.

**Stage 2 done (2026-11-19):** DeepSeek-R1-Distill-Qwen-32B (`DSR`) was appended with A5: 6 windows (W418, W779,
W355, W883, W316, W176), one per domain × outcome, on problems not used before, at the end of every annotator's
order. The study now has 36 windows per annotator; the first 30 and their order are unchanged.

**One shared window order (2026-11-21):** both annotators now see the windows in the same order, A1's order (A2 used
its own random order before). This lets inter-annotator agreement grow window by window as both progress.
`data/assignments.json` therefore differs from `TaskA/platform/assignments.json` as Part A wrote it: `A2` = `A1`
(same 39 items, practice first). Saved annotations are unaffected (they are stored per item); a window A2 already
submitted stays submitted, and A2 continues with the first window of the shared order that is not submitted yet.
Report this deviation from the per-annotator random order with the study design.

## Backend

1. Open the Google Sheet behind the web app → Extensions → Apps Script. Replace the code with `backend/Code.gs`.
   (Needed once for researcher corrections; until then the review section is read-only.)
2. Deploy → Manage deployments → Edit (pencil) → Version: **New version** → Deploy. The URL stays the same.
   (First-time setup: run `setup` once to print the admin key, then Deploy → New deployment → Web app,
   Execute as **Me**, access **Anyone**, and put the `/exec` URL in `config.js`.)
3. The sheets migrate themselves on the next request: `Windows` and `Events` are created and a `slot` column is
   added to `Annotators`. Existing rows are kept; the old `Annotations`/`Log` sheets are no longer used.

## Researcher page

* **Annotators:** add each annotator's email and **slot** (`A1`, `A2`, … = the keys of `assignments.json`).
  The slot fixes their window order and the name of their export file. One active annotator per slot.
* **Progress:** % done with a progress bar, warm-up, windows submitted, flags, active time, median minutes
  per window, last activity, estimated time remaining and cost so far. Per-window details and **Reopen**.
* **Workload & cost estimate:** words to segment and to read per window, estimated time per annotator and
  total cost from editable assumptions (speeds, overhead, onboarding, buffer, hourly rate); it can switch to
  the annotators' observed speed once windows are submitted.
* **Export for Part B:** *Download A1.json*, *A2.json*:
  `[{"item_id": "W123", "cuts": [412, 980], "flags": [{"offset": 980, "note": "…"}], "seconds": 431}, …]`
  (study windows only, submitted only, CUTs as character offsets in `window_text`). Save them in
  `TaskA/annotations/` and run Part B. The page warns when a file is incomplete.
* **Review & correct segmentations:** every annotator's submitted segmentation of a window side by side (shared
  order, markers coloured by whether the other annotator cut within 3 units). **Correct** opens a researcher
  correction of a submitted window (click a word to add or remove a CUT before it, undo, note). Saving appends a row
  to the **Corrections** sheet: corrected CUTs, a copy of the annotator's submitted CUTs and version, who, when and
  why. The annotator's record (`Windows`), their history (`Events`) and their own view are never changed; every
  correction and every *Revert to original* is kept (append-only), and the full history can be downloaded. If an
  annotator re-submits a window after it was corrected (after *Reopen*), the old correction is flagged out of date
  and no longer applied.
  * The Part B export (`A1.json`, …) and the agreement default stay on the **original submissions**. Corrected data
    are a separate layer: *Download A1.corrected.json* (same format plus `corrected` and `correction_revision`; keep
    it apart, e.g. in `TaskA/annotations_corrected/`) and the agreement option *with researcher corrections*.
  * Report inter-annotator reliability on the original submissions; describe corrected data as researcher-adjudicated.
* *Download every record* gives an archive of the dataset (drafts, timestamps, window SHA-1s that
  match `key.csv`'s `window_sha1`).
* **Agreement (live):** inter-annotator and human–LLM agreement, recomputed from the submitted windows on every
  load or refresh (optionally every 2 minutes). `metrics.js` is a line-by-line port of Part B of the notebook
  (segeval Boundary Similarity with n_t = 3, κ_B, π_B, α, F1 exact / within 3 units, Pk, WindowDiff, bootstrap CIs,
  chance floor, preregistered verdicts, judge non-inferiority J1 and per-model check J2, Alternative Annotator Test,
  strata, model-ranking Spearman ρ); it reproduces the notebook's values to floating-point precision, except that
  bootstrap CIs and the chance floor use a different random-number generator (third-decimal differences).
  Report the numbers Part B prints. For human–LLM agreement, load `TaskA/private/key.csv` and
  `TaskA/judges/*.jsonl` with the file picker: they are read and kept only in that browser (checked against the
  window SHA-1s), never uploaded and never part of this site.

Active time counts only while a window is open in the foreground and the annotator was active in the last minute.
