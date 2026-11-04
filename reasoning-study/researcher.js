/* Reasoning Study — researcher workspace. The host page supplies window.STUDY_API (the data) and, optionally,
   window.STUDY_SAVE (file downloads). In the public setup the host is the dashboard inside the owner's Google Sheet. */
(function () {
  'use strict';
  const DOMAIN_NAME = { math: 'Mathematics', physics: 'Physics', chemistry: 'Chemistry' };
  const QID = {}; (window.QUESTIONS || []).forEach(q => { QID[q.id] = q; });
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const words = (s) => (String(s || '').trim().match(/\S+/g) || []).length;
  const fmt = (ms) => ms ? new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const ago = (ms) => { if (!ms) return '—'; const m = Math.round((Date.now() - ms) / 60000); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function typeset(el) { try { if (window.MathJax && window.MathJax.typesetPromise) { window.MathJax.typesetClear([el]); window.MathJax.typesetPromise([el]).catch(() => {}); } } catch (e) {} }
  let D = null;

  async function api(action, extra) {
    return window.STUDY_API(action, extra || {});
  }

  // ---------- answer check against the gold answer ----------
  function parseNum(s) {
    s = String(s || '').replace(/\\boxed\{([^}]*)\}/g, '$1').replace(/[$,\s]/g, '').replace(/\\(?:,|;|!|\s)/g, '').replace(/−/g, '-');
    s = s.replace(/(?:\\times|×|\*|x)10\^\{?(-?\d+)\}?/i, 'e$1');
    let m = s.match(/^[-+]?(\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?\/[-+]?(\d+(?:\.\d*)?)/i);
    if (m) { const [a, b] = m[0].split('/'); const v = parseFloat(a) / parseFloat(b); return isFinite(v) ? v : null; }
    m = s.match(/\\frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}/);
    if (m) return parseFloat(m[1]) / parseFloat(m[2]);
    m = s.match(/[-+]?(\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/i);
    return m ? parseFloat(m[0]) : null;
  }
  function check(r) {
    const g = (D.gold || {})[r.uid];
    if (!g || g.v == null || !['integer', 'decimal', 'scientific', 'fraction'].includes(g.k)) return 'manual';
    const v = parseNum(r.finalAnswer);
    if (v == null) return 'manual';
    const tol = Math.max(g.tol || 0, 1e-9) * Math.max(Math.abs(g.v), 1e-12);
    return Math.abs(v - g.v) <= tol + 1e-12 ? 'match' : 'differs';
  }
  const CHECK_PILL = { match: '<span class="pill ok">Matches</span>', differs: '<span class="pill bad">Differs</span>', manual: '<span class="pill mute">By hand</span>' };

  function applyOps(ops, upto) {
    let w = '', a = '';
    for (let k = 0; k < Math.min(upto, ops.length); k++) {
      const o = ops[k];
      if (o.k === 'open') { w = o.w || ''; a = o.a || ''; continue; }
      const cur = o.f === 'a' ? a : w;
      const next = cur.slice(0, o.p) + (o.i || '') + cur.slice(o.p + (o.d || '').length);
      if (o.f === 'a') a = next; else w = next;
    }
    return { w: w, a: a };
  }

  // ---------- gate ----------
  $('reload').onclick = () => load(false);
  async function load(fromGate) {
    $('reload').disabled = true;
    $('syncNote').textContent = 'Loading…';
    try {
      D = await api('r_export');
      D.responses.forEach(r => { r.check = check(r); });
      render();
      $('syncNote').textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '. Refresh to see new activity.';
    } catch (e) {
      $('syncNote').textContent = e.code === 'not_owner' ? 'Only the owner can open the researcher workspace.' : 'The data couldn\'t be loaded (' + (e.code || e.message) + '). Try Refresh.';
    } finally { $('reload').disabled = false; }
  }

  // ---------- tabs ----------
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== b.dataset.tab; });
  });

  function render() {
    const t = D.tallies || {}, order = D.order;
    $('collectPill').className = 'pill ' + (D.open ? 'ok' : 'warn');
    $('collectPill').textContent = D.open ? 'Collecting' : 'Collection paused';
    $('toggleCollect').textContent = D.open ? 'Pause collection' : 'Resume collection';
    let full = 0, total = 0, active = 0;
    Object.keys(order).forEach(d => order[d].forEach(u => { total++; const c = t[u] || {}; if (c.done >= D.target) full++; active += c.active || 0; }));
    const matched = D.responses.filter(r => r.check === 'match').length, auto = D.responses.filter(r => r.check !== 'manual').length;
    $('stats').innerHTML = [
      [full + ' / ' + total, 'Questions complete (' + D.target + ' answers)'],
      [D.responses.length, 'Answers collected'],
      [D.participants.length, 'Participants'],
      [active, 'Working right now'],
      [auto ? Math.round(100 * matched / auto) + '%' : '—', 'Auto-checked answers correct'],
    ].map(([v, k]) => '<div class="stat"><b>' + esc(v) + '</b><span>' + esc(k) + '</span></div>').join('');
    document.querySelectorAll('.legend-target').forEach(el => { el.textContent = D.target; });
    renderProgress(); renderResponses(); renderActivity(); renderParticipants();
    if ($('shareLink') && window.STUDY_SITE_URL) $('shareLink').textContent = window.STUDY_SITE_URL;
  }

  function renderProgress() {
    const t = D.tallies || {};
    $('ladders').innerHTML = ['math', 'physics', 'chemistry'].map(d => {
      let f = 0, a = 0;
      const cells = D.order[d].map((u, i) => {
        const c = t[u] || { done: 0, active: 0 }; if (c.done >= D.target) f++; a += Math.min(c.done, D.target);
        return '<button type="button" class="cell' + (c.active ? ' active' : '') + '" data-n="' + (c.done >= D.target ? 3 : Math.min(c.done, 2)) + '" data-uid="' + esc(u) + '" title="#' + (i + 1) + ' ' + esc(u) + ': ' + c.done + ' answered' + (c.active ? ', ' + c.active + ' working' : '') + '" aria-label="' + esc(u) + '"></button>';
      }).join('');
      const pct = Math.round(100 * a / (D.order[d].length * D.target));
      return '<div class="stack" style="gap:10px"><div class="row between"><h3>' + DOMAIN_NAME[d] + '</h3><span class="small muted">' + f + ' of ' + D.order[d].length + ' questions complete · ' + pct + '% of answers collected</span></div><div class="ladder">' + cells + '</div></div>';
    }).join('');
    $('ladders').querySelectorAll('.cell').forEach(c => c.onclick = () => openQuestion(c.dataset.uid));
    // background, aggregated (as it will be reported)
    const count = (key) => { const m = {}; D.participants.forEach(p => { const v = p[key] || 'Not given'; m[v] = (m[v] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const doms = {}; D.responses.forEach(r => { doms[DOMAIN_NAME[r.domain]] = (doms[DOMAIN_NAME[r.domain]] || 0) + 1; });
    const block = (title, rows) => { const max = Math.max(1, ...rows.map(r => r[1])); return '<div class="card stack"><h3>' + title + '</h3><div class="bars">' + (rows.length ? rows.map(([k, n]) => '<div class="bar"><span>' + esc(k) + '</span><span class="track"><i style="width:' + (100 * n / max) + '%"></i></span><span class="n">' + n + '</span></div>').join('') : '<p class="small muted">No data yet.</p>') + '</div></div>'; };
    $('background').innerHTML = block('Highest degree', count('degree')) + block('Current role', count('role')) + block('Answers by domain', Object.entries(doms)) + block('Main subject', count('subject').slice(0, 8));
  }

  function openQuestion(uid) {
    const q = QID[uid] || { q: '(question text not found)', d: '' }, g = (D.gold || {})[uid] || {};
    $('qdTitle').textContent = uid;
    $('qdChips').innerHTML = '<span class="chip">' + esc(DOMAIN_NAME[q.d] || '') + '</span>' + (q.sub ? '<span class="chip">' + esc(q.sub) + '</span>' : '');
    $('qdText').textContent = q.q + (q.u ? '\n\nUnit: ' + q.u : '');
    $('qdGold').textContent = (g.a || '—') + (g.u ? '  (' + g.u + ')' : '');
    const rs = D.responses.filter(r => r.uid === uid);
    const live = D.assignments.filter(a => a.uid === uid && a.state === 'active');
    $('qdAnswers').innerHTML = rs.length ? '' : '<p class="muted">No submitted answers yet' + (live.length ? ' · ' + live.length + ' in progress' : '') + '.</p>';
    rs.forEach(r => {
      const div = document.createElement('div'); div.className = 'stack';
      div.innerHTML = '<div class="row between"><strong></strong>' + CHECK_PILL[r.check] + '</div><p class="small muted"></p><pre class="text"></pre><p><strong>Final answer:</strong> <span class="fa"></span></p>';
      div.querySelector('strong').textContent = r.name || r.email;
      div.querySelector('p.small').textContent = r.degree + ' · ' + r.role + ' · ' + fmt(r.submittedAt);
      div.querySelector('pre').textContent = r.working;
      div.querySelector('.fa').textContent = r.finalAnswer;
      $('qdAnswers').append(div);
    });
    $('qDialog').hidden = false; typeset($('qdText'));
  }
  $('qdClose').onclick = () => { $('qDialog').hidden = true; };
  $('qDialog').addEventListener('click', (e) => { if (e.target === $('qDialog')) $('qDialog').hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('qDialog').hidden = true; });

  // ---------- responses ----------
  ['fDomain', 'fCheck'].forEach(id => $(id).addEventListener('change', renderResponses));
  $('fSearch').addEventListener('input', () => { clearTimeout(renderResponses.t); renderResponses.t = setTimeout(renderResponses, 200); });
  function renderResponses() {
    const fd = $('fDomain').value, fc = $('fCheck').value, fs = $('fSearch').value.trim().toLowerCase();
    const rows = D.responses.slice().sort((a, b) => b.submittedAt - a.submittedAt).filter(r =>
      (!fd || r.domain === fd) && (!fc || r.check === fc) &&
      (!fs || [r.name, r.email, r.uid, r.code].join(' ').toLowerCase().includes(fs)));
    const body = $('respBody'); body.innerHTML = '';
    rows.forEach(r => {
      const g = (D.gold || {})[r.uid] || {};
      const tr = document.createElement('tr');
      tr.innerHTML = '<td class="mono">' + esc(r.code) + '</td><td class="mono">' + esc(r.uid) + '</td><td><div>' + esc(r.name) + '</div><div class="small muted">' + esc(r.email) + '</div></td><td>' + esc(fmt(r.submittedAt)) + '</td><td>' + esc(r.finalAnswer) + '</td><td class="small">' + esc(g.a || '—') + '</td><td>' + CHECK_PILL[r.check] + '</td><td class="num">' + words(r.working) + '</td><td class="num">' + r.deletedChars + '</td><td class="num">' + Math.round(r.activeSeconds / 60) + ' min</td><td>' + (r.pasteCount ? '<span class="flag">' + r.pasteCount + ' (' + r.pastedChars + ')</span>' : '0') + '</td><td><button class="link" type="button">Replay</button></td>';
      const det = document.createElement('tr'); det.className = 'detail'; det.hidden = true;
      det.innerHTML = '<td colspan="12"></td>';
      let built = false;
      tr.querySelector('button').onclick = () => { det.hidden = !det.hidden; if (!built) { replay(det.firstChild, r, true); built = true; } };
      body.append(tr, det);
    });
    $('respNote').textContent = rows.length + ' of ' + D.responses.length + ' responses shown. Pastes show count (characters). Active time counts minutes spent typing with the page open.';
  }

  function replay(td, r, withdrawable) {
    const ops = r.ops || [];
    td.innerHTML = '<div class="replay"><div class="row between"><strong class="lbl small"></strong><span class="small muted chk"></span></div><input type="range" min="0" step="1" aria-label="Edit history position"><pre></pre><p class="small"><strong>Final answer at this point:</strong> <span class="fa"></span></p><h3>Removed text</h3><div class="removed"></div><div class="row between"><p class="small muted meta"></p>' + (withdrawable ? '<button type="button" class="link danger-link wd">Withdraw this participation</button>' : '') + '</div></div>';
    const range = td.querySelector('input'), pre = td.querySelector('pre');
    range.max = String(ops.length); range.value = String(ops.length);
    const draw = () => {
      const n = +range.value, st = applyOps(ops, n), o = ops[n - 1];
      pre.textContent = ops.length ? st.w : r.working;
      td.querySelector('.fa').textContent = ops.length ? st.a : r.finalAnswer;
      td.querySelector('.lbl').textContent = ops.length ? 'Step ' + n + ' of ' + ops.length + (o ? ' · ' + fmt(o.t2 || o.t) : '') : 'No edit history recorded';
    };
    range.oninput = draw; draw();
    if (ops.length) td.querySelector('.chk').textContent = applyOps(ops, ops.length).w === r.working ? 'Replay matches the saved text' : 'Replay differs from the saved text';
    const rem = ops.filter(o => !o.k && o.f !== 'a' && o.d && o.d.trim()), box = td.querySelector('.removed');
    if (!rem.length) box.innerHTML = '<p class="small muted">Nothing was deleted.</p>';
    rem.forEach(o => {
      const d = document.createElement('div'), tm = document.createElement('span'), del = document.createElement('del');
      tm.className = 'small muted'; tm.textContent = fmt(o.t) + '  '; del.textContent = o.d; d.append(tm, del);
      if (o.i) { const ins = document.createElement('span'); ins.className = 'small muted'; ins.textContent = '  → replaced with: ' + o.i; d.append(ins); }
      box.append(d);
    });
    td.querySelector('.meta').textContent = (r.edits != null ? r.edits + ' recorded edits · ' : '') + 'started ' + fmt(r.startedAt);
    const wd = td.querySelector('.wd');
    if (wd) wd.onclick = () => withdraw(r.code, wd);
  }

  // ---------- activity ----------
  function renderActivity() {
    const STATE = { active: '<span class="pill ok">Working</span>', skipped: '<span class="pill mute">Skipped</span>', released: '<span class="pill warn">Released</span>', expired: '<span class="pill bad">Expired</span>' };
    const rows = D.assignments.filter(a => a.state !== 'done').sort((a, b) => b.lastActive - a.lastActive);
    const body = $('actBody'); body.innerHTML = '';
    if (!rows.length) body.innerHTML = '<tr><td colspan="8" class="muted">Nothing in progress.</td></tr>';
    rows.forEach(a => {
      let st = STATE[a.state] || esc(a.state);
      if (a.state === 'active' && Date.now() - a.lastActive > D.claimTtl) st = '<span class="pill warn">Idle &gt; 3 h</span>';
      const p = D.participants.find(x => x.email === a.email) || {};
      const tr = document.createElement('tr');
      tr.innerHTML = '<td class="mono">' + esc(a.code) + '</td><td class="mono">' + esc(a.uid) + '</td><td><div>' + esc(p.name || '') + '</div><div class="small muted">' + esc(a.email) + '</div></td><td>' + st + '</td><td>' + esc(fmt(a.claimedAt)) + '</td><td>' + esc(ago(a.lastActive)) + '</td><td class="num">' + a.draftWords + '</td><td>' + (a.working || a.ops.length ? '<button class="link" type="button">View draft</button>' : '') + '</td>';
      const det = document.createElement('tr'); det.className = 'detail'; det.hidden = true; det.innerHTML = '<td colspan="8"></td>';
      const b = tr.querySelector('button');
      let built = false;
      if (b) b.onclick = () => { det.hidden = !det.hidden; if (!built) { replay(det.firstChild, Object.assign({}, a, { startedAt: a.claimedAt }), true); built = true; } };
      body.append(tr, det);
    });
  }

  // ---------- participants ----------
  function renderParticipants() {
    const sub = {}, skip = {};
    D.responses.forEach(r => { sub[r.email] = (sub[r.email] || 0) + 1; });
    D.assignments.forEach(a => { if (a.state === 'skipped') skip[a.email] = (skip[a.email] || 0) + 1; });
    const body = $('partBody');
    body.innerHTML = D.participants.slice().sort((a, b) => b.lastSeen - a.lastSeen).map(p =>
      '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.email) + '</td><td>' + esc(p.degree) + '</td><td>' + esc(p.role) + '</td><td>' + esc(p.subject) + '</td><td class="num">' + (sub[p.email] || 0) + '</td><td class="num">' + (skip[p.email] || 0) + '</td><td>' + esc(fmt(p.firstSeen)) + '</td><td>' + esc(fmt(p.lastSeen)) + '</td></tr>').join('') ||
      '<tr><td colspan="9" class="muted">No participants yet.</td></tr>';
  }

  // ---------- actions ----------
  $('toggleCollect').onclick = async () => {
    try { const r = await api('r_setOpen', { open: !D.open }); D.open = r.open; render(); }
    catch (e) { $('syncNote').textContent = 'Couldn\'t change the collection state (' + (e.code || e.message) + ').'; }
  };
  async function withdraw(code, btn) {
    if (btn.dataset.armed !== '1') { btn.dataset.armed = '1'; btn.textContent = 'Click again to permanently delete ' + code; return; }
    btn.disabled = true;
    try { await api('r_withdraw', { code: code }); await load(false); }
    catch (e) { btn.textContent = 'Couldn\'t delete (' + (e.code || e.message) + ')'; }
  }
  $('wdBtn').onclick = async () => {
    const code = $('wdCode').value.trim().toUpperCase(), note = $('wdNote');
    if (!/^RS-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) { note.textContent = 'Enter a code like RS-AB12-CD34.'; note.hidden = false; return; }
    if ($('wdBtn').dataset.armed !== code) { $('wdBtn').dataset.armed = code; $('wdBtn').textContent = 'Click again to delete ' + code; return; }
    $('wdBtn').disabled = true;
    try { await api('r_withdraw', { code: code }); note.textContent = code + ' was deleted.'; $('wdCode').value = ''; await load(false); }
    catch (e) { note.textContent = e.code === 'unknown_code' ? 'No participation has that code.' : 'Couldn\'t delete (' + (e.code || e.message) + ').'; }
    finally { note.hidden = false; $('wdBtn').disabled = false; $('wdBtn').dataset.armed = ''; $('wdBtn').textContent = 'Delete participation'; }
  };

  // ---------- downloads ----------
  async function download(name, text, type) {
    if (window.STUDY_SAVE) {
      $('syncNote').textContent = 'Preparing ' + name + '…';
      try { const r = await window.STUDY_SAVE(name, text, type); $('syncNote').innerHTML = r && r.url ? 'Saved to your Google Drive: <a target="_blank" rel="noopener"></a>' : (r && r.message) || 'Saved.'; const a = $('syncNote').querySelector('a'); if (a) { a.href = r.url; a.textContent = r.name || name; } }
      catch (e) { $('syncNote').textContent = 'The file couldn\'t be saved (' + (e.code || e.message) + ').'; }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name; document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  const iso = (ms) => ms ? new Date(ms).toISOString() : '';
  function csv(cols, rows) {
    const cell = (v) => { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return '﻿' + [cols.join(',')].concat(rows.map(r => cols.map(c => cell(r[c])).join(','))).join('\r\n');
  }
  const stamp = () => new Date().toISOString().slice(0, 10);
  $('dlResponses').onclick = () => {
    const cols = ['code', 'uid', 'domain', 'name', 'email', 'degree', 'role', 'subject', 'startedAt', 'submittedAt', 'activeSeconds', 'pasteCount', 'pastedChars', 'edits', 'deletedChars', 'finalAnswer', 'goldAnswer', 'autoCheck', 'working', 'removedText'];
    download('reasoning-study-responses-' + stamp() + '.csv', csv(cols, D.responses.map(r => Object.assign({}, r, {
      startedAt: iso(r.startedAt), submittedAt: iso(r.submittedAt), goldAnswer: ((D.gold || {})[r.uid] || {}).a || '', autoCheck: r.check,
      removedText: (r.ops || []).filter(o => !o.k && o.f !== 'a' && o.d).map(o => '[' + iso(o.t) + '] ' + o.d).join('\n') }))), 'text/csv');
  };
  $('dlParticipants').onclick = () => {
    download('reasoning-study-participants-' + stamp() + '.csv', csv(['name', 'email', 'degree', 'role', 'subject', 'firstSeen', 'lastSeen'], D.participants.map(p => Object.assign({}, p, { firstSeen: iso(p.firstSeen), lastSeen: iso(p.lastSeen) }))), 'text/csv');
  };
  const FORMAT = 'Each op: t = time (ms), f = field (w = working, a = final answer), p = position, d = deleted text, i = inserted text; t2 = end of a merged typing or deleting run. An op with k = "open" sets both fields at the start of a session. Apply ops in order: text = text.slice(0, p) + i + text.slice(p + d.length).';
  $('dlLogs').onclick = () => download('reasoning-study-edit-logs-' + stamp() + '.json', JSON.stringify({ format: FORMAT, responses: D.responses.map(r => ({ code: r.code, uid: r.uid, email: r.email, working: r.working, finalAnswer: r.finalAnswer, ops: r.ops })) }, null, 1), 'application/json');
  $('dlAll').onclick = () => download('reasoning-study-all-' + stamp() + '.json', JSON.stringify(Object.assign({ format: FORMAT }, D), null, 1), 'application/json');

  window.STUDY_OPEN_RESEARCHER = () => { if (!D) load(false); };
  if (window.STUDY_AUTOLOAD) load(false);
})();
