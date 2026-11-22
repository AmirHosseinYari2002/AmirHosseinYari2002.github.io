/**
 * TRACE · Task A — Google Apps Script backend (window design of taskA_human_validation.ipynb).
 *
 * Setup (once):
 *   1. Create a Google Sheet. Extensions → Apps Script. Paste this file as Code.gs.
 *   2. Run `setup` once from the editor (authorize when asked). It creates the sheets and prints
 *      the ADMIN KEY in the execution log (also kept in Script Properties as ADMIN_KEY).
 *   3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 *      Put the /exec URL in trace-task-a/config.js (apiUrl).
 *   When you update this file later: Deploy → Manage deployments → Edit → Version: New version.
 *   The sheets migrate themselves (missing sheets and columns are added on the next request).
 *
 * Sheets:
 *   Annotators — email, name, active, slot (A1, A2, … = the annotator's item order in assignments.json)
 *   Windows    — latest state per (annotator, dataset, item): cuts, flags, status, active time
 *   Events     — append-only history (every submit stores the full payload)
 *   Corrections — append-only researcher corrections. Every save or revert adds one row with the corrected
 *                CUTs and a copy of the annotator's submitted CUTs at that moment; rows are never edited or
 *                deleted. The latest row per (dataset, annotator, item) is the current correction. Correction
 *                actions never write to Windows or Events, so every annotator recording stays exactly as submitted.
 * A "dataset" is one set of platform files (items.json + assignments.json). The site sends a
 * fingerprint of them with every request, so annotations of a dry run never mix with the final sample.
 */

const SHEETS = {
  Annotators: ['annotator_id', 'access_code', 'name', 'active', 'created_at', 'slot'],
  Windows: ['annotator_id', 'slot', 'dataset_id', 'item_id', 'practice', 'status', 'cuts_json', 'flags_json',
    'n_cuts', 'n_flags', 'active_ms', 'read_pct', 'window_sha1', 'client_updated', 'server_updated',
    'submitted_at', 'version', 'meta_json'],
  Events: ['server_ts', 'annotator_id', 'slot', 'dataset_id', 'item_id', 'action', 'status', 'n_cuts', 'n_flags', 'payload_json'],
  Corrections: ['server_ts', 'dataset_id', 'item_id', 'annotator_id', 'slot', 'revision', 'action', 'cuts_json', 'n_cuts',
    'original_cuts_json', 'original_version', 'original_submitted_at', 'window_sha1', 'note', 'corrected_by']
};

function setup() {
  ensure_();
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('ADMIN_KEY');
  if (!key) { key = Utilities.getUuid().replace(/-/g, ''); props.setProperty('ADMIN_KEY', key); }
  Logger.log('ADMIN KEY: ' + key);
}

// Create missing sheets and append missing header columns (keeps existing data and column order).
function ensure_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) { sh.appendRow(SHEETS[name]); sh.setFrozenRows(1); return; }
    const head = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String);
    SHEETS[name].forEach(function (h) {
      if (head.indexOf(h) < 0) { head.push(h); sh.getRange(1, head.length).setValue(h); }
    });
  });
}

function sheet_(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }
function out_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function now_() { return new Date().toISOString(); }
function header_(name) { const sh = sheet_(name); return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String); }

