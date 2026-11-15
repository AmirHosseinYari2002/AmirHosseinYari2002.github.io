/* TRACE · Task A — annotator app for the window design of taskA_human_validation.ipynb.
   Flow: sign in → guidelines → warm-up (2 passages with feedback) → the annotator's queue
   (3 practice windows, then the study windows, in the order of data/assignments.json).
   Data: data/items.json + data/assignments.json, copied unchanged from TaskA/platform/ (Part A).
   Every CUT is a code-point offset in window_text at the start of a unit (regex \w+|[^\w\s]),
   which is exactly what Part B's snap_units() reads back. */
(function () {
  'use strict';
  const CFG = window.TASK_CONFIG || {};
  const API = (CFG.apiUrl || '').trim();
  const LOCAL_ONLY = !API;
  const SYNC_MS = 20000;
  const READ_REQUIRED = 0.97;

  const $ = id => document.getElementById(id);
  const views = ['signin', 'guide', 'practice', 'queue', 'work', 'done'];
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
  function typeset(el) {
    const go = () => { try { window.MathJax.typesetClear([el]); window.MathJax.typesetPromise([el]).catch(() => {}); } catch (e) {} };
    if (window.MathJax && window.MathJax.typesetPromise) go();
    else { let n = 0; const t = setInterval(() => { if (window.MathJax && window.MathJax.typesetPromise) { clearInterval(t); go(); } else if (++n > 80) clearInterval(t); }, 250); }
  }
  async function digest(algo, str) {
    try {
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { // no WebCrypto (insecure context): a stable non-cryptographic fallback
      let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      return 'fnv' + (h >>> 0).toString(16);
    }
  }

  if (CFG.contactEmail) document.querySelectorAll('.contact-line').forEach(el => {
    el.innerHTML = 'Questions? Contact <a href="mailto:' + esc(CFG.contactEmail) + '">' + esc(CFG.contactEmail) + '</a>.';
  });
  if (CFG.dryRun) { $('dryBanner').innerHTML = '<b>Test data.</b> ' + esc(CFG.datasetLabel || 'This is not the final sample; annotations made now will not be used.'); $('dryBanner').hidden = false; }

  // ---------------- data ----------------
  const D = { items: [], byId: {}, assign: {}, id: '', sha1: {} };
  async function loadData() {
    const [items, assign] = await Promise.all([
      fetch('data/items.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('items'); return r.json(); }),
      fetch('data/assignments.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('assignments'); return r.json(); })
    ]);
    D.items = items; D.assign = assign;
    items.forEach(it => { D.byId[it.item_id] = it; });
    // Fingerprint of this set of platform files: records are stored per dataset, so annotations of a
    // dry run can never be mixed with (or loaded into) the final sample, even if item IDs repeat.
    D.id = (await digest('SHA-256', JSON.stringify([items.map(i => [i.item_id, i.window_text]), assign]))).slice(0, 16);
    await Promise.all(items.map(async it => { D.sha1[it.item_id] = await digest('SHA-1', it.window_text); })); // = key.csv window_sha1
  }
  const nPractice = () => D.items.filter(i => i.practice).length;
  const nMain = () => D.items.filter(i => !i.practice).length;
  function queue() { return (S && S.slot && D.assign[S.slot]) ? D.assign[S.slot].filter(id => D.byId[id]) : []; }

  // ---------------- session + API ----------------
  let S = jget('tta2:session', null); // {id (email), name, slot}
  const key = (...p) => 'tta2:' + S.id + ':' + D.id + ':' + p.join(':');
  let serverProgress = {}, serverWarmup = false;

  async function api(action, payload) {
    if (LOCAL_ONLY) throw Object.assign(new Error('local'), { code: 'local' });
    const body = Object.assign({ action: action, annotator_id: S && S.id, dataset_id: D.id }, payload || {});
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
  const warmed = () => !!jget('tta2:' + S.id + ':warmup', false) || serverWarmup || Object.keys(serverProgress).length > 0;
  const agreed = () => !!jget('tta2:' + S.id + ':agreed', false) || warmed();

  function route() {
    const h = location.hash.replace(/^#/, '');
    if (W.item && !h.startsWith('w/')) closeWork();
    if (!S) return show('signin');
    if (h === 'guide') return showGuide();
    if (h === 'warmup') { if (!agreed()) return go('guide'); return showPractice(); }
    if (h === 'queue') { if (!agreed()) return go('guide'); if (!warmed()) return go('warmup'); return showQueue(); }
    if (h.startsWith('w/')) { if (!agreed()) return go('guide'); if (!warmed()) return go('warmup'); return openWork(decodeURIComponent(h.slice(2))); }
    if (h === 'done') return show('done');
    go(agreed() ? (warmed() ? 'queue' : 'warmup') : 'guide');
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    const g = b.dataset.go; go(g === 'home' ? '' : g);
  });

  // ---------------- sign in ----------------
  function applyLogin(r) { S.name = r.name || ''; S.slot = r.slot || ''; serverProgress = r.progress || {}; serverWarmup = !!r.warmup_done; jset('tta2:session', S); }
  $('signinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const id = $('inId').value.trim().toLowerCase();
    const n = $('signinNote'); n.hidden = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) return note(n, 'err', 'Please enter a valid email address.');
    if (LOCAL_ONLY) {
      S = { id: id, name: '', slot: Object.keys(D.assign)[0] || '' }; jset('tta2:session', S);
      toast('Local mode: your work is kept in this browser.');
      return go('');
    }
    $('signinBtn').disabled = true;
    try {
      S = { id: id };
      applyLogin(await api('login'));
      go('');
    } catch (err) {
      S = null;
      note(n, 'err', err.code === 'auth' ? 'This email is not registered for the study. Use the address you gave the researcher, or contact them.' : 'Could not reach the server. Check your connection and try again.');
    } finally { $('signinBtn').disabled = false; }
  });
  $('signOutBtn').addEventListener('click', () => {
    if (W.item) { flushSave(true); closeWork(); }
    lsDel('tta2:session'); S = null; serverProgress = {}; serverWarmup = false; location.hash = ''; show('signin');
  });
  async function refreshProgress() {
    if (LOCAL_ONLY || !S) return;
    try { applyLogin(await api('login')); $('syncNote').hidden = true; }
    catch (err) {
      if (err.code === 'auth') { lsDel('tta2:session'); S = null; location.hash = ''; show('signin'); note($('signinNote'), 'warn', 'Please sign in again.'); throw err; }
      note($('syncNote'), 'warn', 'Offline — showing the progress saved on this device. Your work will sync when the connection returns.');
    }
  }

  // ---------------- guidelines ----------------
  function showGuide() {
    show('guide');
    $('agree').checked = agreed();
    $('guideNext').disabled = !$('agree').checked;
    $('guideNextLabel').textContent = warmed() ? 'Continue to my windows' : 'Continue to the warm-up';
  }
  $('agree').addEventListener('change', () => { $('guideNext').disabled = !$('agree').checked; });
  $('guideNext').addEventListener('click', () => { jset('tta2:' + S.id + ':agreed', true); go(warmed() ? 'queue' : 'warmup'); });

  // =========================================================
  // Editor: locked source text; CUTs sit at unit starts (code-point offsets).
  // =========================================================
  const UNIT_RE = /[\p{L}\p{N}\p{M}_]+|[^\s\p{L}\p{N}\p{M}_]/gu; // JS equivalent of Python \w+|[^\w\s] (warm-up only)
  function unitStartsOf(text) { // code-point offsets of every unit start
    const toCp = new Map(); let u16 = 0, cp = 0;
    for (const ch of text) { toCp.set(u16, cp); u16 += ch.length; cp++; }
    const out = []; let m; UNIT_RE.lastIndex = 0;
    while ((m = UNIT_RE.exec(text))) out.push(toCp.get(m.index));
    return out;
  }

  function Editor(host, text, starts, opts) {
    opts = opts || {};
    const ed = { cuts: new Set(), flags: new Map(), editable: true, mode: 'cut', undo: [] };
    const cps = Array.from(text), n = cps.length;
    const units = []; // {start, el}
    const frag = document.createDocumentFragment();
    if (starts.length && starts[0] > 0) frag.appendChild(document.createTextNode(cps.slice(0, starts[0]).join('')));
    for (let i = 0; i < starts.length; i++) {
      const a = starts[i], b = i + 1 < starts.length ? starts[i + 1] : n;
      const seg = cps.slice(a, b).join('');
      const k = seg.indexOf('\n');                       // keep line breaks outside the span
      const sp = document.createElement('span');
      sp.className = 'u' + (i === 0 ? ' u0' : ''); sp.dataset.i = i;
      sp.textContent = k < 0 ? seg : seg.slice(0, k);
      frag.appendChild(sp);
      if (k >= 0) frag.appendChild(document.createTextNode(seg.slice(k)));
      units.push({ start: a, el: sp });
    }
    host.textContent = ''; host.appendChild(frag);
    host.classList.add('trace');
    const byStart = new Map(units.map((u, i) => [u.start, i]));
    const chips = new Map(), fmarks = new Map();
    ed.validPos = p => byStart.has(p) && byStart.get(p) > 0;

    function chip(pos, cls, label, title) {
      const c = document.createElement('span');
      c.className = 'cut' + (cls ? ' ' + cls : ''); c.dataset.pos = pos; c.textContent = label || 'CUT';
      if (title) c.title = title;
      const u = units[byStart.get(pos)].el; u.parentNode.insertBefore(c, u); chips.set(pos, c);
    }
    function unchip(pos) { const c = chips.get(pos); if (c) { c.remove(); chips.delete(pos); } }
    function fmark(pos) {
      if (fmarks.has(pos)) return;
      const f = document.createElement('span'); f.className = 'flagm'; f.dataset.pos = pos; f.innerHTML = ICON_FLAG; f.title = 'Uncertainty flag — click to edit';
      const anchor = chips.get(pos) || units[byStart.get(pos)].el; anchor.parentNode.insertBefore(f, anchor); fmarks.set(pos, f);
    }
    function unfmark(pos) { const f = fmarks.get(pos); if (f) { f.remove(); fmarks.delete(pos); } }
    ed.shade = function () {
      let s = 0;
      for (let i = 0; i < units.length; i++) {
        const cut = i > 0 && ed.cuts.has(units[i].start); if (cut) s ^= 1;
        const want = 'u' + (i === 0 ? ' u0' : '') + (s ? ' s1' : '') + (cut ? ' hc' : '');
        if (units[i].el.className !== want) units[i].el.className = want;
      }
    };
    function changed() { ed.shade(); if (opts.onChange) opts.onChange(ed); }
    function pulse(pos) { const i = byStart.get(pos); if (i == null) return; const el = units[i].el; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
    ed.addCut = function (pos, rec) { if (!ed.validPos(pos) || ed.cuts.has(pos)) return; ed.cuts.add(pos); chip(pos); if (fmarks.has(pos)) { unfmark(pos); fmark(pos); } if (rec !== false) ed.undo.push({ t: 'cut+', pos }); changed(); };
    ed.removeCut = function (pos, rec) { if (!ed.cuts.has(pos)) return; ed.cuts.delete(pos); unchip(pos); if (rec !== false) ed.undo.push({ t: 'cut-', pos }); changed(); };
    ed.setFlag = function (pos, val, rec) {
      const before = ed.flags.get(pos) || null;
      if (val) { ed.flags.set(pos, val); fmark(pos); } else { ed.flags.delete(pos); unfmark(pos); }
      if (rec !== false) ed.undo.push({ t: 'flag', pos, before });
      changed();
    };
    ed.doUndo = function () {
      const op = ed.undo.pop(); if (!op) return false;
      if (op.t === 'cut+') ed.removeCut(op.pos, false); else if (op.t === 'cut-') ed.addCut(op.pos, false); else ed.setFlag(op.pos, op.before, false);
      pulse(op.pos); return true;
    };
    ed.load = function (cuts, flags) {
      chips.forEach((c, p) => unchip(p)); fmarks.forEach((f, p) => unfmark(p));
      ed.cuts = new Set(); ed.flags = new Map(); ed.undo = [];
      (cuts || []).forEach(p => { if (ed.validPos(p) && !ed.cuts.has(p)) { ed.cuts.add(p); chip(p); } });
      (flags || []).forEach(f => { if (ed.validPos(f.offset)) { ed.flags.set(f.offset, { note: f.note, created: f.created }); fmark(f.offset); } });
      ed.shade();
    };
    ed.cutList = () => Array.from(ed.cuts).sort((a, b) => a - b);
    ed.flagList = () => Array.from(ed.flags.entries()).sort((a, b) => a[0] - b[0]).map(([offset, v]) => ({ offset, note: v.note, created: v.created }));
    ed.setEditable = function (on) { ed.editable = on; host.classList.toggle('edit', on); };
    ed.setMode = function (mode) { ed.mode = mode; host.classList.toggle('mode-cut', mode === 'cut'); host.classList.toggle('mode-flag', mode === 'flag'); };
    ed.unitAt = pos => { const i = byStart.get(pos); return i == null ? '' : units[i].el.textContent.trim(); };
    ed.context = pos => ({ before: cps.slice(Math.max(0, pos - 36), pos).join('').replace(/\s+/g, ' '), after: cps.slice(pos, pos + 36).join('').replace(/\s+/g, ' ') });
    ed.scrollTo = function (pos) { const i = byStart.get(pos); if (i == null) return; units[i].el.scrollIntoView({ block: 'center', behavior: 'smooth' }); pulse(pos); };
    // warm-up feedback: ref = Map(pos -> {optional, why})
    ed.showReview = function (ref) {
      chips.forEach((c, p) => unchip(p));
      Array.from(new Set([...ed.cuts, ...ref.keys()])).sort((a, b) => a - b).forEach(p => {
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
      if (sel && String(sel).length > 0) return; // the annotator is selecting text to read
      const c = e.target.closest('.cut');
      if (c && host.contains(c)) { ed.removeCut(Number(c.dataset.pos)); return; }
      const f = e.target.closest('.flagm');
      if (f && opts.onFlag) { opts.onFlag(Number(f.dataset.pos)); return; }
      const u = e.target.closest('.u');
      if (!u || u.classList.contains('u0')) return;
      const pos = units[Number(u.dataset.i)].start;
      if (ed.mode === 'flag') { if (opts.onFlag) opts.onFlag(pos); }
      else if (!ed.cuts.has(pos)) ed.addCut(pos);
    });
    ed.setEditable(true); ed.setMode('cut'); ed.shade();
    return ed;
  }

  // ---------------- warm-up ----------------
  const WARMUP = [
    {
      title: 'Warm-up 1 · the worked example',
      text: 'Compute u = 2 + 3. The result is u = 5. Check: u − 3 = 2, then compute v: v = 2u = 10.',
      ref: [
        { before: 'Check: u', why: 'A check begins. The calculation “Compute u = 2 + 3” stays with its stated result “u = 5”.' },
        { before: 'then compute v', why: 'A distinct new calculation begins inside the same sentence.' }
      ]
    },
    {
      title: 'Warm-up 2 · a short reasoning passage',
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
  let warmupBuilt = false;
  function showPractice() {
    show('practice');
    if (warmupBuilt) return;
    warmupBuilt = true;
    const list = $('practiceList'); list.textContent = '';
    const checked = new Set();
    WARMUP.forEach((p, idx) => {
      const card = document.createElement('div'); card.className = 'card prac';
      card.innerHTML = '<p class="cap">' + esc(p.title) + '</p><div class="pt"></div><div class="row" style="margin-top:18px">' +
        '<button type="button" class="btn primary sm chk">Check my boundaries</button>' +
        '<button type="button" class="quiet und"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 5L3.5 9l4 4 M4 9h8a4.5 4.5 0 010 9H9"/></svg>Undo</button>' +
        '<button type="button" class="quiet again" hidden>Try again</button></div><div class="prac-fb" hidden></div>';
      list.appendChild(card);
      const ed = Editor(card.querySelector('.pt'), p.text, unitStartsOf(p.text), {});
      const ref = new Map();
      p.ref.forEach(r => { const i = p.text.indexOf(r.before); if (i > 0) ref.set(Array.from(p.text.slice(0, i)).length, r); });
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
          '<ul>' + [...ref.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => '<li><b>Before “' + esc(r.before) + '…”</b> — ' + esc(r.why) + '</li>').join('') + '</ul>' +
          '<p class="muted small">Hover a marker to see why. The warm-up is not scored; the reference shows how the rules apply.</p>';
        checked.add(idx);
        if (S) api('warmup', { item: idx, n_cuts: mine.size, hit: hit, extra: extra }).catch(() => {});
        if (checked.size === WARMUP.length) $('practiceDone').disabled = false;
      });
      card.querySelector('.again').addEventListener('click', () => {
        ed.hideReview(); ed.setEditable(true); fb.hidden = true;
        card.querySelector('.chk').hidden = false; card.querySelector('.und').hidden = false; card.querySelector('.again').hidden = true;
      });
    });
    if (warmed()) $('practiceDone').disabled = false;
  }
  $('practiceDone').addEventListener('click', () => { jset('tta2:' + S.id + ':warmup', true); go('queue'); });

  // ---------------- queue ----------------
  function localDraft(id) { return jget(key('draft', id), null); }
  function statusOf(id) {
    const l = localDraft(id), s = serverProgress[id];
    if ((s && s.status === 'submitted') || (l && l.status === 'submitted' && (LOCAL_ONLY || !s || s.status !== 'reopened'))) return 'submitted';
    if (s && s.status === 'reopened') return 'reopened';
    if ((l && (l.cuts.length || l.flags.length)) || s) return 'draft';
    return 'new';
  }
  // The first window in the annotator's order that is not submitted; everything after it stays locked.
  function nextOpen() { return queue().find(id => statusOf(id) !== 'submitted') || null; }
  function isOpen(id) { const q = queue(), k = q.indexOf(id); return k >= 0 && q.slice(0, k).every(x => statusOf(x) === 'submitted'); }
  function labelOf(id) {
    const q = queue(), it = D.byId[id], k = q.filter(x => D.byId[x].practice === it.practice).indexOf(id) + 1;
    return it.practice ? 'Practice ' + k + ' of ' + nPractice() : 'Window ' + k + ' of ' + nMain();
  }

  async function showQueue() {
    show('queue');
    renderQueue();
    try { await refreshProgress(); } catch (e) { return; }
    renderQueue();
  }
  function renderQueue() {
    const list = $('queueList'); list.textContent = '';
    const q = queue();
    if (!q.length) {
      $('queueSummary').textContent = '';
      note($('syncNote'), 'warn', S.slot ? 'Your window order (<b>' + esc(S.slot) + '</b>) is not in this dataset. Please contact the researcher.' :
        '<b>Your account has no window order yet.</b> The researcher still needs to assign you to an annotator slot. Please contact them.');
      return;
    }
    if (LOCAL_ONLY) note($('syncNote'), 'warn', '<b>Local mode.</b> No server is configured, so your work is saved only in this browser.');
    const doneP = q.filter(id => D.byId[id].practice && statusOf(id) === 'submitted').length;
    const doneM = q.filter(id => !D.byId[id].practice && statusOf(id) === 'submitted').length;
    $('queueTitle').textContent = nMain() + ' windows to segment.';
    $('queueSummary').innerHTML = '<span><b>' + doneP + '/' + nPractice() + '</b>practice done</span><span><b>' + doneM + '/' + nMain() + '</b>study windows submitted</span>';
    const nxt = nextOpen();
    let lastPractice = null;
    q.forEach((id, k) => {
      const it = D.byId[id];
      if (it.practice !== lastPractice) { const h = document.createElement('p'); h.className = 'qsection'; h.textContent = it.practice ? 'Practice · not scored' : 'Study windows'; list.appendChild(h); lastPractice = it.practice; }
      const st = statusOf(id), open = isOpen(id), cur = id === nxt;
      const l = localDraft(id), s = serverProgress[id] || {};
      const nCuts = l ? l.cuts.length : (s.n_cuts || 0);
      const row = document.createElement('div'); row.className = 'qrow' + (cur ? ' current' : '') + (!open ? ' locked' : '');
      const label = { new: cur ? 'Next' : 'Locked', draft: 'In progress', submitted: 'Submitted', reopened: 'Reopened' }[st];
      const cls = st === 'new' ? (cur ? 'next' : '') : st;
      row.innerHTML = '<span class="qn">' + String(k + 1).padStart(2, '0') + '</span><div><h3>' + esc(labelOf(id)) + '<span class="pill ' + cls + '">' + label + '</span></h3>' +
        '<p class="muted">' + (st !== 'new' ? nCuts + ' CUTs' : open ? 'Ready to start' : 'Opens after the previous window is submitted') + '</p></div>' +
        (open ? '<button class="btn ' + (st === 'submitted' ? 'sm' : 'primary sm') + '" type="button">' + (st === 'submitted' ? 'View' : st === 'new' ? 'Start' : 'Continue') + '</button>' : '<span></span>');
      const b = row.querySelector('button'); if (b) b.addEventListener('click', () => go('w/' + encodeURIComponent(id)));
      list.appendChild(row);
    });
    if (!nxt) { const n = document.createElement('div'); n.className = 'note'; n.innerHTML = '<b>All windows submitted.</b> Thank you — you can close this page.'; list.prepend(n); }
  }

  // ---------------- workspace ----------------
  const W = { item: null, ed: null, ready: false, status: 'draft', activeMs: 0, lastAct: 0, readMax: 0, dirty: false, saving: false, tick: 0, version: 0, clientUpdated: '' };
  function setSave(txt, err) { const s = $('saveState'); s.textContent = txt; s.classList.toggle('err', !!err); }
  function draftObj() { return { cuts: W.ed.cutList(), flags: W.ed.flagList(), active_ms: W.activeMs, read_pct: Math.round(W.readMax * 1000) / 1000, status: W.status, client_updated: W.clientUpdated, version: W.version }; }
  // Nothing is saved until the window has finished loading (W.ready), so a click or a page exit
  // during loading can never overwrite saved work with an empty state.
  function saveLocal() { if (!W.ready) return; W.clientUpdated = nowIso(); jset(key('draft', W.item.item_id), draftObj()); }
  function payload() {
    const d = draftObj();
    return { item_id: W.item.item_id, practice: !!W.item.practice, cuts: d.cuts, flags: d.flags, active_ms: d.active_ms, read_pct: d.read_pct,
      window_sha1: D.sha1[W.item.item_id], client_updated: d.client_updated,
      meta: { ua: navigator.userAgent.slice(0, 160), viewport: innerWidth + 'x' + innerHeight, undo_depth: W.ed.undo.length, n_units: W.item.n_units } };
  }
  async function syncNow() {
    if (LOCAL_ONLY || !W.item || !W.ready || W.saving || !W.dirty || W.status === 'submitted') return;
    W.saving = true; W.dirty = false;
    try {
      const r = await api('save', payload());
      W.version = r.version; if (r.status) W.status = r.status;
      jset(key('draft', W.item.item_id), draftObj());
      setSave('Saved · ' + fmtTime(r.server_updated));
    } catch (err) {
      W.dirty = true;
      if (err.code === 'locked') { const id = W.item.item_id; lsDel(key('draft', id)); W.item = null; openWork(id); toast('This window was submitted from another device.'); }
      else setSave('Saved on this device · will sync', true);
    } finally { W.saving = false; }
  }
  function flushSave(beacon) {
    if (!W.item || !W.ready || W.status === 'submitted') return;
    saveLocal();
    if (LOCAL_ONLY || !W.dirty) return;
    if (beacon && navigator.sendBeacon) {
      try { navigator.sendBeacon(API, new Blob([JSON.stringify(Object.assign({ action: 'save', annotator_id: S.id, dataset_id: D.id }, payload()))], { type: 'text/plain' })); W.dirty = false; } catch (e) {}
    } else syncNow();
  }
  function updateStats() {
    const ed = W.ed;
    $('stSeg').textContent = ed.cuts.size + 1; $('stCut').textContent = ed.cuts.size; $('stFlag').textContent = ed.flags.size;
    $('stRead').textContent = Math.round(W.readMax * 100) + '%'; $('readFill').style.width = Math.round(W.readMax * 100) + '%';
    $('undoBtn').disabled = !ed.undo.length || W.status === 'submitted';
    renderFlags();
  }
  function renderFlags() {
    const ol = $('flagList'); ol.textContent = '';
    const fl = W.ed.flagList(); $('flagEmpty').hidden = fl.length > 0;
    fl.forEach(f => {
      const c = W.ed.context(f.offset);
      const li = document.createElement('li');
      li.innerHTML = '<span class="fl-ctx">…' + esc(c.before) + ' <b>|</b> ' + esc(c.after) + '…</span><span class="fl-note">' + esc(f.note) + '</span>' +
        '<button type="button" class="link go">Show</button>' + (W.status !== 'submitted' ? ' · <button type="button" class="link edit">Edit</button>' : '');
      li.querySelector('.go').addEventListener('click', () => W.ed.scrollTo(f.offset));
      const e = li.querySelector('.edit'); if (e) e.addEventListener('click', () => openFlag(f.offset));
      ol.appendChild(li);
    });
  }
  function onChange() {
    if (!W.ready) return;
    W.dirty = true; W.lastAct = Date.now();
    saveLocal(); updateStats();
    setSave(LOCAL_ONLY ? 'Saved on this device' : 'Unsaved changes…');
    clearTimeout(W.syncT); W.syncT = setTimeout(syncNow, 4000);
  }
  function computeRead() {
    if (!W.item) return;
    const r = $('trace').getBoundingClientRect(); if (r.height <= 0) return;
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
  $('undoBtn').addEventListener('click', () => { if (W.ed && W.ready && W.status !== 'submitted') W.ed.doUndo(); });
  $('shade').addEventListener('change', () => { $('trace').classList.toggle('shade', $('shade').checked); jset('tta:shade', $('shade').checked); });
  document.addEventListener('keydown', e => {
    if (!W.item || !W.ready || document.body.dataset.view !== 'work') return;
    if (e.target.closest('input, textarea, dialog[open]')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); if (W.status !== 'submitted') W.ed.doUndo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || W.status === 'submitted') return;
    if (e.key === 'c' || e.key === 'C') setTool('cut');
    if (e.key === 'f' || e.key === 'F') setTool('flag');
  });

  async function openWork(id) {
    const it = D.byId[id];
    if (!it || queue().indexOf(id) < 0) return go('queue');
    if (!isOpen(id)) { toast('Please finish the windows before this one first.'); return go('queue'); }
    if (W.item && W.item.item_id === id) return show('work');
    show('work');
    W.item = it; W.ready = false; W.dirty = false; W.saving = false; W.readMax = 0; W.lastAct = Date.now();
    clearInterval(W.tick); clearTimeout(W.syncT);
    $('wTitle').textContent = labelOf(id);
    $('wSub').textContent = 'Item ' + id + ' · click before a word or mark to insert CUT';
    $('practiceNote').hidden = !it.practice;
    $('problem').textContent = it.problem; typeset($('problem'));
    $('contextBox').hidden = !it.context_before;
    $('contextText').textContent = it.context_before || '';
    $('windowCap').textContent = it.context_before ? 'Window · annotate this text (it continues the grey text above)' : 'Window · annotate this text (start of the reasoning)';
    const host = $('trace');
    host.textContent = 'Loading…';
    await new Promise(r => setTimeout(r, 0));
    W.ed = Editor(host, it.window_text, it.unit_starts, { onChange: onChange, onFlag: openFlag });
    W.ed.setEditable(false); // read-only until the saved annotation has loaded
    host.classList.toggle('shade', jget('tta:shade', true) !== false); $('shade').checked = host.classList.contains('shade');
    setTool('cut');
    let d = localDraft(id), localAhead = false;
    if (!LOCAL_ONLY) {
      setSave('Loading…');
      try {
        const r = await api('load', { item_id: id });
        if (W.item !== it) return;
        if (r.found && (!d || r.status === 'submitted' || r.status === 'reopened' && d.status === 'submitted' || String(r.client_updated || '') >= String(d.client_updated || ''))) {
          d = { cuts: r.cuts, flags: r.flags, active_ms: r.active_ms, read_pct: r.read_pct, status: r.status, client_updated: r.client_updated, version: r.version };
        } else if (d) {
          if (r.found && r.status === 'reopened') d.status = 'reopened';
          if (d.status === 'submitted') d.status = r.found ? r.status : 'draft'; // a submit that never reached the server
          localAhead = true;
        }
        setSave(localAhead ? 'Unsynced changes…' : r.found ? 'Synced' : 'Not saved yet');
      } catch (err) { if (W.item !== it) return; setSave('Offline · saving on this device', true); }
    }
    d = d || { cuts: [], flags: [], active_ms: 0, read_pct: 0, status: 'draft', client_updated: '', version: 0 };
    W.ed.load(d.cuts, d.flags);
    W.activeMs = d.active_ms || 0; W.readMax = d.read_pct || 0; W.status = d.status || 'draft'; W.clientUpdated = d.client_updated || ''; W.version = d.version || 0;
    W.ready = true;
    if (localAhead) { W.dirty = true; setTimeout(syncNow, 1000); }
    applyLock(); computeRead();
    if (LOCAL_ONLY) setSave(d.client_updated ? 'Saved on this device' : '');
    W.tick = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - W.lastAct < 60000 && W.status !== 'submitted') {
        W.activeMs += 5000;
        if (W.activeMs % 30000 === 0 && W.ready) jset(key('draft', W.item.item_id), draftObj());
      }
      if (Date.now() % SYNC_MS < 5000) syncNow();
    }, 5000);
  }
  function closeWork() {
    if (!W.item) return;
    flushSave(false);
    clearInterval(W.tick); clearTimeout(W.syncT);
    W.item = null; W.ed = null; W.ready = false; $('trace').textContent = '';
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(true); });
  window.addEventListener('pagehide', () => flushSave(true));

  // ---------------- flags ----------------
  let flagPos = null;
  function openFlag(pos) {
    if (!W.ed || !W.ready || W.status === 'submitted') return;
    flagPos = pos;
    const cur = W.ed.flags.get(pos);
    $('flagWord').textContent = W.ed.unitAt(pos);
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
    if (!W.ed || !W.ready || W.status === 'submitted') return;
    computeRead();
    $('subTitle').textContent = labelOf(W.item.item_id);
    $('subSummary').textContent = (W.ed.cuts.size + 1) + ' segments · ' + W.ed.cuts.size + ' CUTs · ' + W.ed.flags.size + ' uncertainty flags · ' + Math.round(W.readMax * 100) + '% of the window scrolled through.';
    document.querySelectorAll('.subchk').forEach(c => { c.checked = false; });
    const unread = W.readMax < READ_REQUIRED;
    if (unread) note($('subNote'), 'warn', 'Please scroll through the <b>whole window</b> before submitting (currently ' + Math.round(W.readMax * 100) + '%).'); else $('subNote').hidden = true;
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
    if (LOCAL_ONLY) { W.status = 'submitted'; saveLocal(); applyLock(); setSave('Submitted (this device)'); toast('Window submitted (saved on this device).'); return afterSubmit(); }
    setSave('Submitting…'); $('submitBtn').disabled = true;
    try {
      W.status = 'submitted'; saveLocal();
      const r = await api('submit', payload());
      W.version = r.version; W.status = 'submitted'; jset(key('draft', W.item.item_id), draftObj());
      serverProgress[W.item.item_id] = { status: 'submitted' };
      applyLock(); setSave('Submitted · ' + fmtTime(r.server_updated)); toast('Window submitted.');
      afterSubmit();
    } catch (err) {
      if (err.code === 'locked') { W.status = 'submitted'; applyLock(); return toast('This window was already submitted.'); }
      W.status = prev; saveLocal(); applyLock();
      setSave('Submit failed — try again', true); toast('Could not submit. Check your connection and try again.');
    }
  });
  function afterSubmit() {
    const nxt = nextOpen();
    setTimeout(() => go(nxt ? 'w/' + encodeURIComponent(nxt) : 'done'), 900);
  }

  // ---------------- boot ----------------
  (async function boot() {
    $('signinBtn').disabled = true; // enabled once the windows have loaded
    try { await loadData(); $('signinBtn').disabled = false; }
    catch (e) { document.querySelector('main').innerHTML = '<section class="wrap view"><div class="note err">The annotation windows could not be loaded. Please reload the page, or contact the researcher.</div></section>'; return; }
    if (S && !LOCAL_ONLY) { try { await refreshProgress(); } catch (e) { /* signed out */ } }
    route();
  })();
})();
