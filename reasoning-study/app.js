/* Reasoning Study — participant pages (public access: guidelines and the question page only). */
(function () {
  'use strict';
  const CFG = window.STUDY_CONFIG || {};
  const API = CFG.apiUrl || '';
  const SAVE_MS = 30000;
  const DOMAIN_NAME = { math: 'Mathematics', physics: 'Physics', chemistry: 'Chemistry' };
  const QID = {};
  (window.QUESTIONS || []).forEach(q => { QID[q.id] = q; });

  const $ = (id) => document.getElementById(id);
  const views = ['landing', 'details', 'work', 'done'];
  function show(v) { views.forEach(n => { $('v-' + n).hidden = n !== v; }); window.scrollTo(0, 0); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function jget(k, d) { try { return JSON.parse(lsGet(k)) || d; } catch (e) { return d; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function words(s) { return (s.trim().match(/\S+/g) || []).length; }
  function notice(el, kind, html) { el.className = 'note' + (kind ? ' ' + kind : ''); el.innerHTML = html; el.hidden = false; }
  function fmtTime(ms) { return ms ? new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; }
  function typeset(el) {
    const go = () => { try { window.MathJax.typesetClear([el]); window.MathJax.typesetPromise([el]).catch(() => {}); } catch (e) {} };
    if (window.MathJax && window.MathJax.typesetPromise) go();
    else { let n = 0; const t = setInterval(() => { if (window.MathJax && window.MathJax.typesetPromise) { clearInterval(t); go(); } else if (++n > 60) clearInterval(t); }, 250); }
  }

  // ---------------- contact + example ----------------
  if (CFG.contactEmail) {
    document.querySelectorAll('.contact-line').forEach(el => { el.innerHTML = ' Questions? Email <a></a>.'; const a = el.querySelector('a'); a.href = 'mailto:' + CFG.contactEmail; a.textContent = CFG.contactEmail; });
    document.querySelectorAll('.contact-foot').forEach(el => { el.innerHTML = '<a></a>'; const a = el.querySelector('a'); a.href = 'mailto:' + CFG.contactEmail; a.textContent = 'Questions? ' + CFG.contactEmail; });
  }
  // The worked example (same on the landing page and in the study information). Only the equations are typeset, so "$24" stays text.
  const M = (tex) => '<div class="ex-math">\\(' + tex + '\\)</div>';
  const SAMPLE =
    '<div class="ex-head">From first thought to final answer</div>' +
    '<div class="ex-q"><div class="ex-label">The question</div><p>A book costs $24. It is discounted by 25%, then 8% sales tax is added to the discounted price. What is the final price?</p></div>' +
    '<div class="ex-r"><div class="ex-label">An illustrative first-person response</div>' +
    '<p>Umm, I need the price after both changes. I’ll start with the discount. Twenty-five percent is one quarter, so 24 divided by 4 gives 6.</p>' +
    '<p>Is $6 the new price? Wait, no—that’s the amount taken off. I need to subtract it from $24.</p>' +
    M('24 - 6 = 18') +
    '<p>So I have $18 before tax. The question says the tax is added to the discounted price, so I should use 18, not 24.</p>' +
    M('18 \\times 0.08 = 1.44') +
    '<p>I’ll add that tax to $18.</p>' +
    M('18 + 1.44 = 19.44') +
    '<p>I think that completes both changes. My final answer is <strong>$19.44</strong>.</p></div>' +
    '<div class="ex-foot">This invented example shows the level of detail and first-person style. Record your own thoughts; do not copy its wording, add hesitations, or invent mistakes or checks.</div>';
  ['sampleTop', 'sampleDetails'].forEach(id => { const el = $(id); el.innerHTML = SAMPLE; el.querySelectorAll('.ex-math').forEach(typeset); });

  // ---------------- api ----------------
  async function api(action, payload) {
    if (!API || API.indexOf('PASTE') === 0) throw Object.assign(new Error('not_configured'), { code: 'not_configured' });
    const res = await fetch(API, { method: 'POST', body: JSON.stringify(Object.assign({ action: action }, payload || {})) });
    const j = await res.json();
    if (!j.ok) throw Object.assign(new Error(j.error || 'error'), { code: j.error });
    return j;
  }
  function errText(e) {
    const c = e && e.code;
    if (c === 'not_configured') return 'The study is not connected yet. Please tell the researcher.';
    if (c === 'closed') return 'The study isn\'t accepting new answers right now. Please check back later.';
    if (c === 'consent_required') return 'Tick all three boxes to continue.';
    if (c === 'name_required') return 'Enter your name.';
    if (c === 'bad_email') return 'Enter a valid email address, like name@example.com.';
    if (c === 'no_skips') return 'You have used both of your skips. Please give this question your best attempt.';
    if (c === 'unknown_code') return 'That participation was not found. It may already have been deleted.';
    return 'The study server couldn\'t be reached. Check your connection and try again.';
  }

  // ---------------- local state ----------------
  // codes this browser holds: [{code, email, uid, domain}]
  const codes = () => jget('rs_codes', []);
  function addCode(c) { const l = codes().filter(x => x.code !== c.code); l.push(c); lsSet('rs_codes', JSON.stringify(l)); }
  function dropCode(code) { lsSet('rs_codes', JSON.stringify(codes().filter(x => x.code !== code))); lsDel('rs_draft:' + code); }
  const S = { status: null, domain: null, cur: null, profile: jget('rs_profile', {}), startedAt: 0, activeMs: 0, lastInput: 0, pasteCount: 0, pastedChars: 0, dirty: false, saving: null, lastDone: null };

  // ---------------- edit log: every change, deletions included ----------------
  const L = { code: null, ops: [], prev: { w: '', a: '' } };
  function logStart(code, w, a) { L.code = code; L.prev = { w: w, a: a }; L.ops = [{ t: Date.now(), k: 'open', w: w, a: a }]; S.dirty = true; }
  function logChange(f) {
    if (!L.code) return;
    const nv = f === 'w' ? $('working').value : $('finalAnswer').value, ov = L.prev[f];
    if (nv === ov) return;
    const m = Math.min(nv.length, ov.length);
    let p = 0; while (p < m && nv[p] === ov[p]) p++;
    let s = 0; while (s < m - p && nv[nv.length - 1 - s] === ov[ov.length - 1 - s]) s++;
    const d = ov.slice(p, ov.length - s), i = nv.slice(p, nv.length - s), t = Date.now();
    L.prev[f] = nv;
    const last = L.ops[L.ops.length - 1];
    const near = last && last.f === f && t - (last.t2 || last.t) < 10000;
    if (near && !d && !last.d && last.i && p === last.p + last.i.length) { last.i += i; last.t2 = t; }
    else if (near && d && !i && !last.i && last.d && p + d.length === last.p) { last.d = d + last.d; last.p = p; last.t2 = t; }
    else if (near && d && !i && !last.i && last.d && p === last.p) { last.d += d; last.t2 = t; }
    else L.ops.push({ t: t, f: f, p: p, d: d, i: i });
    S.dirty = true;
  }
  function setSave(text, cls) { const el = $('saveState'); el.className = 'savestate' + (cls ? ' ' + cls : ''); el.innerHTML = '<i class="dot"></i>'; el.append(text); }
  function payload() {
    return { email: S.cur.email, code: S.cur.code, working: $('working').value, finalAnswer: $('finalAnswer').value.trim(), startedAt: S.startedAt,
      activeSeconds: Math.round(S.activeMs / 1000), pasteCount: S.pasteCount, pastedChars: S.pastedChars };
  }
  async function save(kind) {
    if (!S.cur) return;
    if (!kind && !S.dirty) return;
    const cur = S.cur, batch = L.ops.splice(0);
    S.dirty = false;
    const body = Object.assign(payload(), { ops: batch });
    lsSet('rs_draft:' + cur.code, JSON.stringify({ w: body.working, a: body.finalAnswer }));
    if (S.saving) { try { await S.saving; } catch (e) {} }
    if (S.cur === cur) setSave(kind ? 'Sending…' : 'Saving…', 'saving');
    S.saving = api(kind || 'save', body);
    try {
      const r = await S.saving;
      if (r.released || r.gone) { if (S.cur === cur) lost(r); return r; }
      if (S.cur === cur) setSave('Saved to study · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), '');
      return r;
    } catch (e) {
      if (L.code === cur.code) { L.ops = batch.concat(L.ops); S.dirty = true; }
      if (S.cur === cur) setSave('Not saved yet — retrying in 30 s', 'err');
      throw e;
    } finally { S.saving = null; }
  }
  setInterval(() => { if (S.cur) save().catch(() => {}); }, SAVE_MS);
  function beacon() {
    if (!S.cur || !S.dirty || !navigator.sendBeacon || !API) return;
    const body = Object.assign(payload(), { ops: L.ops.splice(0), action: 'save' });
    S.dirty = false;
    try { navigator.sendBeacon(API, new Blob([JSON.stringify(body)], { type: 'text/plain' })); } catch (e) {}
  }
  window.addEventListener('pagehide', beacon);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') beacon(); });

  // ---------------- landing ----------------
  async function refreshStatus() {
    try {
      S.status = await api('status', { codes: codes().map(c => c.code) });
      // forget codes the server no longer has (withdrawn by the researcher)
      const known = new Set(S.status.mine.map(m => m.code));
      codes().forEach(c => { if (!known.has(c.code)) dropCode(c.code); });
    } catch (e) { S.status = null; if (e.code === 'not_configured') notice($('landingNotice'), 'err', errText(e)); }
    renderLanding();
  }
  function renderLanding() {
    const st = S.status;
    if (st && !st.open) notice($('landingNotice'), '', '<strong>Collection is paused.</strong> The study isn\'t accepting new answers right now. Please check back later.');
    else if (st) $('landingNotice').hidden = true;
    const mine = (st && st.mine) || [];
    const list = $('mineList'); list.innerHTML = '';
    const local = {}; codes().forEach(c => { local[c.code] = c; });
    const label = { active: 'In progress', done: 'Submitted', skipped: 'Skipped', expired: 'Deleted (no save for 24 h)', released: 'Released' };
    mine.forEach(m => {
      const c = local[m.code]; if (!c) return;
      const item = document.createElement('div'); item.className = 'mine-item';
      const left = document.createElement('div');
      left.innerHTML = '<strong></strong> · <span class="code-chip"></span><div class="small muted"></div>';
      left.querySelector('strong').textContent = DOMAIN_NAME[m.domain] || m.domain;
      left.querySelector('.code-chip').textContent = m.code;
      left.querySelector('.small').textContent = (label[m.state] || m.state) + (m.lastActive ? ' · last saved ' + fmtTime(m.lastActive) : '');
      const right = document.createElement('div'); right.className = 'row';
      if (m.state === 'active' && st.open) { const b = document.createElement('button'); b.className = 'primary'; b.type = 'button'; b.textContent = 'Continue'; b.onclick = () => resume(c); right.append(b); }
      if (m.state !== 'expired') { const w = document.createElement('button'); w.type = 'button'; w.className = 'link danger-link'; w.textContent = 'Withdraw and delete'; w.onclick = () => confirmInline(item, c); right.append(w); }
      else { const f = document.createElement('button'); f.type = 'button'; f.className = 'link'; f.textContent = 'Remove from list'; f.onclick = () => { dropCode(c.code); refreshStatus(); }; right.append(f); }
      item.append(left, right); list.append(item);
    });
    $('mineBox').hidden = list.children.length === 0;
  }
  function confirmInline(item, c) {
    if (item.querySelector('.confirm')) return;
    const box = document.createElement('div'); box.className = 'confirm'; box.style.flexBasis = '100%';
    box.innerHTML = '<p><strong>Delete this participation?</strong> Everything stored for it is permanently removed.</p><div class="row"><button type="button" style="color:var(--red)">Delete</button><button type="button">Cancel</button></div>';
    const [yes, no] = box.querySelectorAll('button');
    no.onclick = () => box.remove();
    yes.onclick = async () => { yes.disabled = true; try { await api('withdraw', { email: c.email, code: c.code }); dropCode(c.code); notice($('landingNotice'), '', 'Your participation <span class="code-chip">' + esc(c.code) + '</span> was withdrawn and deleted.'); refreshStatus(); } catch (e) { yes.disabled = false; box.querySelector('p').textContent = errText(e); } };
    item.append(box);
  }

  // ---------------- step 2: details ----------------
  function chooseDomain(d) {
    S.domain = d;
    $('detailsDomain').textContent = DOMAIN_NAME[d];
    const p = S.profile;
    if (p.name) $('pName').value = p.name;
    if (p.email) $('pEmail').value = p.email;
    if (p.degree) $('pDegree').value = p.degree;
    if (p.role) $('pRole').value = p.role;
    if (p.subject) $('pSubject').value = p.subject;
    $('detailsError').hidden = true;
    show('details');
  }
  $('changeDomain').onclick = () => { show('landing'); document.getElementById('domains').scrollIntoView(); };
  $('detailsBack').onclick = () => { show('landing'); renderLanding(); };
  $('detailsForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const err = $('detailsError');
    const p = { name: $('pName').value.trim(), email: $('pEmail').value.trim().toLowerCase(), degree: $('pDegree').value, role: $('pRole').value, subject: $('pSubject').value.trim() };
    const fail = (m, el) => { err.textContent = m; err.hidden = false; if (el) el.focus(); };
    if (!p.name) return fail('Enter your name.', $('pName'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return fail('Enter a valid email address, like name@example.com.', $('pEmail'));
    if (!p.degree) return fail('Choose your highest completed degree or qualification.', $('pDegree'));
    if (!p.role) return fail('Choose your current role or study.', $('pRole'));
    if (!p.subject) return fail('Enter your main subject or discipline.', $('pSubject'));
    if (!$('cAdult').checked || !$('cConsent').checked || !$('cNoAI').checked) return fail('Tick all three boxes to continue.');
    err.hidden = true;
    S.profile = p; lsSet('rs_profile', JSON.stringify(p));
    await assign(S.domain, $('detailsSubmit'), err);
  });
  async function assign(d, btn, errEl) {
    const p = S.profile;
    if (btn) btn.disabled = true;
    try {
      const r = await api('assign', { email: p.email, domain: d, codes: codes().filter(c => c.email === p.email).map(c => c.code),
        profile: Object.assign({}, p, { adult: true, consent: true, agreedNoAI: true }) });
      if (r.none) return showDone('none', d, null);
      if (r.gone) return showDone('none', d, null);
      addCode({ code: r.code, email: p.email, uid: r.uid, domain: r.domain });
      openQuestion(Object.assign({ email: p.email }, r));
    } catch (e) {
      if (errEl) { errEl.textContent = errText(e); errEl.hidden = false; }
      else { show('landing'); notice($('landingNotice'), 'err', errText(e)); }
    } finally { if (btn) btn.disabled = false; }
  }
  async function resume(c) {
    try {
      const r = await api('resume', { email: c.email, code: c.code });
      if (r.released || r.gone) { notice($('landingNotice'), '', r.state === 'expired' ? 'That draft was deleted after 24 hours without a save.' : 'That question is no longer held for you. You can take another one.'); refreshStatus(); return; }
      openQuestion(Object.assign({ email: c.email }, r));
    } catch (e) { notice($('landingNotice'), 'err', errText(e)); }
  }

  // ---------------- step 3: workspace ----------------
  function openQuestion(r) {
    const q = QID[r.uid];
    if (!q) { notice($('landingNotice'), 'err', 'This question is missing from the website. Please tell the researcher.'); show('landing'); return; }
    S.cur = { code: r.code, email: r.email, uid: r.uid, domain: q.d }; S.domain = q.d;
    const dr = r.draft || {};
    S.startedAt = dr.startedAt || Date.now(); S.activeMs = (dr.activeSeconds || 0) * 1000; S.pasteCount = dr.pasteCount || 0; S.pastedChars = dr.pastedChars || 0;
    $('wCode').textContent = r.code;
    $('qChips').innerHTML = '<span class="chip">' + esc(DOMAIN_NAME[q.d]) + '</span>' + (q.sub ? '<span class="chip">' + esc(q.sub) + '</span>' : '');
    $('qText').textContent = q.q;
    if (q.u) { $('qUnit').textContent = 'Give your final answer in ' + q.u + '.'; $('qUnit').hidden = false; } else $('qUnit').hidden = true;
    typeset($('qText')); if (q.u) typeset($('qUnit'));
    let w = dr.working || '', a = dr.finalAnswer || '';
    const local = jget('rs_draft:' + r.code, null);
    if (local && (local.w || '').length > w.length) { w = local.w; a = local.a || a; }
    $('working').value = w; $('finalAnswer').value = a;
    ['submitConfirm', 'skipConfirm', 'withdrawConfirm', 'workError'].forEach(id => { $(id).hidden = true; });
    renderSkip();
    setSave(w ? 'Draft restored' : 'Not saved yet', w ? '' : 'saving');
    updateCount();
    logStart(r.code, w, a);
    show('work');
    if (!$('preview').hidden) renderPreview();
    $('working').focus();
  }
  function lost(r) {
    const code = S.cur && S.cur.code;
    S.cur = null; L.code = null;
    if (code) lsDel('rs_draft:' + code);
    showDone(r && r.state === 'expired' ? 'expired' : 'released', S.domain, null);
  }
  function updateCount() { const n = words($('working').value); $('wordCount').textContent = n + (n === 1 ? ' word' : ' words'); }
  function onInput(e) {
    logChange(e.target.id === 'finalAnswer' ? 'a' : 'w');
    S.lastInput = Date.now();
    if (e.target.id === 'working') updateCount();
    if (!$('preview').hidden) { clearTimeout(onInput.pt); onInput.pt = setTimeout(renderPreview, 700); }
    clearTimeout(onInput.lt); onInput.lt = setTimeout(() => { if (S.cur) lsSet('rs_draft:' + S.cur.code, JSON.stringify({ w: $('working').value, a: $('finalAnswer').value })); }, 1500);
  }
  $('working').addEventListener('input', onInput);
  $('finalAnswer').addEventListener('input', onInput);
  ['working', 'finalAnswer'].forEach(id => $(id).addEventListener('paste', (e) => { const t = (e.clipboardData && e.clipboardData.getData('text')) || ''; S.pasteCount++; S.pastedChars += t.length; }));
  setInterval(() => { if (S.cur && document.visibilityState === 'visible' && Date.now() - S.lastInput < 90000) S.activeMs += 5000; }, 5000);

  function bindToolbar(bar, ta, after) {
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-ins]'); if (!b) return;
      const ins = b.dataset.ins, cut = ins.indexOf('|');
      const s = ta.selectionStart, en = ta.selectionEnd, sel = ta.value.slice(s, en);
      const before = ins.slice(0, cut), aft = ins.slice(cut + 1);
      ta.setRangeText(before + sel + aft, s, en, 'end');
      const pos = s + before.length + sel.length;
      ta.focus(); ta.setSelectionRange(pos, pos);
      after({ target: ta });
    });
  }
  // Greek letters and symbols
  const GREEK = 'α β γ δ ε θ λ μ π ρ σ τ φ χ ψ ω Γ Δ Θ Λ Π Σ Φ Ω ∞ ± × ÷ ≤ ≥ ≠ ≈ → ∂ ∇ · °'.split(' ');
  $('greek').innerHTML = GREEK.map(g => '<button type="button" data-ins="' + g + '|" title="' + g + '">' + g + '</button>').join('');
  $('greekBtn').onclick = () => { const g = $('greek'); g.hidden = !g.hidden; $('greekBtn').setAttribute('aria-expanded', String(!g.hidden)); };
  $('greek').addEventListener('click', () => { $('greek').hidden = true; $('greekBtn').setAttribute('aria-expanded', 'false'); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.greek-wrap')) $('greek').hidden = true; });
  $('helpBtn').onclick = () => { const h = $('helpBox'); h.hidden = !h.hidden; $('helpBtn').setAttribute('aria-expanded', String(!h.hidden)); };
  bindToolbar($('toolbar'), $('working'), onInput);
  function renderPreview() { $('preview').textContent = $('working').value || 'Nothing written yet.'; typeset($('preview')); }
  $('previewToggle').onclick = () => {
    const p = $('preview'); p.hidden = !p.hidden;
    $('previewToggle').textContent = p.hidden ? 'Preview equations' : 'Hide preview';
    if (!p.hidden) renderPreview();
  };

  const hideConfirms = () => ['submitConfirm', 'skipConfirm', 'withdrawConfirm'].forEach(id => { $(id).hidden = true; });
  $('submitBtn').onclick = () => {
    const err = $('workError');
    if (words($('working').value) < 5) { notice(err, 'err', 'Write down your working before submitting, even if it is rough or unfinished.'); return; }
    if (!$('finalAnswer').value.trim()) { notice(err, 'err', 'Add a final answer. If you are unsure, give your best guess.'); $('finalAnswer').focus(); return; }
    err.hidden = true; hideConfirms();
    const n = words($('working').value); $('rvWords').textContent = n + (n === 1 ? ' word' : ' words'); $('rvAnswer').textContent = $('finalAnswer').value.trim();
    $('submitConfirm').hidden = false; $('submitConfirm').scrollIntoView({ block: 'nearest' });
  };
  $('submitNo').onclick = hideConfirms;
  $('submitYes').onclick = async () => {
    const cur = S.cur, btn = $('submitYes'); btn.disabled = true;
    try {
      const r = await save('submit');
      if (r && (r.released || r.gone)) return;
      lsDel('rs_draft:' + cur.code); S.cur = null; L.code = null;
      showDone('submitted', cur.domain, cur);
    } catch (e) { notice($('workError'), 'err', 'Your answer couldn\'t be sent. Your draft is kept; check your connection and press Submit again.'); }
    finally { btn.disabled = false; $('submitConfirm').hidden = true; }
  };
  function skipsLeft() { const st = S.status || {}; return Math.max(0, (st.maxSkips || 2) - (st.skipsUsed || 0)); }
  function renderSkip() { const n = skipsLeft(); $('skipBtn').disabled = n === 0; $('skipNote').textContent = n === 0 ? 'You have used both of your skips, so please give this one your best attempt.' : 'No idea where to start? Skipping is welcome. ' + n + ' skip' + (n === 1 ? '' : 's') + ' left.'; }
  $('skipBtn').onclick = () => { if (!skipsLeft()) return; hideConfirms(); $('skipConfirm').hidden = false; };
  $('skipNo').onclick = hideConfirms;
  $('skipYes').onclick = async () => {
    const cur = S.cur, btn = $('skipYes'); btn.disabled = true;
    try { await save('skip'); if (S.status) S.status.skipsUsed = (S.status.skipsUsed || 0) + 1; lsDel('rs_draft:' + cur.code); S.cur = null; L.code = null; showDone('skipped', cur.domain, cur); }
    catch (e) { notice($('workError'), 'err', e.code === 'no_skips' ? errText(e) : 'Skipping didn\'t go through. Check your connection and try again.'); if (e.code === 'no_skips' && S.status) { S.status.skipsUsed = S.status.maxSkips; renderSkip(); } }
    finally { btn.disabled = false; $('skipConfirm').hidden = true; }
  };
  $('withdrawWorkBtn').onclick = () => { hideConfirms(); $('withdrawConfirm').hidden = false; };
  $('withdrawNo').onclick = hideConfirms;
  $('withdrawYes').onclick = async () => {
    const cur = S.cur, btn = $('withdrawYes'); btn.disabled = true;
    try {
      S.cur = null; L.code = null;
      try { await S.saving; } catch (e) {}
      await api('withdraw', { email: cur.email, code: cur.code });
      dropCode(cur.code);
      show('landing'); notice($('landingNotice'), '', 'Your participation <span class="code-chip">' + esc(cur.code) + '</span> was withdrawn and deleted.'); refreshStatus();
    } catch (e) { S.cur = cur; L.code = cur.code; notice($('workError'), 'err', errText(e)); }
    finally { btn.disabled = false; $('withdrawConfirm').hidden = true; }
  };

  // ---------------- done ----------------
  function showDone(kind, d, cur) {
    S.domain = d; S.lastDone = cur;
    const T = {
      submitted: ['Submitted', 'Thank you.', 'Your working and answer are saved. If you would like, you can take another question.'],
      skipped: ['Skipped', 'Question skipped.', 'No problem. You can try a different question or stop here. You have ' + skipsLeft() + ' skip' + (skipsLeft() === 1 ? '' : 's') + ' left.'],
      released: ['Question released', 'This question was given to someone else.', 'It filled up while you were away for more than 3 hours. You can take another question.'],
      expired: ['Draft deleted', 'Your draft was deleted.', 'Unsubmitted drafts are deleted after 24 hours without a save. You can take another question.'],
      none: [DOMAIN_NAME[d] || 'No question', 'No open questions right now.', 'Every open ' + (DOMAIN_NAME[d] || '').toLowerCase() + ' question is complete, already seen by you, or being answered by someone else. Try another domain, or check back later.'],
    }[kind];
    $('doneEyebrow').textContent = T[0]; $('doneTitle').textContent = T[1]; $('doneText').textContent = T[2];
    $('doneCodeBox').hidden = !cur;
    if (cur) $('doneCode').textContent = cur.code;
    $('withdrawDoneConfirm').hidden = true;
    $('anotherSame').hidden = kind === 'none';
    show('done');
  }
  $('withdrawDoneBtn').onclick = () => { $('withdrawDoneConfirm').hidden = false; };
  $('withdrawDoneNo').onclick = () => { $('withdrawDoneConfirm').hidden = true; };
  $('withdrawDoneYes').onclick = async () => {
    const cur = S.lastDone; if (!cur) return;
    const btn = $('withdrawDoneYes'); btn.disabled = true;
    try { await api('withdraw', { email: cur.email, code: cur.code }); dropCode(cur.code); show('landing'); notice($('landingNotice'), '', 'Your participation <span class="code-chip">' + esc(cur.code) + '</span> was withdrawn and deleted.'); refreshStatus(); }
    catch (e) { $('withdrawDoneConfirm').querySelector('p').textContent = errText(e); }
    finally { btn.disabled = false; }
  };
  $('anotherSame').onclick = () => { if (S.profile.email) assign(S.domain, $('anotherSame'), null); else chooseDomain(S.domain); };
  $('anotherHome').onclick = () => { show('landing'); refreshStatus(); };
  $('homeBtn').onclick = () => { if (S.cur) save().catch(() => {}); S.cur = null; L.code = null; show('landing'); refreshStatus(); };
  document.querySelectorAll('[data-domain]').forEach(b => b.onclick = () => chooseDomain(b.dataset.domain));

  // ---------------- try the editor ----------------
  $('tryToolbar').innerHTML = '<span class="ins-label">Insert</span>' + [...$('toolbar').querySelectorAll(':scope > button[data-ins]')].map(b => b.outerHTML).join('') + GREEK.slice(0, 6).map(g => '<button type="button" data-ins="' + g + '|">' + g + '</button>').join('');
  const tryRender = () => { $('tryPreview').textContent = $('tryText').value; typeset($('tryPreview')); };
  bindToolbar($('tryToolbar'), $('tryText'), () => { clearTimeout(tryRender.t); tryRender.t = setTimeout(tryRender, 400); });
  $('tryText').addEventListener('input', () => { clearTimeout(tryRender.t); tryRender.t = setTimeout(tryRender, 500); });
  $('tryEditorBtn').onclick = () => { $('tryDialog').hidden = false; tryRender(); $('tryText').focus(); };
  $('tryClose').onclick = () => { $('tryDialog').hidden = true; };
  $('tryDialog').addEventListener('click', (e) => { if (e.target === $('tryDialog')) $('tryDialog').hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('tryDialog').hidden = true; });

  refreshStatus();
})();