function rows_(name) {
  const v = sheet_(name).getDataRange().getValues();
  const head = v.shift().map(String);
  // Sheets may turn ISO timestamps into Date objects; read them back as ISO text.
  return v.map(function (r, i) { const o = { _row: i + 2 }; head.forEach(function (h, j) { o[h] = r[j] instanceof Date ? r[j].toISOString() : r[j]; }); return o; });
}
// Write an object as a row, matching columns by header name.
function writeRow_(name, obj, rowNum) {
  const sh = sheet_(name), head = header_(name);
  const row = head.map(function (h) { return obj[h] === undefined ? '' : obj[h]; });
  if (rowNum) sh.getRange(rowNum, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
}
function setCell_(name, rowNum, col, value) { sheet_(name).getRange(rowNum, header_(name).indexOf(col) + 1).setValue(value); }

function doGet() { return out_({ ok: true, service: 'trace-task-a', version: 2 }); }

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad_json' }); }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    ensure_();
    const a = body.action;
    if (a && a.indexOf('admin_') === 0) return out_(admin_(body));
    const who = auth_(body.annotator_id);
    if (!who) return out_({ ok: false, error: 'auth' });
    const ds = String(body.dataset_id || '');
    if (a === 'login') return out_({ ok: true, name: who.name, slot: who.slot, progress: progress_(who.annotator_id, ds), warmup_done: warmupDone_(who.annotator_id) });
    if (!ds) return out_({ ok: false, error: 'no_dataset' });
    if (a === 'load') return out_(load_(who.annotator_id, ds, String(body.item_id || '')));
    if (a === 'save') return out_(save_(who, ds, body, false));
    if (a === 'submit') return out_(save_(who, ds, body, true));
    if (a === 'warmup') { event_(who, ds, 'warmup', 'warmup', 'done', body.n_cuts || 0, 0, body); return out_({ ok: true }); }
    return out_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, error: 'server', detail: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function normEmail_(e) { return String(e || '').trim().toLowerCase(); }
function isEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120; }
function isActive_(r) { return !(r.active === false || String(r.active).toLowerCase() === 'false'); }

function auth_(id) {
  id = normEmail_(id);
  if (!id) return null;
  const r = rows_('Annotators').filter(function (x) { return normEmail_(x.annotator_id) === id; })[0];
  if (!r || !isActive_(r)) return null;
  return { annotator_id: id, name: r.name, slot: String(r.slot || '') };
}

function find_(id, ds, itemId) {
  return rows_('Windows').filter(function (x) { return x.annotator_id === id && x.dataset_id === ds && String(x.item_id) === itemId; })[0];
}

function progress_(id, ds) {
  const p = {};
  if (!ds) return p;
  rows_('Windows').forEach(function (x) {
    if (x.annotator_id === id && x.dataset_id === ds) p[x.item_id] = { status: x.status, n_cuts: x.n_cuts, n_flags: x.n_flags, server_updated: x.server_updated, version: x.version };
  });
  return p;
}

function warmupDone_(id) {
  return rows_('Events').some(function (x) { return x.annotator_id === id && x.action === 'warmup'; });
}

function load_(id, ds, itemId) {
  const r = find_(id, ds, itemId);
  if (!r) return { ok: true, found: false };
  return { ok: true, found: true, status: r.status, cuts: JSON.parse(r.cuts_json || '[]'), flags: JSON.parse(r.flags_json || '[]'),
    active_ms: Number(r.active_ms) || 0, read_pct: Number(r.read_pct) || 0, client_updated: r.client_updated, version: Number(r.version) || 0 };
}

function clean_(body) {
  const cuts = [];
  (body.cuts || []).map(Number).forEach(function (n) { if (isFinite(n) && n > 0 && cuts.indexOf(n) < 0) cuts.push(Math.floor(n)); });
  cuts.sort(function (a, b) { return a - b; });
  const flags = (body.flags || []).map(function (f) { return { offset: Number(f.offset), note: String(f.note || '').slice(0, 1500), created: f.created || '' }; })
    .filter(function (f) { return isFinite(f.offset); });
  return { cuts: cuts, flags: flags };
}

