/* TRACE · Task B — annotator app (sign in → guidelines → practice → traces → label segments). */
(function () {
  'use strict';
  const CFG = window.TASK_CONFIG || {};
  const API = (CFG.apiUrl || '').trim();
  const LOCAL_ONLY = !API;
  const TRACES = window.TRACES || [];
  const TBY = {}; TRACES.forEach(t => { TBY[t.id] = t; });
  const SYNC_MS = 20000;
  const P = 'ttb:'; // localStorage prefix

  const LABELS = [
    { code: 'CONSTRUCT', key: '1', name: 'Construct', desc: 'Build reasoning' },
    { code: 'INSPECT', key: '2', name: 'Inspect', desc: 'Check reasoning' },
    { code: 'REVISE', key: '3', name: 'Revise', desc: 'Correct locally' },
    { code: 'REDIRECT', key: '4', name: 'Redirect', desc: 'Change direction' },
    { code: 'NONACTION', key: '5', name: 'Nonaction', desc: 'No substantive update' }
  ];
  const LBY = {}; LABELS.forEach(l => { LBY[l.code] = l; });
  const REASONS = { label_uncertain: 'Label uncertain', segmentation_issue: 'Segmentation issue', other: 'Other' };

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

  // guide content is shared by the page and the in-task overlay
  $('guideHost').appendChild($('guideTpl').content.cloneNode(true));
  $('guideDlgHost').appendChild($('guideTpl').content.cloneNode(true));

  // ---------------- session + API ----------------
  let S = jget(P + 'session', null); // {id (email), name}
  const key = (...p) => P + S.id + ':' + p.join(':');
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
      S = { id: id, name: '' }; jset(P + 'session', S);
      toast('Local mode: your work is kept in this browser.');
      return go('');
    }
    $('signinBtn').disabled = true;
    try {
      S = { id: id };
      const r = await api('login');
      S.name = r.name || ''; serverProgress = r.progress || {}; serverPracticed = !!r.practiced;
      jset(P + 'session', S); go('');
    } catch (err) {
      S = null;
      note(n, 'err', err.code === 'auth' ? 'This email is not registered for Task B. Use the address you gave the researcher, or contact them.' : 'Could not reach the server. Check your connection and try again.');
    } finally { $('signinBtn').disabled = false; }
  });
  $('signOutBtn').addEventListener('click', () => {
    if (W.trace) { flushSave(true); closeWork(); }
    lsDel(P + 'session'); S = null; serverProgress = {}; serverPracticed = false; location.hash = ''; show('signin');
  });

  async function refreshProgress() {
    if (LOCAL_ONLY || !S) return;
    try { const r = await api('login'); serverProgress = r.progress || {}; serverPracticed = !!r.practiced; if (r.name) S.name = r.name; $('syncNote').hidden = true; }
    catch (err) {
      if (err.code === 'auth') { lsDel(P + 'session'); S = null; location.hash = ''; show('signin'); note($('signinNote'), 'warn', 'Please sign in again.'); throw err; }
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
  function openGuide() { const d = $('guideDlg'); d.showModal(); d.querySelector('.gd-body').scrollTop = 0; $('guideClose').focus(); }
  $('guideBtn').addEventListener('click', openGuide);
  $('guideClose').addEventListener('click', () => $('guideDlg').close());
  $('guideDlg').addEventListener('click', e => { if (e.target === $('guideDlg')) $('guideDlg').close(); });

  function labelButtons(host, cls) {
    host.innerHTML = LABELS.map(l => '<button type="button" class="' + cls + '" data-l="' + l.code + '" role="radio" aria-checked="false" title="' + esc(l.name) + ' (' + l.key + ')">' +
      '<kbd>' + l.key + '</kbd><span class="lb-n">' + esc(l.name) + '</span><span class="lb-d">' + esc(l.desc) + '</span></button>').join('');
  }

  // ---------------- practice ----------------
  const PRACTICE = [
    {
      title: 'Practice 1 · the worked example',
      segs: [
        ['Compute u = 2 + 3. The result is u = 5.', 'CONSTRUCT', 'A calculation together with its stated result.'],
        [' Check: u − 3 = 2,', 'INSPECT', 'An explicit check of the result already introduced.'],
        [' then compute v: v = 2u = 10.', 'CONSTRUCT', 'A new calculation derives new content.']
      ]
    },
    {
      title: 'Practice 2 · a short reasoning passage',
      segs: [
        ['Okay, so we need the remainder when 7^100 is divided by 5.', 'CONSTRUCT', 'Setup: introduces the problem content.'],
        [' Hmm, let me think.', 'NONACTION', 'Filler with no substantive update.'],
        [' First, reduce the base: 7 ≡ 2 (mod 5), so 7^100 ≡ 2^100.', 'CONSTRUCT', 'A calculation that derives new content.'],
        [' Next, the powers of 2 mod 5 are 2, 4, 3, 1, so they repeat every 3 steps —', 'CONSTRUCT', 'A new derivation. Its content is wrong, but the label follows the operation, not correctness.'],
        [' no wait, that is four values, so the period is 4.', 'REVISE', 'Explicitly replaces “every 3 steps” with “period 4” while keeping the same method.'],
        [' Since 100 = 4 · 25, we get 2^100 ≡ 1 (mod 5).', 'CONSTRUCT', 'A new inference that uses the period.'],
        [' Let me double-check the cycle: 2^4 = 16, and 16 mod 5 = 1, so the cycle is right.', 'INSPECT', 'A completed check of content already introduced; nothing is replaced.'],
        [' Actually, let me use Fermat\'s little theorem instead, since it is quicker.', 'REDIRECT', 'Switches the method. “Actually” alone does not decide this — the method change does.'],
        [' By Fermat, 7^4 ≡ 1 (mod 5), so 7^100 = (7^4)^25 ≡ 1.', 'CONSTRUCT', 'A calculation within the new method.'],
        [' So the remainder is 1.', 'CONSTRUCT', 'A concluding inference.']
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
      card.innerHTML = '<p class="cap">' + esc(p.title) + '</p><ol class="prows"></ol><div class="row" style="margin-top:18px">' +
        '<button type="button" class="btn primary sm chk" disabled>Check my labels</button>' +
        '<button type="button" class="quiet again" hidden>Try again</button><span class="muted small hint">Label every segment to check.</span></div><div class="prac-fb" hidden></div>';
      list.appendChild(card);
      const ol = card.querySelector('.prows');
      const picks = new Array(p.segs.length).fill(null);
      p.segs.forEach((s, i) => {
        const li = document.createElement('li'); li.className = 'prow';
        li.innerHTML = '<div class="prow-t"><span class="sgn">' + (i + 1) + '</span>' + esc(s[0].trim()) + '</div><div class="pbtns"></div><div class="prow-fb" hidden></div>';
        labelButtons(li.querySelector('.pbtns'), 'pb');
        li.querySelector('.pbtns').addEventListener('click', e => {
          const b = e.target.closest('[data-l]'); if (!b || card.classList.contains('reviewed')) return;
          picks[i] = b.dataset.l;
          li.querySelectorAll('[data-l]').forEach(x => { const on = x.dataset.l === picks[i]; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
          li.dataset.l = picks[i];
          card.querySelector('.chk').disabled = picks.some(x => !x);
          card.querySelector('.hint').hidden = !picks.some(x => !x);
        });
        ol.appendChild(li);
      });
      const fb = card.querySelector('.prac-fb');
      card.querySelector('.chk').addEventListener('click', () => {
        let hit = 0;
        card.classList.add('reviewed');
        ol.querySelectorAll('.prow').forEach((li, i) => {
          const ref = p.segs[i][1], ok = picks[i] === ref; if (ok) hit++;
          li.classList.toggle('ok', ok); li.classList.toggle('bad', !ok);
          const f = li.querySelector('.prow-fb'); f.hidden = false;
          f.innerHTML = (ok ? '<b class="okc">✓ ' + esc(LBY[ref].name) + '</b>' : '<b class="badc">Reference: ' + esc(LBY[ref].name) + '</b> <span class="muted">(you chose ' + esc(LBY[picks[i]].name) + ')</span>') + ' — ' + esc(p.segs[i][2]);
        });
        fb.hidden = false;
        fb.innerHTML = '<p><b>' + hit + ' of ' + p.segs.length + '</b> labels match the reference.</p><p class="muted small">Practice is not scored; the reference shows how the rules apply.</p>';
        card.querySelector('.chk').hidden = true; card.querySelector('.again').hidden = false; card.querySelector('.hint').hidden = true;
        checked.add(idx);
        if (S) api('practice', { item: idx, n: p.segs.length, hit: hit, picks: picks }).catch(() => {});
        if (checked.size === PRACTICE.length) $('practiceDone').disabled = false;
      });
      card.querySelector('.again').addEventListener('click', () => {
        card.classList.remove('reviewed'); fb.hidden = true;
        ol.querySelectorAll('.prow').forEach(li => { li.classList.remove('ok', 'bad'); li.querySelector('.prow-fb').hidden = true; });
        card.querySelector('.chk').hidden = false; card.querySelector('.again').hidden = true;
      });
    });
    if (jget(key('practice'), false)) $('practiceDone').disabled = false;
  }
  $('practiceDone').addEventListener('click', () => { jset(key('practice'), true); go('traces'); });

  // ---------------- trace list ----------------
  function localDraft(tid) { return jget(key('draft', tid), null); }
  function nLabeled(d) { return d && d.labels ? d.labels.filter(Boolean).length : 0; }
  function statusOf(tid) {
    const l = localDraft(tid), s = serverProgress[tid];
    if ((s && s.status === 'submitted') || (l && l.status === 'submitted' && (LOCAL_ONLY || !s || s.status !== 'reopened'))) return 'submitted';
    if (s && s.status === 'reopened') return 'reopened';
    if ((l && (nLabeled(l) || (l.flags || []).length)) || s) return 'draft';
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
      const n = t.segs.length;
      const lab = l ? nLabeled(l) : (s.n_labeled || 0);
      const card = document.createElement('div'); card.className = 'card tcard';
      const label = { new: 'Not started', draft: 'In progress', submitted: 'Submitted', reopened: 'Reopened' }[st];
      const pct = Math.round(100 * lab / n);
      card.innerHTML = '<div><h3>' + esc(t.label) + '<span class="pill ' + st + '">' + label + '</span></h3>' +
        '<p class="muted">' + n.toLocaleString() + ' segments' +
        (st !== 'new' ? ' · ' + lab + ' labeled' + (l && l.active_ms ? ' · ' + fmtMin(l.active_ms) + ' active' : '') : '') + '</p>' +
        (st !== 'new' ? '<div class="mini-bar"><span style="width:' + pct + '%"></span></div>' : '') + '</div>' +
        '<button class="btn ' + (st === 'submitted' ? '' : 'primary sm') + '" type="button">' + (st === 'submitted' ? 'View' : st === 'new' ? 'Start' : 'Continue') + '</button>';
      card.querySelector('button').addEventListener('click', () => go('trace/' + t.id));
      list.appendChild(card);
    });
    if (LOCAL_ONLY) note($('syncNote'), 'warn', '<b>Local mode.</b> No server is configured, so your work is saved only in this browser. Please contact the researcher.');
    if (done === TRACES.length && TRACES.length) {
      const n = document.createElement('div'); n.className = 'note';
      n.innerHTML = '<b>All traces submitted.</b> Thank you — you can close this page.';
      list.prepend(n);
    }
  }

  // =========================================================
  // Workspace: fixed segments, one label each.
  // =========================================================
  const W = { trace: null, els: [], cores: [], labels: [], flags: new Map(), dwell: [], active: 0, status: 'draft', activeMs: 0, lastAct: 0,
    dirty: false, saving: false, tick: 0, version: 0, clientUpdated: '', changes: 0, undo: [] };
  labelButtons($('lpBtns'), 'lb');

  function renderTrace(t) {
    const host = $('trace'); host.textContent = '';
    const frag = document.createDocumentFragment();
    W.els = []; W.cores = [];
    t.segs.forEach((s, i) => {
      const raw = t.text.slice(s[1], s[2]);
      const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const sp = document.createElement('span'); sp.className = 'sg'; sp.dataset.i = i;
      if (m[1]) sp.appendChild(document.createTextNode(m[1]));
      const core = document.createElement('span'); core.className = 'sgc';
      const n = document.createElement('span'); n.className = 'sgn'; n.textContent = i + 1;
      core.appendChild(n); core.appendChild(document.createTextNode(m[2]));
      sp.appendChild(core);
      if (m[3]) sp.appendChild(document.createTextNode(m[3]));
      frag.appendChild(sp); W.els.push(sp); W.cores.push(m[2]);
    });
    host.appendChild(frag);
  }
  function paintSeg(i) {
    const el = W.els[i]; if (!el) return;
    const l = W.labels[i], f = W.flags.get(i);
    el.className = 'sg' + (l ? ' l-' + l : '') + (f ? ' fl' : '') + (i === W.active ? ' on' : '') + (!l && !f ? ' open' : '');
    const n = el.querySelector('.sgn');
    n.innerHTML = (i + 1) + (l ? '<i>' + esc(LBY[l].name) + '</i>' : '') + (f ? ICON_FLAG : '');
  }
  const unresolved = () => { let n = 0; for (let i = 0; i < W.labels.length; i++) if (!W.labels[i] && !W.flags.has(i)) n++; return n; };

  function updatePanel() {
    const t = W.trace, i = W.active, n = t.segs.length;
    $('lpNum').textContent = i + 1; $('lpTotal').textContent = n;
    const prev = i > 0 ? W.cores[i - 1] : '';
    $('lpPrev').textContent = prev ? '…' + prev.slice(-160) : 'Start of trace';
    $('lpPrev').classList.toggle('start', !prev);
    $('lpText').textContent = W.cores[i] || '(whitespace)';
    $('lpText').scrollTop = 0;
    const l = W.labels[i], f = W.flags.get(i);
    $('lpBtns').querySelectorAll('[data-l]').forEach(b => { const on = b.dataset.l === l; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    let st;
    if (f) st = '<span class="st-flag">' + ICON_FLAG + 'Flagged · ' + esc(REASONS[f.reason] || f.reason) + '</span>' + (l ? ' · tentative label <b>' + esc(LBY[l].name) + '</b>' : ' · left unlabeled') + '<span class="st-note">' + esc(f.note) + '</span>';
    else if (l) st = 'Labeled <b>' + esc(LBY[l].name) + '</b>';
    else st = '<span class="muted">Unlabeled — choose one action</span>';
    $('lpState').innerHTML = st;
    $('lpState').className = 'lp-state' + (f ? ' flagged' : '');
    $('flagBtnLbl').textContent = f ? 'Edit flag' : 'Flag';
    $('flagBtn').classList.toggle('on', !!f);
    $('prevBtn').disabled = i === 0; $('nextBtn').disabled = i >= n - 1;
  }
  function updateStats() {
    const n = W.labels.length, lab = W.labels.filter(Boolean).length, open = unresolved();
    $('stLab').textContent = lab; $('stFlag').textContent = W.flags.size; $('stOpen').textContent = open;
    $('readFill').style.width = Math.round(100 * (n - open) / Math.max(1, n)) + '%';
    const c = {}; W.labels.forEach(l => { if (l) c[l] = (c[l] || 0) + 1; });
    $('dist').innerHTML = '<div class="dist-bar">' + LABELS.map(l => c[l.code] ? '<span class="d-' + l.code + '" style="flex:' + c[l.code] + '" title="' + l.name + ': ' + c[l.code] + '"></span>' : '').join('') + '</div>' +
      '<div class="dist-leg">' + LABELS.map(l => '<span><i class="d-' + l.code + '"></i>' + l.name + ' ' + (c[l.code] || 0) + '</span>').join('') + '</div>';
    $('wSub').textContent = n + ' segments · ' + lab + ' labeled · ' + open + ' unresolved';
    renderFlags();
  }
  function renderFlags() {
    const ol = $('flagList'); ol.textContent = '';
    const fl = Array.from(W.flags.entries()).sort((a, b) => a[0] - b[0]);
    $('flagEmpty').hidden = fl.length > 0; $('flagCount').textContent = fl.length ? '(' + fl.length + ')' : '';
    fl.forEach(([i, f]) => {
      const li = document.createElement('li');
      li.innerHTML = '<button type="button" class="link go">Segment ' + (i + 1) + '</button> · <span class="muted">' + esc(REASONS[f.reason] || f.reason) + (W.labels[i] ? ' · ' + esc(LBY[W.labels[i]].name) : ' · unlabeled') + '</span><span class="fl-note">' + esc(f.note) + '</span>';
      li.querySelector('.go').addEventListener('click', () => setActive(i, true));
      ol.appendChild(li);
    });
  }

  function inView(el) {
    const r = el.getBoundingClientRect(), top = 76;
    return r.top >= top && r.bottom <= innerHeight - 8;
  }
  function setActive(i, scroll) {
    if (!W.trace) return;
    i = Math.max(0, Math.min(W.trace.segs.length - 1, i));
    const prev = W.active; W.active = i;
    paintSeg(prev); paintSeg(i);
    updatePanel();
    if (scroll !== false) {
      const el = W.els[i].querySelector('.sgc');
      if (!inView(el)) el.scrollIntoView({ block: el.getBoundingClientRect().height > innerHeight * .6 ? 'start' : 'center', behavior: 'smooth' });
    }
    if (prev !== i) { W.lastAct = Date.now(); jset(key('pos', W.trace.id), i); }
  }
  function locked() { return W.status === 'submitted'; }
  function setLabel(i, code, rec) {
    if (locked()) return;
    const before = W.labels[i] || null;
    if (before === code) return;
    if (rec !== false) W.undo.push({ i: i, before: before, flag: W.flags.get(i) || null });
    W.labels[i] = code; W.changes++;
    paintSeg(i); onChange();
  }
  function choose(code) {
    if (locked() || !W.trace) return;
    const i = W.active;
    setLabel(i, code);
    if ($('autoAdv').checked && i < W.trace.segs.length - 1) setActive(i + 1);
  }
  function nextOpen() {
    const n = W.labels.length;
    for (let k = 1; k <= n; k++) { const j = (W.active + k) % n; if (!W.labels[j] && !W.flags.has(j)) return setActive(j); }
    toast('Every segment is labeled or flagged.');
  }
  function doUndo() {
    if (locked()) return;
    const op = W.undo.pop(); if (!op) return toast('Nothing to undo');
    W.labels[op.i] = op.before;
    if (op.flag) W.flags.set(op.i, op.flag); else W.flags.delete(op.i);
    W.changes++; paintSeg(op.i); setActive(op.i); onChange();
  }

  $('lpBtns').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (b) choose(b.dataset.l); });
  $('prevBtn').addEventListener('click', () => setActive(W.active - 1));
  $('nextBtn').addEventListener('click', () => setActive(W.active + 1));
  $('nextOpenBtn').addEventListener('click', nextOpen);
  $('flagBtn').addEventListener('click', () => openFlag(W.active));
  $('trace').addEventListener('click', e => {
    const sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length > 0) return;
    const s = e.target.closest('.sg'); if (s) setActive(Number(s.dataset.i), false);
  });
  $('autoAdv').addEventListener('change', () => jset(P + 'auto', $('autoAdv').checked));
  $('tint').addEventListener('change', () => { $('trace').classList.toggle('tint', $('tint').checked); jset(P + 'tint', $('tint').checked); });

  document.addEventListener('keydown', e => {
    if (!W.trace || document.body.dataset.view !== 'work') return;
    if (document.querySelector('dialog[open]') || e.target.closest('input, textarea, select')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    const L = LABELS.find(l => l.key === k);
    if (L) { e.preventDefault(); choose(L.code); return; }
    if (k === 'j' || k === 'J' || k === 'ArrowRight') { e.preventDefault(); setActive(W.active + 1); }
    else if (k === 'k' || k === 'K' || k === 'ArrowLeft') { e.preventDefault(); setActive(W.active - 1); }
    else if (k === 'n' || k === 'N') { e.preventDefault(); nextOpen(); }
    else if ((k === 'f' || k === 'F') && !locked()) { e.preventDefault(); openFlag(W.active); }
    else if ((k === '0' || k === 'Backspace' || k === 'Delete') && !locked()) { e.preventDefault(); if (W.labels[W.active]) setLabel(W.active, null); }
    else if (k === '?' || k === 'g' || k === 'G') { e.preventDefault(); openGuide(); }
  });

  // ---------------- saving ----------------
  function setSave(txt, err) { const s = $('saveState'); s.textContent = txt; s.classList.toggle('err', !!err); }
  function flagArr() { return Array.from(W.flags.entries()).sort((a, b) => a[0] - b[0]).map(([i, f]) => ({ seg: i, segment_id: W.trace.segs[i][0], reason: f.reason, alts: f.alts || [], note: f.note, created: f.created })); }
  function draftObj() {
    return { labels: W.labels.slice(), flags: flagArr(), dwell: W.dwell.slice(), active_ms: W.activeMs, status: W.status, client_updated: W.clientUpdated, version: W.version, changes: W.changes };
  }
  function saveLocal() { W.clientUpdated = nowIso(); jset(key('draft', W.trace.id), draftObj()); }
  function payload() {
    const d = draftObj();
    return { trace_id: W.trace.id, labels: d.labels, flags: d.flags, dwell_ms: d.dwell, active_ms: d.active_ms, n_segments: W.trace.segs.length,
      text_sha256: W.trace.sha256, seg_sha256: W.trace.seg_sha256, client_updated: d.client_updated,
      meta: { ua: navigator.userAgent.slice(0, 160), viewport: innerWidth + 'x' + innerHeight, n_changes: W.changes, auto_advance: $('autoAdv').checked } };
  }
  async function syncNow() {
    if (LOCAL_ONLY || !W.trace || W.saving || !W.dirty || locked()) return;
    W.saving = true; W.dirty = false;
    try {
      const r = await api('save', payload());
      W.version = r.version; if (r.status) W.status = r.status;
      jset(key('draft', W.trace.id), draftObj());
      setSave('Saved · ' + fmtTime(r.server_updated));
    } catch (err) {
      W.dirty = true;
      if (err.code === 'locked') { const id = W.trace.id; lsDel(key('draft', id)); W.trace = null; openWork(id); toast('This trace was submitted from another device.'); }
      else setSave('Saved on this device · will sync', true);
    } finally { W.saving = false; }
  }
  function flushSave(beacon) {
    if (!W.trace || locked()) return;
    saveLocal();
    if (LOCAL_ONLY || !W.dirty) return;
    if (beacon && navigator.sendBeacon) {
      try { navigator.sendBeacon(API, new Blob([JSON.stringify(Object.assign({ action: 'save', annotator_id: S.id }, payload()))], { type: 'text/plain' })); W.dirty = false; } catch (e) {}
    } else syncNow();
  }
  function onChange() {
    W.dirty = true; W.lastAct = Date.now();
    saveLocal(); updatePanel(); updateStats();
    setSave(LOCAL_ONLY ? 'Saved on this device' : 'Unsaved changes…');
    clearTimeout(W.syncT); W.syncT = setTimeout(syncNow, 4000);
  }
  ['mousemove', 'keydown', 'pointerdown', 'wheel', 'touchstart', 'scroll'].forEach(ev => window.addEventListener(ev, () => { W.lastAct = Date.now(); }, { passive: true }));

  function applyLock() {
    const lk = locked();
    $('lockedNote').hidden = !lk;
    $('submitBtn').disabled = lk; $('submitBtn').textContent = lk ? 'Submitted' : 'Review & submit';
    document.body.classList.toggle('is-locked', lk);
    $('lpBtns').querySelectorAll('button').forEach(b => { b.disabled = lk; });
    $('flagBtn').disabled = lk;
    updatePanel(); updateStats();
  }

  async function openWork(tid) {
    const t = TBY[tid]; if (!t) return go('traces');
    if (W.trace && W.trace.id === tid) return show('work');
    show('work');
    W.trace = t; W.dirty = false; W.saving = false; W.lastAct = Date.now(); W.undo = [];
    $('wTitle').textContent = t.label;
    $('problem').textContent = t.question; typeset($('problem'));
    $('trace').textContent = 'Loading…';
    $('autoAdv').checked = jget(P + 'auto', true) !== false;
    $('tint').checked = jget(P + 'tint', true) !== false; $('trace').classList.toggle('tint', $('tint').checked);
    await new Promise(r => setTimeout(r, 0));
    renderTrace(t);
    let d = localDraft(tid), localAhead = false;
    if (!LOCAL_ONLY) {
      setSave('Loading…');
      try {
        const r = await api('load', { trace_id: tid });
        if (W.trace !== t) return;
        if (r.found && (!d || r.status === 'submitted' || r.status === 'reopened' && d.status === 'submitted' || String(r.client_updated || '') >= String(d.client_updated || ''))) {
          d = { labels: r.labels, flags: r.flags, dwell: r.dwell_ms, active_ms: r.active_ms, status: r.status, client_updated: r.client_updated, version: r.version, changes: (d && d.changes) || 0 };
        } else if (d) {
          if (r.found && r.status === 'reopened') d.status = 'reopened';
          if (d.status === 'submitted') d.status = r.found ? r.status : 'draft'; // a submit that never reached the server
          localAhead = true;
        }
        setSave(localAhead ? 'Unsynced changes…' : r.found ? 'Synced' : 'Not saved yet');
      } catch (err) { if (W.trace !== t) return; setSave('Offline · saving on this device', true); }
    }
    const n = t.segs.length;
    d = d || { labels: [], flags: [], dwell: [], active_ms: 0, status: 'draft', client_updated: '', version: 0 };
    W.labels = new Array(n).fill(null);
    (d.labels || []).slice(0, n).forEach((l, i) => { W.labels[i] = LBY[l] ? l : null; });
    W.flags = new Map();
    (d.flags || []).forEach(f => { if (f && f.seg >= 0 && f.seg < n) W.flags.set(f.seg, { reason: f.reason, alts: f.alts || [], note: f.note, created: f.created }); });
    W.dwell = new Array(n).fill(0); (d.dwell || []).slice(0, n).forEach((v, i) => { W.dwell[i] = Number(v) || 0; });
    W.activeMs = d.active_ms || 0; W.status = d.status || 'draft'; W.clientUpdated = d.client_updated || ''; W.version = d.version || 0; W.changes = d.changes || 0;
    for (let i = 0; i < n; i++) paintSeg(i);
    if (localAhead) { W.dirty = true; setTimeout(syncNow, 1000); }
    let start = jget(key('pos', tid), null);
    if (start == null || start >= n) { start = W.labels.findIndex((l, i) => !l && !W.flags.has(i)); if (start < 0) start = 0; }
    W.active = start;
    applyLock();
    setActive(start, start > 0);
    if (LOCAL_ONLY) setSave(d.client_updated ? 'Saved on this device' : '');
    clearInterval(W.tick);
    let since = 0;
    W.tick = setInterval(() => {
      if (!W.trace) return;
      if (document.visibilityState === 'visible' && Date.now() - W.lastAct < 60000 && !locked() && !document.querySelector('#guideDlg[open]')) {
        W.activeMs += 1000; W.dwell[W.active] += 1000;
        if (++since >= 30) { since = 0; jset(key('draft', W.trace.id), draftObj()); }
      }
      if (Date.now() % SYNC_MS < 1000) syncNow();
    }, 1000);
  }
  function closeWork() {
    if (!W.trace) return;
    flushSave(false);
    clearInterval(W.tick); clearTimeout(W.syncT);
    W.trace = null; W.els = []; $('trace').textContent = '';
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(true); });
  window.addEventListener('pagehide', () => flushSave(true));

  // ---------------- flags ----------------
  let flagSeg = null;
  $('flagAltRow').innerHTML = LABELS.map(l => '<label class="alt"><input type="checkbox" value="' + l.code + '"><span class="tagc t-' + l.code + '">' + esc(l.name) + '</span></label>').join('');
  function openFlag(i) {
    if (!W.trace || locked()) return;
    flagSeg = i;
    const cur = W.flags.get(i);
    $('flagSegNum').textContent = i + 1;
    const c = W.cores[i] || '';
    $('flagQuote').textContent = '“' + (c.length > 220 ? c.slice(0, 220) + '…' : c) + '”';
    document.querySelectorAll('input[name=freason]').forEach(r => { r.checked = r.value === (cur ? cur.reason : 'label_uncertain'); });
    $('flagAltRow').querySelectorAll('input').forEach(x => { x.checked = !!(cur && (cur.alts || []).includes(x.value)) || (!cur && x.value === W.labels[i]); });
    $('flagNote').value = cur ? cur.note : '';
    $('flagClear').checked = !!cur && !W.labels[i];
    $('flagClear').parentElement.hidden = false;
    $('flagDelete').hidden = !cur;
    $('flagDlg').showModal(); $('flagNote').focus();
  }
  $('flagDlg').addEventListener('close', () => {
    if ($('flagDlg').returnValue === 'ok' && flagSeg != null && W.trace) {
      const v = $('flagNote').value.trim();
      if (v) {
        const i = flagSeg, cur = W.flags.get(i);
        W.undo.push({ i: i, before: W.labels[i] || null, flag: cur || null });
        W.flags.set(i, { reason: document.querySelector('input[name=freason]:checked').value, alts: [...$('flagAltRow').querySelectorAll('input:checked')].map(x => x.value), note: v, created: cur ? cur.created : nowIso() });
        if ($('flagClear').checked) W.labels[i] = null;
        W.changes++; paintSeg(i); onChange(); toast('Flag saved');
      }
    }
    flagSeg = null; $('flagDlg').returnValue = '';
  });
  $('flagDelete').addEventListener('click', () => {
    if (flagSeg != null) { const i = flagSeg; W.undo.push({ i: i, before: W.labels[i] || null, flag: W.flags.get(i) || null }); W.flags.delete(i); W.changes++; paintSeg(i); onChange(); toast('Flag removed'); }
    flagSeg = null; $('flagDlg').close('cancel');
  });

  // ---------------- submit ----------------
  $('submitBtn').addEventListener('click', () => {
    if (!W.trace || locked()) return;
    const n = W.labels.length, lab = W.labels.filter(Boolean).length, open = unresolved();
    $('subTitle').textContent = W.trace.label;
    $('subSummary').textContent = n + ' segments · ' + lab + ' labeled · ' + W.flags.size + ' flagged · ' + open + ' unresolved · ' + fmtMin(W.activeMs) + ' active.';
    document.querySelectorAll('.subchk').forEach(c => { c.checked = false; });
    if (open) {
      const first = W.labels.findIndex((l, i) => !l && !W.flags.has(i));
      note($('subNote'), 'warn', '<b>' + open + ' segment' + (open > 1 ? 's are' : ' is') + ' unresolved.</b> Every segment needs a label or an explained flag. <button type="button" class="link" id="goOpen">Go to segment ' + (first + 1) + '</button>');
      $('goOpen').addEventListener('click', () => { $('submitDlg').close('cancel'); setActive(first); });
    } else $('subNote').hidden = true;
    $('subConfirm').disabled = true; $('subConfirm').dataset.blocked = open ? '1' : '';
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
      toast('Trace submitted. Thank you!');
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
      if (err.code === 'incomplete') toast('The server found unresolved segments. Please review and try again.');
      else toast('Could not submit. Check your connection and try again.');
      W.status = prev; saveLocal(); applyLock();
      setSave('Submit failed — try again', true);
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
