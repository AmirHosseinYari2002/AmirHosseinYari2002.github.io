/**
 * TRACE · Task B — Google Apps Script backend (action labels for fixed segments).
 *
 * Setup (once):
 *   1. Create a new Google Sheet (e.g. "TRACE Task B"). Extensions → Apps Script. Paste this file as Code.gs.
 *   2. Run `setup` once from the editor (authorize when asked). It creates the sheets
 *      and prints the ADMIN KEY in the execution log (also stored in Script Properties).
 *   3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 *      Copy the /exec URL into trace-task-b/config.js (apiUrl).
 *   4. Open trace-task-b/admin.html, paste the admin key, and add your annotators by email.
 *      Annotators sign in with that email address.
 *
 * Sheets:
 *   Annotators  — one row per annotator (email, name, active)
 *   Annotations — latest state per (annotator, trace): labels, flags, status
 *   Log         — append-only history (every submit stores the full payload)
 */

const LABELS = ['CONSTRUCT', 'INSPECT', 'REVISE', 'REDIRECT', 'NONACTION'];
const REASONS = ['label_uncertain', 'segmentation_issue', 'other'];
const SHEETS = {
  annotators: ['annotator_id', 'access_code', 'name', 'active', 'created_at'],
  annotations: ['annotator_id', 'trace_id', 'status', 'labels_json', 'flags_json', 'n_segments', 'n_labeled', 'n_flags', 'n_unresolved',
    'active_ms', 'dwell_json', 'text_sha256', 'seg_sha256', 'client_updated', 'server_updated', 'submitted_at', 'version', 'meta_json'],
  log: ['server_ts', 'annotator_id', 'trace_id', 'action', 'status', 'n_labeled', 'n_flags', 'payload_json']
};
const CELL_MAX = 49000; // Google Sheets limit is 50,000 characters per cell

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (k) {
    const name = cap_(k);
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) { sh.appendRow(SHEETS[k]); sh.setFrozenRows(1); }
  });
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('ADMIN_KEY');
  if (!key) { key = Utilities.getUuid().replace(/-/g, ''); props.setProperty('ADMIN_KEY', key); }
  Logger.log('ADMIN KEY: ' + key);
}

function cap_(k) { return k.charAt(0).toUpperCase() + k.slice(1); }
function sheet_(k) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cap_(k)); }
function out_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function now_() { return new Date().toISOString(); }
function parse_(s, d) { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } }

function rows_(k) {
  const sh = sheet_(k);
  const v = sh.getDataRange().getValues();
  const head = v.shift();
  return v.map(function (r, i) { const o = { _row: i + 2 }; head.forEach(function (h, j) { o[h] = r[j]; }); return o; });
}

function doGet() { return out_({ ok: true, service: 'trace-task-b' }); }

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad_json' }); }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const a = body.action;
    if (a && a.indexOf('admin_') === 0) return out_(admin_(body));
    const who = auth_(body.annotator_id);
    if (!who) return out_({ ok: false, error: 'auth' });
    if (a === 'login') return out_({ ok: true, name: who.name, progress: progress_(who.annotator_id), practiced: practiced_(who.annotator_id) });
    if (a === 'load') return out_(load_(who.annotator_id, body.trace_id));
    if (a === 'save') return out_(save_(who.annotator_id, body, false));
    if (a === 'submit') return out_(save_(who.annotator_id, body, true));
    if (a === 'practice') { log_(who.annotator_id, 'practice', 'practice', 'done', body.hit || 0, 0, body); return out_({ ok: true }); }
    return out_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, error: 'server', detail: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function normEmail_(e) { return String(e || '').trim().toLowerCase(); }
function isEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120; }

function auth_(id) {
  id = normEmail_(id);
  if (!id) return null;
  const r = rows_('annotators').filter(function (x) { return normEmail_(x.annotator_id) === id; })[0];
  if (!r || r.active === false || String(r.active).toLowerCase() === 'false') return null;
  return { annotator_id: id, name: r.name };
}

function find_(id, traceId) {
  return rows_('annotations').filter(function (x) { return x.annotator_id === id && x.trace_id === traceId; })[0];
}

function progress_(id) {
  const p = {};
  rows_('annotations').forEach(function (x) {
    if (x.annotator_id === id) p[x.trace_id] = { status: x.status, n_labeled: x.n_labeled, n_flags: x.n_flags, n_unresolved: x.n_unresolved, server_updated: x.server_updated, version: x.version };
  });
  return p;
}

function practiced_(id) {
  return rows_('log').some(function (x) { return x.annotator_id === id && x.action === 'practice'; });
}

function load_(id, traceId) {
  const r = find_(id, traceId);
  if (!r) return { ok: true, found: false };
  return { ok: true, found: true, status: r.status, labels: parse_(r.labels_json, []), flags: parse_(r.flags_json, []), dwell_ms: parse_(r.dwell_json, []),
    active_ms: Number(r.active_ms) || 0, client_updated: r.client_updated, version: Number(r.version) || 0 };
}

function clean_(body) {
  const n = Math.max(0, Math.min(5000, Number(body.n_segments) || 0));
  const labels = [];
  for (let i = 0; i < n; i++) { const l = (body.labels || [])[i]; labels.push(LABELS.indexOf(l) >= 0 ? l : null); }
  const seen = {};
  const flags = (body.flags || []).map(function (f) {
    return { seg: Number(f.seg), segment_id: Number(f.segment_id), reason: REASONS.indexOf(f.reason) >= 0 ? f.reason : 'other',
      alts: (f.alts || []).filter(function (x) { return LABELS.indexOf(x) >= 0; }), note: String(f.note || '').slice(0, 1500), created: String(f.created || '') };
  }).filter(function (f) { if (!(isFinite(f.seg) && f.seg >= 0 && f.seg < n && f.note) || seen[f.seg]) return false; seen[f.seg] = 1; return true; });
  const dwell = [];
  for (let j = 0; j < n; j++) dwell.push(Math.max(0, Math.round(Number((body.dwell_ms || [])[j]) || 0)));
  let unresolved = 0;
  for (let k = 0; k < n; k++) if (!labels[k] && !seen[k]) unresolved++;
  return { n: n, labels: labels, flags: flags, dwell: dwell, n_labeled: labels.filter(function (x) { return x; }).length, unresolved: unresolved };
}