function save_(who, ds, body, submit) {
  const itemId = String(body.item_id || '');
  if (!itemId) return { ok: false, error: 'no_item' };
  const c = clean_(body);
  const r = find_(who.annotator_id, ds, itemId);
  if (r && r.status === 'submitted') return { ok: false, error: 'locked', status: 'submitted' };
  const version = (r ? Number(r.version) || 0 : 0) + 1;
  const status = submit ? 'submitted' : (r && r.status === 'reopened' ? 'reopened' : 'draft');
  let flagsJson = JSON.stringify(c.flags);   // a Sheets cell holds at most 50,000 characters
  if (flagsJson.length > 49000) { c.flags.forEach(function (f) { f.note = f.note.slice(0, 300); }); flagsJson = JSON.stringify(c.flags); }
  writeRow_('Windows', {
    annotator_id: who.annotator_id, slot: who.slot, dataset_id: ds, item_id: itemId, practice: !!body.practice, status: status,
    cuts_json: JSON.stringify(c.cuts), flags_json: flagsJson, n_cuts: c.cuts.length, n_flags: c.flags.length,
    active_ms: Number(body.active_ms) || 0, read_pct: Number(body.read_pct) || 0, window_sha1: String(body.window_sha1 || ''),
    client_updated: String(body.client_updated || ''), server_updated: now_(),
    submitted_at: submit ? now_() : (r ? r.submitted_at : ''), version: version, meta_json: JSON.stringify(body.meta || {})
  }, r ? r._row : null);
  event_(who, ds, itemId, submit ? 'submit' : 'save', status, c.cuts.length, c.flags.length,
    submit ? { cuts: c.cuts, flags: c.flags, active_ms: body.active_ms, window_sha1: body.window_sha1, meta: body.meta } : null);
  return { ok: true, status: status, version: version, server_updated: now_() };
}

function event_(who, ds, itemId, action, status, nCuts, nFlags, payload) {
  writeRow_('Events', { server_ts: now_(), annotator_id: who.annotator_id, slot: who.slot, dataset_id: ds, item_id: itemId,
    action: action, status: status, n_cuts: nCuts, n_flags: nFlags, payload_json: payload ? JSON.stringify(payload).slice(0, 49000) : '' });
}

