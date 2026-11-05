/**
 * TRACE · Task A — Google Apps Script backend.
 *
 * Setup (once):
 *   1. Create a new Google Sheet. Extensions → Apps Script. Paste this file as Code.gs.
 *   2. Run `setup` once from the editor (authorize when asked). It creates the sheets
 *      and prints the ADMIN KEY in the execution log (also stored in Script Properties).
 *   3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 *      Copy the /exec URL into trace-task-a/config.js (apiUrl).
 *   4. Open trace-task-a/admin.html, paste the admin key, and add your annotators by email.
 *      Annotators sign in with that email address.
 *
 * Sheets:
 *   Annotators  — one row per annotator (email, name, active)
 *   Annotations — latest state per (annotator, trace): cuts, flags, status
 *   Log         — append-only history (every submit stores the full payload)
 */

const SHEETS = {
  annotators: ['annotator_id', 'access_code', 'name', 'active', 'created_at'],
  annotations: ['annotator_id', 'trace_id', 'status', 'cuts_json', 'flags_json', 'n_cuts', 'n_flags',
    'active_ms', 'read_pct', 'text_sha256', 'client_updated', 'server_updated', 'submitted_at', 'version', 'meta_json'],
  log: ['server_ts', 'annotator_id', 'trace_id', 'action', 'status', 'n_cuts', 'n_flags', 'payload_json']
};

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

function rows_(k) {
  const sh = sheet_(k);
  const v = sh.getDataRange().getValues();
  const head = v.shift();
  return v.map(function (r, i) { const o = { _row: i + 2 }; head.forEach(function (h, j) { o[h] = r[j]; }); return o; });
}

function doGet() { return out_({ ok: true, service: 'trace-task-a' }); }

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
    if (a === 'practice') { log_(who.annotator_id, 'practice', 'practice', 'done', body.n_cuts || 0, 0, body); return out_({ ok: true }); }
    return out_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, error: 'server', detail: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function normEmail_(e) { return String(e || '').trim().toLowerCase(); }
function isEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120; }

// Annotators sign in with the email address the researcher registered.
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
    if (x.annotator_id === id) p[x.trace_id] = { status: x.status, n_cuts: x.n_cuts, n_flags: x.n_flags, server_updated: x.server_updated, version: x.version };
  });
  return p;
}

function practiced_(id) {
  return rows_('log').some(function (x) { return x.annotator_id === id && x.action === 'practice'; });
}

function load_(id, traceId) {
  const r = find_(id, traceId);
  if (!r) return { ok: true, found: false };
  return { ok: true, found: true, status: r.status, cuts: JSON.parse(r.cuts_json || '[]'), flags: JSON.parse(r.flags_json || '[]'),
    active_ms: Number(r.active_ms) || 0, read_pct: Number(r.read_pct) || 0, client_updated: r.client_updated, version: Number(r.version) || 0 };
}

function clean_(body) {
  const cuts = (body.cuts || []).map(Number).filter(function (n) { return isFinite(n) && n > 0; });
  cuts.sort(function (a, b) { return a - b; });
  const flags = (body.flags || []).map(function (f) { return { pos: Number(f.pos), note: String(f.note || '').slice(0, 4000), created: f.created || '' }; })
    .filter(function (f) { return isFinite(f.pos); });
  return { cuts: cuts, flags: flags };
}

function save_(id, body, submit) {
  const traceId = String(body.trace_id || '');
  if (!traceId) return { ok: false, error: 'no_trace' };
  const c = clean_(body);
  const sh = sheet_('annotations');
  const r = find_(id, traceId);
  if (r && r.status === 'submitted') return { ok: false, error: 'locked', status: 'submitted' };
  const version = (r ? Number(r.version) || 0 : 0) + 1;
  const status = submit ? 'submitted' : (r && r.status === 'reopened' ? 'reopened' : 'draft');
  const row = [id, traceId, status, JSON.stringify(c.cuts), JSON.stringify(c.flags), c.cuts.length, c.flags.length,
    Number(body.active_ms) || 0, Number(body.read_pct) || 0, String(body.text_sha256 || ''), String(body.client_updated || ''),
    now_(), submit ? now_() : (r ? r.submitted_at : ''), version, JSON.stringify(body.meta || {})];
  if (r) sh.getRange(r._row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  log_(id, traceId, submit ? 'submit' : 'save', status, c.cuts.length, c.flags.length,
    submit ? { cuts: c.cuts, flags: c.flags, active_ms: body.active_ms, meta: body.meta } : null);
  return { ok: true, status: status, version: version, server_updated: now_() };
}

function log_(id, traceId, action, status, nCuts, nFlags, payload) {
  sheet_('log').appendRow([now_(), id, traceId, action, status, nCuts, nFlags, payload ? JSON.stringify(payload) : '']);
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
      annotations: rows_('annotations').map(function (x) { return { annotator_id: x.annotator_id, trace_id: x.trace_id, status: x.status, n_cuts: x.n_cuts, n_flags: x.n_flags, active_ms: x.active_ms, read_pct: x.read_pct, server_updated: x.server_updated, submitted_at: x.submitted_at, version: x.version }; })
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
    log_(r.annotator_id, r.trace_id, 'reopen', 'reopened', r.n_cuts, r.n_flags, null);
    return { ok: true };
  }
  if (a === 'admin_export') {
    return {
      ok: true, exported_at: now_(), format: 'trace-task-a/v1',
      annotations: rows_('annotations').map(function (x) {
        return { annotator_id: x.annotator_id, trace_id: x.trace_id, status: x.status, cuts: JSON.parse(x.cuts_json || '[]'),
          flags: JSON.parse(x.flags_json || '[]'), active_ms: Number(x.active_ms) || 0, read_pct: Number(x.read_pct) || 0,
          text_sha256: x.text_sha256, submitted_at: x.submitted_at, server_updated: x.server_updated, version: x.version };
      })
    };
  }
  return { ok: false, error: 'unknown_action' };
}
