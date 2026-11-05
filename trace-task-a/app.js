/* TRACE · Task A — annotator app (sign in → guidelines → practice → traces). */
(function () {
  'use strict';
  const CFG = window.TASK_CONFIG || {};
  const API = (CFG.apiUrl || '').trim();
  const LOCAL_ONLY = !API;
  const TRACES = window.TRACES || [];
  const TBY = {}; TRACES.forEach(t => { TBY[t.id] = t; });
  const SYNC_MS = 20000;
  const READ_REQUIRED = 0.97;

  const $ = id => document.getElementById(id);
  const views = ['signin', 'guide', 'practice', 'traces', 'work', 'done'];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nowIso = () => new Date().toISOString();
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function jget(k, d) { try { const v = JSON.parse(lsGet(k)); return v == null ? d : v; } catch (e) { return d; } }
  const jset = (k, v) => lsSet(k, JSON.stringify(v));
  const ICON_FLAG = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 17.5V3 M5 3.5h9l-2 3.5 2 3.5H5"/></svg>';

  let toastT = 0;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }
  function note(el, kind, html) { el.className = 'note' + (kind ? ' ' + kind : ''); el.innerHTML = html; el.hidden = false; }
  function fmtTime(iso) { try { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function fmtMin(ms) { const m = Math.round((ms || 0) / 60000); return m < 1 ? '<1 min' : m + ' min'; }

  function typeset(el) {
    const go = () => { try { window.MathJax.typesetClear([el]); window.MathJax.typesetPromise([el]).catch(() => {}); } catch (e) {} };
    if (window.MathJax && window.MathJax.typesetPromise) go();
    else { let n = 0; const t = setInterval(() => { if (window.MathJax && window.MathJax.typesetPromise) { clearInterval(t); go(); } else if (++n > 80) clearInterval(t); }, 250); }
  }

  if (CFG.contactEmail) document.querySelectorAll('.contact-line').forEach(el => {
    el.innerHTML = 'Questions? Contact <a href="mailto:' + esc(CFG.contactEmail) + '">' + esc(CFG.contactEmail) + '</a>.';
  });
  $('metaTraces').textContent = TRACES.length + ' shared traces';

  // ---------------- session + API ----------------
  let S = jget('tta:session', null); // {id (email), name}
  const key = (...p) => 'tta:' + S.id + ':' + p.join(':');
  let serverProgress = {}, serverPracticed = false;

  async function api(action, payload) {
    if (LOCAL_ONLY) throw Object.assign(new Error('local'), { code: 'local' });
    const body = Object.assign({ action: action, annotator_id: S && S.id }, payload || {});
    const res = await fetch(API, { method: 'POST', body: JSON.stringify(body) });
    const j = await res.json();
    if (!j.ok) throw Object.assign(new Error(j.error || 'error'), { code: j.error });
    return j;
  }

  // ---------------- router ----------------
  function show(v) {
    views.forEach(n => { $('v-' + n).hidden = n !== v; });
    document.body.dataset.view = v;
    $('topnav').hidden = !S;
    if (S) $('whoChip').textContent = (S.name ? S.name + ' · ' : '') + S.id + (LOCAL_ONLY ? ' (local)' : '');
    window.scrollTo(0, 0);
  }
  function go(h) { if (location.hash.replace(/^#/, '') === h) route(); else location.hash = h; }
  const practiced = () => !!jget(key('practice'), false) || serverPracticed || Object.keys(serverProgress).length > 0;
  const agreed = () => !!jget(key('agreed'), false) || practiced();

  function route() {
    const h = location.hash.replace(/^#/, '');
    if (W.trace && !h.startsWith('trace/')) closeWork();
    if (!S) return show('signin');
    if (h === 'guide') return showGuide();
    if (h === 'practice') { if (!agreed()) return go('guide'); return showPractice(); }
    if (h === 'traces') { if (!agreed()) return go('guide'); if (!practiced()) return go('practice'); return showTraces(); }
    if (h.startsWith('trace/')) { if (!agreed()) return go('guide'); if (!practiced()) return go('practice'); return openWork(h.slice(6)); }
    if (h === 'done') return show('done');
    go(agreed() ? (practiced() ? 'traces' : 'practice') : 'guide');
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    const g = b.dataset.go; go(g === 'home' ? '' : g);
  });

  // ---------------- sign in ----------------
  $('signinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const id = $('inId').value.trim().toLowerCase();
    const n = $('signinNote'); n.hidden = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) return note(n, 'err', 'Please enter a valid email address.');
    if (LOCAL_ONLY) {
      S = { id: id, name: '' }; jset('tta:session', S);
      toast('Local mode: your work is kept in this browser.');
      return go('');
    }
    $('signinBtn').disabled = true;
    try {
      S = { id: id };
      const r = await api('login');
      S.name = r.name || ''; serverProgress = r.progress || {}; serverPracticed = !!r.practiced;
      jset('tta:session', S); go('');
    } catch (err) {
      S = null;
      note(n, 'err', err.code === 'auth' ? 'This email is not registered for the study. Use the address you gave the researcher, or contact them.' : 'Could not reach the server. Check your connection and try again.');
    } finally { $('signinBtn').disabled = false; }
  });
  $('signOutBtn').addEventListener('click', () => {
    if (W.trace) { flushSave(true); closeWork(); }
    lsDel('tta:session'); S = null; serverProgress = {}; serverPracticed = false; location.hash = ''; show('signin');
  });

  async function refreshProgress() {
    if (LOCAL_ONLY || !S) return;
    try { const r = await api('login'); serverProgress = r.progress || {}; serverPracticed = !!r.practiced; if (r.name) S.name = r.name; $('syncNote').hidden = true; }
    catch (err) {
      if (err.code === 'auth') { lsDel('tta:session'); S = null; location.hash = ''; show('signin'); note($('signinNote'), 'warn', 'Please sign in again.'); throw err; }
      note($('syncNote'), 'warn', 'Offline — showing the progress saved on this device. Your work will sync when the connection returns.');
    }
  }

  // ---------------- guidelines ----------------
  function showGuide() {
    show('guide');
    $('agree').checked = agreed();
    $('guideNext').disabled = !$('agree').checked;
    $('guideNextLabel').textContent = practiced() ? 'Continue to traces' : 'Continue to practice';
  }
  $('agree').addEventListener('change', () => { $('guideNext').disabled = !$('agree').checked; });
  $('guideNext').addEventListener('click', () => { jset(key('agreed'), true); go(practiced() ? 'traces' : 'practice'); });

  // =========================================================
  // Editor: renders locked source text; CUTs sit at word starts.
  // =========================================================
  function Editor(host, text, opts) {
    opts = opts || {};
    const ed = { text: text, cuts: new Set(), flags: new Map(), editable: true, mode: 'cut', undo: [], review: null };
    const words = []; // {start, el}
    const frag = document.createDocumentFragment();
    const re = /\S+[^\S\n]*/g; let m, last = 0; // a word plus its trailing spaces (newlines stay outside)
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const sp = document.createElement('span');
      sp.className = 'w' + (words.length === 0 ? ' w0' : '');
      sp.dataset.i = words.length; sp.textContent = m[0];
      frag.appendChild(sp); words.push({ start: m.index, el: sp });
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    host.textContent = ''; host.appendChild(frag);
    host.classList.add('trace');
    const byStart = new Map(words.map((w, i) => [w.start, i]));
    const chips = new Map(), fmarks = new Map();
    ed.words = words; ed.validPos = p => byStart.has(p) && byStart.get(p) > 0;

    function chip(pos, cls, label, title) {
      const c = document.createElement('span');
      c.className = 'cut' + (cls ? ' ' + cls : ''); c.dataset.pos = pos; c.textContent = label || 'CUT';
      if (title) c.title = title;
      const w = words[byStart.get(pos)].el;
      w.parentNode.insertBefore(c, w);
      chips.set(pos, c);
    }
    function unchip(pos) { const c = chips.get(pos); if (c) { c.remove(); chips.delete(pos); } }
    function fmark(pos) {
      if (fmarks.has(pos)) return;
      const f = document.createElement('span'); f.className = 'flagm'; f.dataset.pos = pos; f.innerHTML = ICON_FLAG; f.title = 'Uncertainty flag — click to edit';
      const anchor = chips.get(pos) || words[byStart.get(pos)].el;
      anchor.parentNode.insertBefore(f, anchor); fmarks.set(pos, f);
    }
    function unfmark(pos) { const f = fmarks.get(pos); if (f) { f.remove(); fmarks.delete(pos); } }

    ed.shade = function () {
      let s = 0;
      for (let i = 0; i < words.length; i++) {
        if (i > 0 && ed.cuts.has(words[i].start)) s ^= 1;
        const w = words[i].el, want = 'w' + (i === 0 ? ' w0' : '') + (s ? ' s1' : '') + (ed.cuts.has(words[i].start) ? ' hc' : '');
        if (w.className !== want) w.className = want;
      }
    };
    function changed() { ed.shade(); if (opts.onChange) opts.onChange(ed); }

    ed.addCut = function (pos, rec) { if (!ed.validPos(pos) || ed.cuts.has(pos)) return; ed.cuts.add(pos); chip(pos); const f = fmarks.get(pos); if (f) { unfmark(pos); fmark(pos); } if (rec !== false) ed.undo.push({ t: 'cut+', pos }); changed(); };
    ed.removeCut = function (pos, rec) { if (!ed.cuts.has(pos)) return; ed.cuts.delete(pos); unchip(pos); if (rec !== false) ed.undo.push({ t: 'cut-', pos }); changed(); };
    ed.setFlag = function (pos, val, rec) {
      const before = ed.flags.get(pos) || null;
      if (val) { ed.flags.set(pos, val); fmark(pos); } else { ed.flags.delete(pos); unfmark(pos); }
      if (rec !== false) ed.undo.push({ t: 'flag', pos, before });
      changed();
    };
    ed.doUndo = function () {
      const op = ed.undo.pop(); if (!op) return false;
      if (op.t === 'cut+') ed.removeCut(op.pos, false);
      else if (op.t === 'cut-') ed.addCut(op.pos, false);
      else ed.setFlag(op.pos, op.before, false);
      const i = byStart.get(op.pos); if (i != null) { words[i].el.classList.remove('pulse'); void words[i].el.offsetWidth; words[i].el.classList.add('pulse'); }
      return true;
    };
    ed.load = function (cuts, flags) {
      chips.forEach((c, p) => unchip(p)); fmarks.forEach((f, p) => unfmark(p));
      ed.cuts = new Set(); ed.flags = new Map(); ed.undo = [];
      (cuts || []).forEach(p => { if (ed.validPos(p) && !ed.cuts.has(p)) { ed.cuts.add(p); chip(p); } });
      (flags || []).forEach(f => { if (ed.validPos(f.pos)) { ed.flags.set(f.pos, { note: f.note, created: f.created }); fmark(f.pos); } });
      ed.shade();
    };
    ed.cutList = () => Array.from(ed.cuts).sort((a, b) => a - b);
    ed.flagList = () => Array.from(ed.flags.entries()).sort((a, b) => a[0] - b[0]).map(([pos, v]) => ({ pos, note: v.note, created: v.created }));
    ed.setEditable = function (on) { ed.editable = on; host.classList.toggle('edit', on); };
    ed.setMode = function (mode) { ed.mode = mode; host.classList.toggle('mode-cut', mode === 'cut'); host.classList.toggle('mode-flag', mode === 'flag'); };
    ed.wordAt = pos => { const i = byStart.get(pos); return i == null ? '' : words[i].el.textContent.trim(); };
    ed.context = function (pos, n) {
      const i = byStart.get(pos); if (i == null) return '';
      const a = words.slice(Math.max(0, i - (n || 4)), i).map(w => w.el.textContent.trim()).join(' ');
      const b = words.slice(i, i + (n || 4)).map(w => w.el.textContent.trim()).join(' ');
      return { before: a, after: b };
    };
    ed.scrollTo = function (pos) {
      const i = byStart.get(pos); if (i == null) return;
      const el = words[i].el; el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    };
    // Review mode (practice feedback): reference = Map(pos -> {optional, why})
    ed.showReview = function (ref) {
      chips.forEach((c, p) => unchip(p));
      const all = new Set([...ed.cuts, ...ref.keys()]);
      Array.from(all).sort((a, b) => a - b).forEach(p => {
        const mine = ed.cuts.has(p), r = ref.get(p);
        if (mine && r) chip(p, r.optional ? 'opt' : '', r.optional ? 'CUT · OK' : 'CUT ✓', r.why);
        else if (mine) chip(p, 'extra', 'EXTRA', 'Not in the reference');
        else if (r && !r.optional) chip(p, 'miss', 'MISSED', r.why);
      });
    };
    ed.hideReview = function () { chips.forEach((c, p) => unchip(p)); ed.cutList().forEach(p => chip(p)); };

    host.addEventListener('click', e => {
      if (!ed.editable) return;
      const sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length > 0) return; // user is selecting text to read
      const c = e.target.closest('.cut');
      if (c && host.contains(c)) { ed.removeCut(Number(c.dataset.pos)); return; }
      const f = e.target.closest('.flagm');
      if (f && opts.onFlag) { opts.onFlag(Number(f.dataset.pos)); return; }
      const w = e.target.closest('.w');
      if (!w || w.classList.contains('w0')) return;
      const pos = words[Number(w.dataset.i)].start;
      if (ed.mode === 'flag') { if (opts.onFlag) opts.onFlag(pos); }
      else if (!ed.cuts.has(pos)) ed.addCut(pos);
    });
    ed.setEditable(true); ed.setMode('cut'); ed.shade();
    return ed;
  }

  // ---------------- practice ----------------
  const PRACTICE = [
    {
      title: 'Practice 1 · the worked example',
      text: 'Compute u = 2 + 3. The result is u = 5. Check: u − 3 = 2, then compute v: v = 2u = 10.',
      ref: [
        { before: 'Check: u', why: 'A check begins. The calculation “Compute u = 2 + 3” stays with its stated result “u = 5”.' },
        { before: 'then compute v', why: 'A distinct new calculation begins inside the same sentence.' }
      ]
    },
    {
      title: 'Practice 2 · a short reasoning passage',
      text: 'Okay, so we need the remainder when 7^100 is divided by 5. First, reduce the base: 7 ≡ 2 (mod 5), so 7^100 ≡ 2^100. Next, the powers of 2 mod 5 are 2, 4, 3, 1, so they repeat every 3 steps — no wait, that is four values, so the period is 4. Since 100 = 4 · 25, we get 2^100 ≡ 1 (mod 5). Let me double-check the cycle: 2^4 = 16, and 16 mod 5 = 1, so the cycle is right. Actually, let me use Fermat\'s little theorem instead, since it is quicker. By Fermat, 7^4 ≡ 1 (mod 5), so 7^100 = (7^4)^25 ≡ 1. So the remainder is 1.',
      ref: [
        { before: 'First, reduce', why: 'A calculation begins; its lead-in “First, reduce the base:” stays with it.' },
        { before: 'Next, the powers', why: 'A new calculation (the cycle of powers of 2) begins.' },
        { before: 'no wait, that', why: 'An explicit correction begins mid-sentence. The replacement “the period is 4” stays with the correction.' },
        { before: 'Since 100', why: 'A new inference that uses the period.' },
        { before: 'Let me double-check', why: 'A check begins; “Let me double-check the cycle:” is its lead-in.' },
        { before: 'Actually, let me use', why: 'A method choice (switching to Fermat’s little theorem).' },
        { before: 'By Fermat,', why: 'Either is acceptable: the new method’s calculation may stay with the method choice or start its own segment.', optional: true },
        { before: 'So the remainder', why: 'The final conclusion is a distinct inference.' }
      ]
    }
  ];
  let practiceBuilt = false;
  function showPractice() {
    show('practice');
    if (practiceBuilt) return;
    practiceBuilt = true;
    const list = $('practiceList'); list.textContent = '';
    const checked = new Set();
    PRACTICE.forEach((p, idx) => {
      const card = document.createElement('div'); card.className = 'card prac';
      card.innerHTML = '<p class="cap">' + esc(p.title) + '</p><div class="pt"></div><div class="row" style="margin-top:18px">' +
        '<button type="button" class="btn primary sm chk">Check my boundaries</button>' +
        '<button type="button" class="quiet und"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 5L3.5 9l4 4 M4 9h8a4.5 4.5 0 010 9H9"/></svg>Undo</button>' +
        '<button type="button" class="quiet again" hidden>Try again</button></div><div class="prac-fb" hidden></div>';
      list.appendChild(card);
      const ed = Editor(card.querySelector('.pt'), p.text, {});
      const ref = new Map();
      p.ref.forEach(r => { const i = p.text.indexOf(r.before); if (i > 0) ref.set(i, r); });
      const fb = card.querySelector('.prac-fb');
      card.querySelector('.und').addEventListener('click', () => ed.doUndo());
      card.querySelector('.chk').addEventListener('click', () => {
        const mine = ed.cuts;
        const req = [...ref.entries()].filter(([, r]) => !r.optional);
        const hit = req.filter(([pos]) => mine.has(pos)).length;
        const extra = [...mine].filter(pos => !ref.has(pos)).length;
        ed.setEditable(false); ed.showReview(ref);
        card.querySelector('.chk').hidden = true; card.querySelector('.und').hidden = true; card.querySelector('.again').hidden = false;
        fb.hidden = false;
        fb.innerHTML = '<p><b>' + hit + ' of ' + req.length + '</b> reference boundaries found' + (extra ? ', <b>' + extra + '</b> extra' : '') + '.</p>' +
          '<div class="legend"><span><span class="cut">CUT ✓</span>matches</span><span><span class="cut miss">MISSED</span>reference boundary you did not mark</span><span><span class="cut extra">EXTRA</span>not in the reference</span><span><span class="cut opt">CUT · OK</span>acceptable either way</span></div>' +
          '<ul>' + [...ref.entries()].sort((a, b) => a[0] - b[0]).map(([pos, r]) => '<li><b>Before “' + esc(r.before) + '…”</b> — ' + esc(r.why) + '</li>').join('') + '</ul>' +
          '<p class="muted small">Hover a marker to see why. Practice is not scored; the reference shows how the rules apply.</p>';
        checked.add(idx);
        if (S) api('practice', { item: idx, n_cuts: mine.size, hit: hit, extra: extra }).catch(() => {});
        if (checked.size === PRACTICE.length) $('practiceDone').disabled = false;
      });
      card.querySelector('.again').addEventListener('click', () => {
        ed.hideReview(); ed.setEditable(true); fb.hidden = true;
        card.querySelector('.chk').hidden = false; card.querySelector('.und').hidden = false; card.querySelector('.again').hidden = true;
      });
    });
    if (jget(key('practice'), false)) $('practiceDone').disabled = false;
  }
  $('practiceDone').addEventListener('click', () => { jset(key('practice'), true); go('traces'); });

  // ---------------- trace list ----------------
  function localDraft(tid) { return jget(key('draft', tid), null); }
  function statusOf(tid) {
    const l = localDraft(tid), s = serverProgress[tid];
    if ((s && s.status === 'submitted') || (l && l.status === 'submitted' && (LOCAL_ONLY || !s || s.status !== 'reopened'))) return 'submitted';
    if (s && s.status === 'reopened') return 'reopened';
    if ((l && (l.cuts.length || l.flags.length)) || s) return 'draft';
    return 'new';
  }
  async function showTraces() {
    show('traces');
    renderTraceList();
    try { await refreshProgress(); } catch (e) { return; }
    renderTraceList();
  }
  function renderTraceList() {
    const list = $('traceList'); list.textContent = '';
    let done = 0;
    TRACES.forEach(t => {
      const st = statusOf(t.id); if (st === 'submitted') done++;
      const l = localDraft(t.id), s = serverProgress[t.id] || {};
      const nCuts = l ? l.cuts.length : (s.n_cuts || 0);
      const card = document.createElement('div'); card.className = 'card tcard';
      const label = { new: 'Not started', draft: 'In progress', submitted: 'Submitted', reopened: 'Reopened' }[st];
      card.innerHTML = '<div><h3>' + esc(t.label) + '<span class="pill ' + st + '">' + label + '</span></h3>' +
        '<p class="muted">' + t.words.toLocaleString() + ' words' +
        (st !== 'new' ? ' · ' + nCuts + ' CUTs' + (l && l.active_ms ? ' · ' + fmtMin(l.active_ms) + ' active' : '') : '') + '</p></div>' +
        '<button class="btn ' + (st === 'submitted' ? '' : 'primary sm') + '" type="button">' + (st === 'submitted' ? 'View' : st === 'new' ? 'Start' : 'Continue') + '</button>';
      card.querySelector('button').addEventListener('click', () => go('trace/' + t.id));
      list.appendChild(card);
    });
    if (LOCAL_ONLY) note($('syncNote'), 'warn', '<b>Local mode.</b> No server is configured, so your work is saved only in this browser.');
    if (done === TRACES.length && TRACES.length) {
      const n = document.createElement('div'); n.className = 'note';
      n.innerHTML = '<b>All traces submitted.</b> Thank you — you can close this page.';
      list.prepend(n);
    }
  }
  // ---------------- workspace ----------------
  const W = { trace: null, ed: null, status: 'draft', activeMs: 0, lastAct: 0, readMax: 0, dirty: false, saving: false, lastSync: '', tick: 0, version: 0, clientUpdated: '' };

  function setSave(txt, err) { const s = $('saveState'); s.textContent = txt; s.classList.toggle('err', !!err); }
  function draftObj() {
    return { cuts: W.ed.cutList(), flags: W.ed.flagList(), active_ms: W.activeMs, read_pct: Math.round(W.readMax * 1000) / 1000, status: W.status, client_updated: W.clientUpdated, version: W.version };
  }
  function saveLocal() { W.clientUpdated = nowIso(); jset(key('draft', W.trace.id), draftObj()); }
  function payload() {
    const d = draftObj();
    return { trace_id: W.trace.id, cuts: d.cuts, flags: d.flags, active_ms: d.active_ms, read_pct: d.read_pct, text_sha256: W.trace.sha256, client_updated: d.client_updated,
      meta: { ua: navigator.userAgent.slice(0, 160), viewport: innerWidth + 'x' + innerHeight, undo_depth: W.ed.undo.length } };
  }
  async function syncNow() {
    if (LOCAL_ONLY || !W.trace || W.saving || !W.dirty || W.status === 'submitted') return;
    W.saving = true; W.dirty = false;
    try {
      const r = await api('save', payload());
      W.version = r.version; if (r.status) W.status = r.status; W.lastSync = r.server_updated;
      jset(key('draft', W.trace.id), draftObj());
      setSave('Saved · ' + fmtTime(r.server_updated));
    } catch (err) {
      W.dirty = true;
      if (err.code === 'locked') { const id = W.trace.id; lsDel(key('draft', id)); W.trace = null; openWork(id); toast('This trace was submitted from another device.'); }
      else setSave('Saved on this device · will sync', true);
    } finally { W.saving = false; }
  }
  function flushSave(beacon) {
    if (!W.trace || W.status === 'submitted') return;
    saveLocal();
    if (LOCAL_ONLY || !W.dirty) return;
    if (beacon && navigator.sendBeacon) {
      try { navigator.sendBeacon(API, new Blob([JSON.stringify(Object.assign({ action: 'save', annotator_id: S.id }, payload()))], { type: 'text/plain' })); W.dirty = false; } catch (e) {}
    } else syncNow();
  }

  function updateStats() {
    const ed = W.ed;
    $('stSeg').textContent = ed.cuts.size + 1; $('stCut').textContent = ed.cuts.size; $('stFlag').textContent = ed.flags.size;
    $('stRead').textContent = Math.round(W.readMax * 100) + '%';
    $('readFill').style.width = Math.round(W.readMax * 100) + '%';
    $('undoBtn').disabled = !ed.undo.length || W.status === 'submitted';
    renderFlags();
  }
  function renderFlags() {
    const ol = $('flagList'); ol.textContent = '';
    const fl = W.ed.flagList(); $('flagEmpty').hidden = fl.length > 0;
    fl.forEach(f => {
      const c = W.ed.context(f.pos, 3);
      const li = document.createElement('li');
      li.innerHTML = '<span class="fl-ctx">…' + esc(c.before) + ' <b>|</b> ' + esc(c.after) + '…</span><span class="fl-note">' + esc(f.note) + '</span>' +
        '<button type="button" class="link go">Show</button>' + (W.status !== 'submitted' ? ' · <button type="button" class="link edit">Edit</button>' : '');
      li.querySelector('.go').addEventListener('click', () => W.ed.scrollTo(f.pos));
      const e = li.querySelector('.edit'); if (e) e.addEventListener('click', () => openFlag(f.pos));
      ol.appendChild(li);
    });
  }
  function onChange() {
    W.dirty = true; W.lastAct = Date.now();
    saveLocal(); updateStats();
    setSave(LOCAL_ONLY ? 'Saved on this device' : 'Unsaved changes…');
    clearTimeout(W.syncT); W.syncT = setTimeout(syncNow, 4000);
  }

  function computeRead() {
    if (!W.trace) return;
    const r = $('trace').getBoundingClientRect();
    if (r.height <= 0) return;
    const seen = Math.min(1, Math.max(0, (innerHeight - r.top) / r.height));
    if (seen > W.readMax + 0.004) { W.readMax = seen; $('stRead').textContent = Math.round(seen * 100) + '%'; $('readFill').style.width = Math.round(seen * 100) + '%'; }
  }
  let readRaf = 0;
  window.addEventListener('scroll', () => { W.lastAct = Date.now(); if (!readRaf) readRaf = requestAnimationFrame(() => { readRaf = 0; computeRead(); }); }, { passive: true });
  ['mousemove', 'keydown', 'pointerdown', 'wheel', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { W.lastAct = Date.now(); }, { passive: true }));

  function applyLock() {
    const locked = W.status === 'submitted';
    W.ed.setEditable(!locked);
    $('lockedNote').hidden = !locked;
    $('submitBtn').disabled = locked; $('submitBtn').textContent = locked ? 'Submitted' : 'Review & submit';
    $('toolCut').disabled = locked; $('toolFlag').disabled = locked;
    updateStats();
  }
  function setTool(mode) {
    W.ed.setMode(mode);
    $('toolCut').classList.toggle('on', mode === 'cut'); $('toolCut').setAttribute('aria-pressed', mode === 'cut');
    $('toolFlag').classList.toggle('on', mode === 'flag'); $('toolFlag').setAttribute('aria-pressed', mode === 'flag');
  }
  $('toolCut').addEventListener('click', () => setTool('cut'));
  $('toolFlag').addEventListener('click', () => setTool('flag'));
  $('undoBtn').addEventListener('click', () => { if (W.ed && W.status !== 'submitted') W.ed.doUndo(); });
  $('shade').addEventListener('change', () => { $('trace').classList.toggle('shade', $('shade').checked); jset('tta:shade', $('shade').checked); });
  document.addEventListener('keydown', e => {
    if (!W.trace || document.body.dataset.view !== 'work') return;
    if (e.target.closest('input, textarea, dialog[open]')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); if (W.status !== 'submitted') W.ed.doUndo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || W.status === 'submitted') return;
    if (e.key === 'c' || e.key === 'C') setTool('cut');
    if (e.key === 'f' || e.key === 'F') setTool('flag');
  });

  async function openWork(tid) {
    const t = TBY[tid]; if (!t) return go('traces');
    if (W.trace && W.trace.id === tid) return show('work');
    show('work');
    W.trace = t; W.dirty = false; W.saving = false; W.readMax = 0; W.lastAct = Date.now();
    $('wTitle').textContent = t.label;
    $('wSub').textContent = t.words.toLocaleString() + ' words · click before a word to insert CUT';
    $('problem').textContent = t.question; typeset($('problem'));
    const host = $('trace');
    host.textContent = 'Loading…';
    await new Promise(r => setTimeout(r, 0));
    W.ed = Editor(host, t.text, { onChange: onChange, onFlag: openFlag });
    host.classList.toggle('shade', jget('tta:shade', true) !== false); $('shade').checked = host.classList.contains('shade');
    setTool('cut');
    // local first, then reconcile with the server
    let d = localDraft(tid), localAhead = false;
    if (!LOCAL_ONLY) {
      setSave('Loading…');
      try {
        const r = await api('load', { trace_id: tid });
        if (W.trace !== t) return;
        if (r.found && (!d || r.status === 'submitted' || r.status === 'reopened' && d.status === 'submitted' || String(r.client_updated || '') >= String(d.client_updated || ''))) {
          d = { cuts: r.cuts, flags: r.flags, active_ms: r.active_ms, read_pct: r.read_pct, status: r.status, client_updated: r.client_updated, version: r.version };
        } else if (d) {
          if (r.found && r.status === 'reopened') d.status = 'reopened';
          if (d.status === 'submitted') d.status = r.found ? r.status : 'draft'; // a submit that never reached the server
          localAhead = true;
        }
        setSave(localAhead ? 'Unsynced changes…' : r.found ? 'Synced' : 'Not saved yet');
      } catch (err) { if (W.trace !== t) return; setSave('Offline · saving on this device', true); }
    }
    d = d || { cuts: [], flags: [], active_ms: 0, read_pct: 0, status: 'draft', client_updated: '', version: 0 };
    W.ed.load(d.cuts, d.flags);
    W.activeMs = d.active_ms || 0; W.readMax = d.read_pct || 0; W.status = d.status || 'draft'; W.clientUpdated = d.client_updated || ''; W.version = d.version || 0;
    if (localAhead) { W.dirty = true; setTimeout(syncNow, 1000); }
    applyLock(); computeRead();
    if (LOCAL_ONLY) setSave(d.client_updated ? 'Saved on this device' : '');
    clearInterval(W.tick);
    W.tick = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - W.lastAct < 60000 && W.status !== 'submitted') {
        W.activeMs += 5000;
        if (W.activeMs % 30000 === 0) jset(key('draft', W.trace.id), draftObj());
      }
      if (Date.now() % SYNC_MS < 5000) syncNow();
    }, 5000);
  }
  function closeWork() {
    if (!W.trace) return;
    flushSave(false);
    clearInterval(W.tick); clearTimeout(W.syncT);
    W.trace = null; W.ed = null; $('trace').textContent = '';
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(true); });
  window.addEventListener('pagehide', () => flushSave(true));

  // ---------------- flags ----------------
  let flagPos = null;
  function openFlag(pos) {
    if (!W.ed || W.status === 'submitted') return;
    flagPos = pos;
    const cur = W.ed.flags.get(pos);
    $('flagWord').textContent = W.ed.wordAt(pos);
    $('flagNote').value = cur ? cur.note : '';
    $('flagDelete').hidden = !cur;
    $('flagDlg').showModal(); $('flagNote').focus();
  }
  $('flagDlg').addEventListener('close', () => {
    if ($('flagDlg').returnValue === 'ok' && flagPos != null) {
      const v = $('flagNote').value.trim();
      if (v) { const cur = W.ed.flags.get(flagPos); W.ed.setFlag(flagPos, { note: v, created: cur ? cur.created : nowIso() }); toast('Flag saved'); }
    }
    flagPos = null; $('flagDlg').returnValue = '';
  });
  $('flagDelete').addEventListener('click', () => { if (flagPos != null) W.ed.setFlag(flagPos, null); flagPos = null; $('flagDlg').close('cancel'); });

  // ---------------- submit ----------------
  $('submitBtn').addEventListener('click', () => {
    if (!W.ed || W.status === 'submitted') return;
    computeRead();
    $('subTitle').textContent = W.trace.label;
    $('subSummary').textContent = (W.ed.cuts.size + 1) + ' segments · ' + W.ed.cuts.size + ' CUTs · ' + W.ed.flags.size + ' uncertainty flags · ' + Math.round(W.readMax * 100) + '% of the trace scrolled through.';
    document.querySelectorAll('.subchk').forEach(c => { c.checked = false; });
    const unread = W.readMax < READ_REQUIRED;
    if (unread) note($('subNote'), 'warn', 'Please scroll through the <b>whole trace</b> before submitting (currently ' + Math.round(W.readMax * 100) + '%).'); else $('subNote').hidden = true;
    $('subConfirm').disabled = true; $('subConfirm').dataset.blocked = unread ? '1' : '';
    $('submitDlg').showModal();
  });
  document.querySelectorAll('.subchk').forEach(c => c.addEventListener('change', () => {
    $('subConfirm').disabled = !!$('subConfirm').dataset.blocked || ![...document.querySelectorAll('.subchk')].every(x => x.checked);
  }));
  $('submitDlg').addEventListener('close', async () => {
    if ($('submitDlg').returnValue !== 'ok') return;
    $('submitDlg').returnValue = '';
    const prev = W.status;
    if (LOCAL_ONLY) {
      W.status = 'submitted'; saveLocal(); applyLock(); setSave('Submitted (this device)');
      toast('Trace submitted (saved on this device).');
      return afterSubmit();
    }
    setSave('Submitting…'); $('submitBtn').disabled = true;
    try {
      W.status = 'submitted'; saveLocal();
      const r = await api('submit', payload());
      W.version = r.version; W.status = 'submitted'; jset(key('draft', W.trace.id), draftObj());
      serverProgress[W.trace.id] = { status: 'submitted' };
      applyLock(); setSave('Submitted · ' + fmtTime(r.server_updated)); toast('Trace submitted. Thank you!');
      afterSubmit();
    } catch (err) {
      if (err.code === 'locked') { W.status = 'submitted'; applyLock(); return toast('This trace was already submitted.'); }
      W.status = prev; saveLocal(); applyLock();
      setSave('Submit failed — try again', true); toast('Could not submit. Check your connection and try again.');
    }
  });
  function afterSubmit() {
    if (TRACES.every(t => statusOf(t.id) === 'submitted')) setTimeout(() => go('done'), 900);
  }

  // ---------------- boot ----------------
  (async function boot() {
    if (S && !LOCAL_ONLY) { try { await refreshProgress(); } catch (e) { /* signed out */ } }
    route();
  })();
})();
