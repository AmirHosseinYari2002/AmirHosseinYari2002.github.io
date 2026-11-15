# TRACE · Task A: annotation platform (window design)

The annotator site for **Part A → Part B** of `taskA_human_validation.ipynb`. Annotators segment short
**windows** (about 2,600 characters) of model reasoning from scratch, in their own random order, and the
researcher page exports one file per annotator in exactly the format Part B reads.

| File | Purpose |
|---|---|
| `index.html`, `app.js`, `styles.css` | Annotator site: email sign-in → guidelines → warm-up (2 passages with feedback) → study windows |
| `admin.html` | Researcher page: add annotators and their slot, progress, workload & cost estimate, reopen a window, export `A1.json`, `A2.json`, … |
| `data/items.json`, `data/assignments.json` | Copied **unchanged** from `TaskA/platform/` (written by Part A). Nothing that un-blinds an item is here |
| `config.js` | Backend URL, contact email, dry-run banner |
| `backend/Code.gs` | Google Apps Script backend (Google Sheet: Annotators, Windows, Events) |

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

## Moving from the dry run to the final sample

`data/` currently holds the **dry run** (`TaskA/dryrun/platform`, 4 of 6 models, 24 study windows), and `config.js`
has `dryRun: true`, which shows a "Test data" banner. When all six models are in `Outputs/`:

1. Run Part A with `ALLOW_PARTIAL = False`. It writes `TaskA/platform/items.json` and `assignments.json`.
2. Replace `trace-task-a/data/items.json` and `trace-task-a/data/assignments.json` with those two files.
   Never copy anything from `TaskA/private/`.
3. Set `dryRun: false` in `config.js` and push.

The site fingerprints the two data files (the *dataset id* shown on the researcher page) and stores every record
under it, so test annotations from the dry run can never be loaded into, or exported with, the final sample,
even when an item ID repeats.

## Backend

1. Open the Google Sheet behind the web app → Extensions → Apps Script. Replace the code with `backend/Code.gs`.
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
* *Download every record* gives an archive of the dataset (drafts, timestamps, window SHA-1s that
  match `key.csv`'s `window_sha1`).

Active time counts only while a window is open in the foreground and the annotator was active in the last minute.