function fit_(obj) { const s = JSON.stringify(obj); return s.length <= CELL_MAX ? s : ''; }

function save_(id, body, submit) {
  const traceId = String(body.trace_id || '');
  if (!traceId) return { ok: false, error: 'no_trace' };
  const c = clean_(body);
  if (submit && (c.unresolved > 0 || c.n === 0)) return { ok: false, error: 'incomplete', n_unresolved: c.unresolved };
  const sh = sheet_('annotations');
  const r = find_(id, traceId);
  if (r && r.status === 'submitted') return { ok: false, error: 'locked', status: 'submitted' };
  const version = (r ? Number(r.version) || 0 : 0) + 1;
  const status = submit ? 'submitted' : (r && r.status === 'reopened' ? 'reopened' : 'draft');
  let flagsJson = JSON.stringify(c.flags);
  if (flagsJson.length > CELL_MAX) { c.flags.forEach(function (f) { f.note = f.note.slice(0, 300); }); flagsJson = JSON.stringify(c.flags); }
  const row = [id, traceId, status, JSON.stringify(c.labels), flagsJson, c.n, c.n_labeled, c.flags.length, c.unresolved,
    Number(body.active_ms) || 0, fit_(c.dwell), String(body.text_sha256 || ''), String(body.seg_sha256 || ''), String(body.client_updated || ''),
    now_(), submit ? now_() : (r ? r.submitted_at : ''), version, fit_(body.meta || {})];
  if (r) sh.getRange(r._row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  let payload = null;
  if (submit) {
    payload = { labels: c.labels, flags: c.flags, dwell_ms: c.dwell, active_ms: body.active_ms, seg_sha256: body.seg_sha256, meta: body.meta };
    if (JSON.stringify(payload).length > CELL_MAX) delete payload.dwell_ms;
    if (JSON.stringify(payload).length > CELL_MAX) payload = { labels: c.labels, note: 'flags omitted from log (too long); see Annotations sheet' };
  }
  log_(id, traceId, submit ? 'submit' : 'save', status, c.n_labeled, c.flags.length, payload);
  return { ok: true, status: status, version: version, server_updated: now_() };
}

function log_(id, traceId, action, status, nLab, nFlags, payload) {
  sheet_('log').appendRow([now_(), id, traceId, action, status, nLab, nFlags, payload ? JSON.stringify(payload).slice(0, CELL_MAX) : '']);
}

// ---------------- researcher ----------------
function admin_(body) {
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!key || body.admin_key !== key) return { ok: false, error: 'auth' };
  const a = body.action;
  if (a === 'admin_overview') {
    return {
      ok: true,
      annotators: rows_('annotators').map(function (x) { return { annotator_id: normEmail_(x.annotator_id), name: x.name, active: x.active, created_at: x.created_at }; }),
      annotations: rows_('annotations').map(function (x) { return { annotator_id: x.annotator_id, trace_id: x.trace_id, status: x.status, n_segments: x.n_segments, n_labeled: x.n_labeled, n_flags: x.n_flags, n_unresolved: x.n_unresolved, active_ms: x.active_ms, server_updated: x.server_updated, submitted_at: x.submitted_at, version: x.version }; })
    };
  }
  if (a === 'admin_add_annotator') {
    const id = normEmail_(body.annotator_id);
    if (!isEmail_(id)) return { ok: false, error: 'bad_id' };
    if (rows_('annotators').some(function (x) { return normEmail_(x.annotator_id) === id; })) return { ok: false, error: 'exists' };
    sheet_('annotators').appendRow([id, '', String(body.name || ''), true, now_()]);
    return { ok: true, annotator_id: id };
  }
  if (a === 'admin_set_active') {
    const r = rows_('annotators').filter(function (x) { return normEmail_(x.annotator_id) === normEmail_(body.annotator_id); })[0];
    if (!r) return { ok: false, error: 'not_found' };
    sheet_('annotators').getRange(r._row, 4).setValue(!!body.active);
    return { ok: true };
  }
  if (a === 'admin_reopen') {
    const r = find_(normEmail_(body.annotator_id), String(body.trace_id));
    if (!r) return { ok: false, error: 'not_found' };
    sheet_('annotations').getRange(r._row, 3).setValue('reopened');
    log_(r.annotator_id, r.trace_id, 'reopen', 'reopened', r.n_labeled, r.n_flags, null);
    return { ok: true };
  }
  if (a === 'admin_export') {
    return {
      ok: true, exported_at: now_(), format: 'trace-task-b/v1',
      annotations: rows_('annotations').map(function (x) {
        return { annotator_id: x.annotator_id, trace_id: x.trace_id, status: x.status, labels: parse_(x.labels_json, []), flags: parse_(x.flags_json, []),
          dwell_ms: parse_(x.dwell_json, []), active_ms: Number(x.active_ms) || 0, n_segments: Number(x.n_segments) || 0,
          text_sha256: x.text_sha256, seg_sha256: x.seg_sha256, submitted_at: x.submitted_at, server_updated: x.server_updated, version: x.version };
      })
    };
  }
  return { ok: false, error: 'unknown_action' };
}