// ---------------- researcher ----------------
function admin_(body) {
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!key || body.admin_key !== key) return { ok: false, error: 'auth' };
  const a = body.action, ds = String(body.dataset_id || '');
  const ann = function () { return rows_('Annotators'); };
  const findAnn = function (email) { return ann().filter(function (x) { return normEmail_(x.annotator_id) === normEmail_(email); })[0]; };
  const slotTaken = function (slot, except) {
    return slot && ann().some(function (x) { return String(x.slot) === slot && isActive_(x) && normEmail_(x.annotator_id) !== normEmail_(except); });
  };
  if (a === 'admin_overview') {
    const datasets = {};
    const windows = rows_('Windows').filter(function (x) { datasets[x.dataset_id] = (datasets[x.dataset_id] || 0) + 1; return x.dataset_id === ds; })
      .map(function (x) { return { annotator_id: x.annotator_id, slot: x.slot, item_id: String(x.item_id), practice: x.practice === true || String(x.practice).toLowerCase() === 'true',
        status: x.status, n_cuts: x.n_cuts, n_flags: x.n_flags, active_ms: Number(x.active_ms) || 0, read_pct: x.read_pct, server_updated: x.server_updated, submitted_at: x.submitted_at }; });
    return { ok: true, datasets: datasets, windows: windows,
      annotators: ann().map(function (x) { return { annotator_id: normEmail_(x.annotator_id), name: x.name, active: isActive_(x), slot: String(x.slot || ''), created_at: x.created_at, warmup_done: warmupDone_(normEmail_(x.annotator_id)) }; }) };
  }
  if (a === 'admin_add_annotator') {
    const id = normEmail_(body.annotator_id), slot = String(body.slot || '');
    if (!isEmail_(id)) return { ok: false, error: 'bad_id' };
    if (findAnn(id)) return { ok: false, error: 'exists' };
    if (slotTaken(slot, id)) return { ok: false, error: 'slot_taken' };
    writeRow_('Annotators', { annotator_id: id, access_code: '', name: String(body.name || ''), active: true, created_at: now_(), slot: slot });
    return { ok: true, annotator_id: id };
  }
  if (a === 'admin_set_slot') {
    const r = findAnn(body.annotator_id), slot = String(body.slot || '');
    if (!r) return { ok: false, error: 'not_found' };
    if (slotTaken(slot, body.annotator_id)) return { ok: false, error: 'slot_taken' };
    setCell_('Annotators', r._row, 'slot', slot);
    return { ok: true };
  }
  if (a === 'admin_set_active') {
    const r = findAnn(body.annotator_id);
    if (!r) return { ok: false, error: 'not_found' };
    if (body.active && slotTaken(String(r.slot || ''), body.annotator_id)) return { ok: false, error: 'slot_taken' };
    setCell_('Annotators', r._row, 'active', !!body.active);
    return { ok: true };
  }
  if (a === 'admin_reopen') {
    const r = find_(normEmail_(body.annotator_id), ds, String(body.item_id));
    if (!r) return { ok: false, error: 'not_found' };
    setCell_('Windows', r._row, 'status', 'reopened');
    event_({ annotator_id: r.annotator_id, slot: r.slot }, ds, String(r.item_id), 'reopen', 'reopened', r.n_cuts, r.n_flags, null);
    return { ok: true };
  }
  if (a === 'admin_correct' || a === 'admin_revert_correction') {
    // Corrects a SUBMITTED window as a new, separate record. The annotator's row in Windows is only read.
    const id = normEmail_(body.annotator_id), itemId = String(body.item_id || '');
    const r = find_(id, ds, itemId);
    if (!r) return { ok: false, error: 'not_found' };
    if (r.status !== 'submitted') return { ok: false, error: 'not_submitted' };
    const prev = rows_('Corrections').filter(function (x) { return x.dataset_id === ds && normEmail_(x.annotator_id) === id && String(x.item_id) === itemId; });
    const original = JSON.parse(r.cuts_json || '[]');
    const cuts = a === 'admin_revert_correction' ? original : clean_({ cuts: body.cuts }).cuts;
    writeRow_('Corrections', { server_ts: now_(), dataset_id: ds, item_id: itemId, annotator_id: id, slot: r.slot,
      revision: prev.length + 1, action: a === 'admin_revert_correction' ? 'revert' : 'correct',
      cuts_json: JSON.stringify(cuts), n_cuts: cuts.length, original_cuts_json: r.cuts_json || '[]',
      original_version: r.version, original_submitted_at: r.submitted_at, window_sha1: r.window_sha1,
      note: String(body.note || '').slice(0, 2000), corrected_by: String(body.corrected_by || '').slice(0, 120) });
    return { ok: true, revision: prev.length + 1 };
  }
  if (a === 'admin_corrections') {
    // The full, append-only correction history of this dataset (oldest first).
    return { ok: true, dataset_id: ds, corrections: rows_('Corrections').filter(function (x) { return x.dataset_id === ds; }).map(function (x) {
      return { server_ts: x.server_ts, item_id: String(x.item_id), annotator_id: normEmail_(x.annotator_id), slot: x.slot, revision: Number(x.revision) || 0,
        action: x.action, cuts: JSON.parse(x.cuts_json || '[]'), original_cuts: JSON.parse(x.original_cuts_json || '[]'),
        original_version: x.original_version, original_submitted_at: x.original_submitted_at, window_sha1: x.window_sha1,
        note: x.note, corrected_by: x.corrected_by };
    }) };
  }
  if (a === 'admin_export') {
    return { ok: true, exported_at: now_(), dataset_id: ds,
      windows: rows_('Windows').filter(function (x) { return x.dataset_id === ds; }).map(function (x) {
        return { annotator_id: x.annotator_id, slot: x.slot, item_id: String(x.item_id), practice: x.practice === true || String(x.practice).toLowerCase() === 'true',
          status: x.status, cuts: JSON.parse(x.cuts_json || '[]'), flags: JSON.parse(x.flags_json || '[]'),
          active_ms: Number(x.active_ms) || 0, read_pct: Number(x.read_pct) || 0, window_sha1: x.window_sha1,
          submitted_at: x.submitted_at, server_updated: x.server_updated, version: x.version };
      }) };
  }
  return { ok: false, error: 'unknown_action' };
}
