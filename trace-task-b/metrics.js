/* TRACE · Task B — agreement metrics for the researcher page (action labels on fixed segments).
 *
 * Unit: one segment (the Gemini 3.8 Flash segments of the 36 Task A windows); nominal labels CONSTRUCT, INSPECT,
 * REVISE, REDIRECT, NONACTION; a segment an annotator flagged without a label is missing for that annotator.
 *   - human-human: Krippendorff's alpha (nominal, primary), Cohen's kappa, Scott's pi, Gwet's AC1, raw agreement;
 *     per label: positive specific agreement and one-vs-rest kappa; the confusion matrix
 *   - 95% CIs: percentile bootstrap over WINDOWS (segments of one window are not independent), seeded
 *   - claim H (preregistered thresholds below): alpha >= 0.80 and one-sided 95% lower bound >= 0.667
 *   - each judge: alpha / kappa / AC1 / macro-F1 against each annotator (mean), Delta = judge alpha - annotator alpha
 *     with a paired window bootstrap (J1 non-inferiority), accuracy / macro-F1 / per-label F1 against the labels both
 *     annotators agree on, the Alternative Annotator Test (Calderon et al., ACL 2025), and J2 (no creator model with a
 *     gap below the floor; needs key.csv)
 *   - strata (model, domain, outcome, position) and per-model label shares with Spearman rho (needs key.csv)
 * The statistics helpers (seeded generator, percentiles, t / Wilcoxon / Kruskal / Spearman, Benjamini–Yekutieli) are
 * copied unchanged from trace-task-a/metrics.js, so Task A and Task B compute them the same way.
 * No DOM access: runs in the browser (window.TaskBMetrics) and in Node (module.exports) for tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TaskBMetrics = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LABELS = ['CONSTRUCT', 'INSPECT', 'REVISE', 'REDIRECT', 'NONACTION'];
  // Thresholds fixed before judge results are seen (same structure as Task A's preregistered_thresholds.json).
  const SEED = 20261115, N_BOOT = 2000;
  const PREREG = { human_reliable: 0.80, human_acceptable_lower: 0.667, noninferiority_delta: 0.05, alt_epsilon: 0.15,
    alt_alpha: 0.05, model_gap_floor: -0.10, ci_level_one_sided: 0.95, primary: 'krippendorff_alpha_nominal', seed: SEED };

  // ---------------------------------------------------------------- helpers
  function rng(seed) {             // mulberry32: small, fast, seeded
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const sum = a => a.reduce((s, x) => s + x, 0);
  const mean = a => a.length ? sum(a) / a.length : NaN;
  const nanmean = a => mean(a.filter(x => x === x));
  function percentile(v, q) {      // numpy.nanpercentile, linear interpolation
    const s = v.filter(x => x === x).sort((a, b) => a - b);
    if (!s.length) return NaN;
    const pos = (s.length - 1) * q / 100, lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }
  const ci = v => [percentile(v, 2.5), percentile(v, 97.5)];
  const lower1 = v => percentile(v, 100 * (1 - PREREG.ci_level_one_sided));
  function roundHalfEven(x) {
    const f = Math.floor(x), d = x - f;
    if (Math.abs(d - 0.5) < 1e-12) return f % 2 === 0 ? f : f + 1;
    return Math.round(x);
  }


  // ---------------------------------------------------------------- distributions (SciPy-compatible)
  function lgamma(x) {   // Lanczos
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1; let a = c[0]; const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function gammaP(a, x) {        // regularized lower incomplete gamma
    if (x <= 0) return 0;
    if (x < a + 1) { let s = 1 / a, t = s; for (let n = 1; n < 500; n++) { t *= x / (a + n); s += t; if (Math.abs(t) < Math.abs(s) * 1e-16) break; } return s * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
    return 1 - gammaQcf(a, x);
  }
  function gammaQcf(a, x) {
    let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break; }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  const gammaQ = (a, x) => x <= 0 ? 1 : (x < a + 1 ? 1 - gammaP(a, x) : gammaQcf(a, x));
  function normCdf(z) { const e = gammaQ(0.5, z * z / 2) / 2; return z >= 0 ? 1 - e : e; }   // 0.5*erfc(-z/sqrt2)
  const chi2Sf = (x, k) => gammaQ(k / 2, x / 2);
  function betacf(a, b, x) {
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
    for (let m = 1; m <= 500; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-16) break;
    }
    return h;
  }
  function incbeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tCdf(t, df) { const x = df / (df + t * t), p = 0.5 * incbeta(df / 2, 0.5, x); return t >= 0 ? 1 - p : p; }

  function rankAvg(v) {          // average ranks (1-based) and tie group sizes
    const idx = v.map((x, i) => i).sort((i, j) => v[i] - v[j]), r = new Array(v.length), ties = [];
    for (let s = 0; s < idx.length;) {
      let e = s; while (e + 1 < idx.length && v[idx[e + 1]] === v[idx[s]]) e++;
      const rk = (s + e + 2) / 2; for (let k = s; k <= e; k++) r[idx[k]] = rk; ties.push(e - s + 1); s = e + 1;
    }
    return { r, ties };
  }
  // scipy.stats.wilcoxon(d, zero_method="wilcox", correction=False, method="auto")
  function wilcoxon(d, alternative) {
    alternative = alternative || 'two-sided';
    const nz = d.filter(x => x !== 0), nZero = d.length - nz.length;
    if (!nz.length) return NaN;
    const { r, ties } = rankAvg(nz.map(Math.abs)), n = nz.length;
    const rplus = sum(nz.map((x, i) => x > 0 ? r[i] : 0));
    const hasTies = ties.some(t => t > 1);
    if (!hasTies && nZero === 0) {             // exact null distribution of W+
      const max = n * (n + 1) / 2; let f = new Array(max + 1).fill(0); f[0] = 1;
      for (let k = 1; k <= n; k++) for (let s = max; s >= k; s--) f[s] += f[s - k];
      const tot = Math.pow(2, n), cdf = k => sum(f.slice(0, Math.max(0, k) + 1)) / tot, sf = k => sum(f.slice(Math.max(0, k))) / tot;
      if (alternative === 'less') return cdf(Math.ceil(rplus));
      if (alternative === 'greater') return sf(Math.floor(rplus));
      return Math.min(1, 2 * Math.min(sf(Math.floor(rplus)), cdf(Math.ceil(rplus))));
    }
    if (d.length <= 13) {                      // SciPy: exhaustive sign-flip permutation test
      const obs = rplus, stats_ = [];
      for (let mask = 0; mask < (1 << d.length); mask++) {
        const dd = d.map((x, i) => (mask >> i) & 1 ? -x : x).filter(x => x !== 0), rr = rankAvg(dd.map(Math.abs)).r;
        stats_.push(sum(dd.map((x, i) => x > 0 ? rr[i] : 0)));
      }
      const eps = 1e-14 * Math.max(1, Math.abs(obs)), N = stats_.length;
      const less = stats_.filter(s => s <= obs + eps).length / N, greater = stats_.filter(s => s >= obs - eps).length / N;
      if (alternative === 'less') return less;
      if (alternative === 'greater') return greater;
      return Math.min(1, 2 * Math.min(less, greater));
    }
    const mn = n * (n + 1) / 4, tie = sum(ties.map(t => t * t * t - t));
    const se = Math.sqrt((n * (n + 1) * (2 * n + 1) - tie / 2) / 24), z = (rplus - mn) / se;
    if (alternative === 'less') return normCdf(z);
    if (alternative === 'greater') return 1 - normCdf(z);
    return 2 * Math.min(normCdf(z), 1 - normCdf(z));
  }
  function kruskal(groups) {     // scipy.stats.kruskal (tie-corrected H, chi-square p)
    const all = [].concat.apply([], groups), N = all.length, { r, ties } = rankAvg(all);
    let off = 0, H = 0;
    groups.forEach(g => { const rs = sum(r.slice(off, off + g.length)); H += rs * rs / g.length; off += g.length; });
    H = 12 / (N * (N + 1)) * H - 3 * (N + 1);
    const c = 1 - sum(ties.map(t => t * t * t - t)) / (N * N * N - N);
    if (c === 0) return NaN;
    return chi2Sf(H / c, groups.length - 1);
  }
  function spearman(x, y) {
    const rx = rankAvg(x).r, ry = rankAvg(y).r, mx = mean(rx), my = mean(ry);
    let sxy = 0, sxx = 0, syy = 0; rx.forEach((v, i) => { sxy += (v - mx) * (ry[i] - my); sxx += (v - mx) ** 2; syy += (ry[i] - my) ** 2; });
    return sxy / Math.sqrt(sxx * syy);
  }
  function byFdr(p) {            // Benjamini–Yekutieli adjusted p-values
    const m = p.length, c = sum(Array.from({ length: m }, (_, i) => 1 / (i + 1)));
    const o = p.map((x, i) => i).sort((i, j) => p[i] - p[j]), adj = new Array(m);
    const vals = o.map((i, k) => p[i] * m * c / (k + 1));
    for (let k = m - 2; k >= 0; k--) vals[k] = Math.min(vals[k], vals[k + 1]);
    o.forEach((i, k) => { adj[i] = Math.min(vals[k], 1); });
    return adj;
  }
  function std1(a) { const m = mean(a); return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1)); }

  // ---------------------------------------------------------------- labels and per-window confusion matrices
  // A coder's labels: {item_id: ['CONSTRUCT', null, ...]} (one entry per segment, null = no label).
  // Every pairwise statistic is a function of the 5x5 confusion matrix summed over windows, so the cluster bootstrap
  // over windows only resamples per-window matrices.
  const IDX = {}; LABELS.forEach((l, i) => { IDX[l] = i; });
  const Q = LABELS.length;
  const zeros = () => Array.from({ length: Q }, () => new Array(Q).fill(0));
  function confusion(a, b) {          // a, b: label arrays of one window; rows = a, cols = b; both labeled only
    const C = zeros();
    const n = Math.min(a ? a.length : 0, b ? b.length : 0);
    for (let s = 0; s < n; s++) { const x = IDX[a[s]], y = IDX[b[s]]; if (x != null && y != null) C[x][y]++; }
    return C;
  }
  function addInto(T, C) { for (let i = 0; i < Q; i++) for (let j = 0; j < Q; j++) T[i][j] += C[i][j]; return T; }
  function sumC(list) { const T = zeros(); list.forEach(C => addInto(T, C)); return T; }
  // parts: one confusion matrix per window (ids order)
  function parts(sa, sb, ids) { return ids.map(i => confusion(sa[i], sb[i])); }

  // ---------------------------------------------------------------- statistics of one (pooled) confusion matrix
  function statsC(C) {
    let N = 0, agree = 0; const ra = new Array(Q).fill(0), cb = new Array(Q).fill(0);
    for (let i = 0; i < Q; i++) for (let j = 0; j < Q; j++) { N += C[i][j]; ra[i] += C[i][j]; cb[j] += C[i][j]; if (i === j) agree += C[i][j]; }
    const out = { n: N };
    if (!N) { ['po', 'kappa', 'pi', 'alpha', 'ac1', 'macro_f1'].forEach(k => { out[k] = NaN; }); out.per_label = {}; return out; }
    const po = agree / N, pa = ra.map(x => x / N), pb = cb.map(x => x / N);
    const peK = sum(pa.map((x, k) => x * pb[k]));
    const pbar = pa.map((x, k) => (x + pb[k]) / 2);
    const peP = sum(pbar.map(x => x * x));
    const peG = sum(pbar.map(x => x * (1 - x))) / (Q - 1);                       // Gwet's AC1 chance agreement
    // Krippendorff's alpha (nominal) for two coders: coincidence matrix o_ck = C_ck + C_kc, n = 2N values
    const nc = pa.map((x, k) => ra[k] + cb[k]), nv = 2 * N;
    let Do = 0, De = 0;
    for (let c = 0; c < Q; c++) for (let k = 0; k < Q; k++) if (c !== k) { Do += C[c][k] + C[k][c]; De += nc[c] * nc[k]; }
    out.po = po;
    out.kappa = peK === 1 ? NaN : (po - peK) / (1 - peK);
    out.pi = peP === 1 ? NaN : (po - peP) / (1 - peP);
    out.alpha = De === 0 ? NaN : 1 - (nv - 1) * (Do / 2) / (De / 2);
    out.ac1 = peG === 1 ? NaN : (po - peG) / (1 - peG);
    // per label: positive specific agreement, one-vs-rest kappa, P/R/F1 of the column coder (b) against the row coder (a)
    out.per_label = {};
    const f1s = [];
    LABELS.forEach((l, k) => {
      const both = C[k][k], na = ra[k], nb = cb[k];
      const psa = na + nb ? 2 * both / (na + nb) : NaN;
      const t11 = both, t10 = na - both, t01 = nb - both, t00 = N - t11 - t10 - t01;
      const p1 = (t11 + t10) / N, q1 = (t11 + t01) / N, pe2 = p1 * q1 + (1 - p1) * (1 - q1);
      const k2 = pe2 === 1 ? NaN : ((t11 + t00) / N - pe2) / (1 - pe2);
      const prec = nb ? both / nb : NaN, rec = na ? both / na : NaN;
      const f1 = prec + rec > 0 ? 2 * prec * rec / (prec + rec) : (na || nb ? 0 : NaN);
      if (na) f1s.push(f1);                                                   // macro-F1 over labels present in the reference
      out.per_label[l] = { psa: psa, kappa: k2, n_a: na, n_b: nb, both: both, precision: prec, recall: rec, f1: f1 };
    });
    out.macro_f1 = f1s.length ? mean(f1s) : NaN;
    return out;
  }
  // Krippendorff's alpha (nominal) for any number of coders with missing values: units = segments.
  function alphaMulti(coders, ids) {
    const o = zeros(); let any = false;
    ids.forEach(i => {
      const n = Math.max.apply(null, coders.map(c => (c[i] || []).length).concat([0]));
      for (let s = 0; s < n; s++) {
        const vals = coders.map(c => (c[i] || [])[s]).map(v => IDX[v]).filter(v => v != null);
        const m = vals.length; if (m < 2) continue; any = true;
        for (let x = 0; x < m; x++) for (let y = 0; y < m; y++) if (x !== y) o[vals[x]][vals[y]] += 1 / (m - 1);
      }
    });
    if (!any) return NaN;
    const nc = o.map(r => sum(r)), n = sum(nc);
    let Do = 0, De = 0;
    for (let c = 0; c < Q; c++) for (let k = 0; k < Q; k++) if (c !== k) { Do += o[c][k]; De += nc[c] * nc[k]; }
    return De === 0 ? NaN : 1 - (n - 1) * Do / De;
  }

  // ---------------------------------------------------------------- bootstrap over windows
  function bootIdx(n, nBoot, seed) {
    const r = rng(seed == null ? SEED : seed), out = [];
    for (let b = 0; b < nBoot; b++) { const row = new Array(n); for (let k = 0; k < n; k++) row[k] = Math.floor(r() * n); out.push(row); }
    return out;
  }
  const take = (P, row) => row.map(k => P[k]);
  const bootStat = (P, key, BI) => BI.map(row => statsC(sumC(take(P, row)))[key]);

  // ---------------------------------------------------------------- claim H: human-human reliability
  function humanReliability(H, names, ids, BI) {
    const A = H[names[0]], Bn = H[names[1]], P = parts(A, Bn, ids), C = sumC(P), hh = statsC(C);
    const boots = {}; ['alpha', 'kappa', 'po', 'ac1', 'pi'].forEach(k => { boots[k] = bootStat(P, k, BI); });
    const lower = lower1(boots.alpha);
    const verdict = hh.alpha >= PREREG.human_reliable && lower >= PREREG.human_acceptable_lower ? 'RELIABLE'
      : lower >= PREREG.human_acceptable_lower ? 'ACCEPTABLE' : 'NOT RELIABLE';
    const table = [
      { metric: "Krippendorff's α (nominal, primary)", key: 'alpha' }, { metric: "Cohen's κ", key: 'kappa' }, { metric: "Scott's π", key: 'pi' },
      { metric: "Gwet's AC1", key: 'ac1' }, { metric: 'Raw agreement', key: 'po' }
    ].map(r => ({ metric: r.metric, value: hh[r.key], ci: ci(boots[r.key]) }));
    // per-label 95% CIs (bootstrap) for the specific agreement
    const psaBoot = {}; LABELS.forEach(l => { psaBoot[l] = BI.map(row => statsC(sumC(take(P, row))).per_label[l].psa); });
    LABELS.forEach(l => { hh.per_label[l].psa_ci = ci(psaBoot[l]); });
    return { pair: names.slice(0, 2), P, C, hh, boots, lower, verdict, table };
  }

  // ---------------------------------------------------------------- consensus labels (both annotators agree)
  function consensus(A, Bn, ids) {
    const out = {};
    ids.forEach(i => { const a = A[i] || [], b = Bn[i] || []; out[i] = a.map((x, s) => (x && x === b[s] ? x : null)); });
    return out;
  }

  // ---------------------------------------------------------------- the Alternative Annotator Test (Calderon et al., ACL 2025)
  // instances = segments labeled by the judge and every annotator; alignment = same label (mean over the other annotators)
  function altTest(judge, H, ids, eps, alpha) {
    const names = Object.keys(H), res = [], pvals = [];
    const inst = [];
    ids.forEach(i => { const n = (judge[i] || []).length; for (let s = 0; s < n; s++) {
      if (IDX[judge[i][s]] == null) continue;
      if (names.every(a => IDX[(H[a][i] || [])[s]] != null)) inst.push([i, s]);
    } });
    names.forEach(j => {
      const others = names.filter(k => k !== j);
      const Sf = inst.map(([i, s]) => mean(others.map(o => (judge[i][s] === H[o][i][s] ? 1 : 0))));
      const Sh = inst.map(([i, s]) => mean(others.map(o => (H[j][i][s] === H[o][i][s] ? 1 : 0))));
      const Wf = Sf.map((x, k) => x >= Sh[k] ? 1 : 0), Wh = Sh.map((x, k) => x >= Sf[k] ? 1 : 0);
      const d = Wh.map((x, k) => x - Wf[k]), n = d.length;
      let p;
      if (!(n > 1) || std1(d) === 0) p = mean(d) < eps ? 0 : 1;
      else if (n >= 30) p = tCdf((mean(d) - eps) / (std1(d) / Math.sqrt(n)), n - 1);
      else p = wilcoxon(d.map(x => x - eps), 'less');
      pvals.push(p); res.push({ excluded: j, rho_f: mean(Wf), rho_h: mean(Wh), p: p, n: n });
    });
    byFdr(pvals).forEach((a, k) => { res[k].p_BY = a; res[k].judge_wins = a < alpha; });
    return { omega: mean(res.map(r => (r.judge_wins ? 1 : 0))), rho: mean(res.map(r => r.rho_f)), rows: res, n_instances: inst.length };
  }

  // ---------------------------------------------------------------- claims J1/J2: each judge against the annotators
  // H: {annotator: labels}; J: {judge: labels}; meta: {item_id: {model_code, domain, correct, position}} or null
  function judgesVsHumans(H, J, ids, BI, hr, meta) {
    const ann = Object.keys(H), Phh = hr.P, rows = [], detail = {};
    const cons = consensus(H[ann[0]], H[ann[1]], ids);
    Object.keys(J).forEach(name => {
      const Jn = J[name], PJ = {}, perAnn = {};
      ann.forEach(a => { PJ[a] = parts(H[a], Jn, ids); perAnn[a] = statsC(sumC(PJ[a])); });   // rows = annotator (reference), cols = judge
      const m = {}; ['alpha', 'kappa', 'po', 'ac1', 'macro_f1'].forEach(k => { m[k] = mean(ann.map(a => perAnn[a][k])); });
      const meanAlpha = row => mean(ann.map(a => statsC(sumC(take(PJ[a], row))).alpha));
      const diff = BI.map(row => meanAlpha(row) - statsC(sumC(take(Phh, row))).alpha);
      const aJ = BI.slice(0, 500).map(meanAlpha);
      const delta = m.alpha - hr.hh.alpha, lower = lower1(diff);
      const Pc = parts(cons, Jn, ids), Cc = sumC(Pc), vc = statsC(Cc);                     // judge vs the agreed labels
      const f1Boot = BI.slice(0, 500).map(row => statsC(sumC(take(Pc, row))).macro_f1);
      const alt = altTest(Jn, H, ids, PREREG.alt_epsilon, PREREG.alt_alpha);
      // label distribution
      const dist = {}; LABELS.forEach(l => { dist[l] = 0; }); let nlab = 0;
      ids.forEach(i => (Jn[i] || []).forEach(x => { if (IDX[x] != null) { dist[x]++; nlab++; } }));
      // J2: per model, mean judge-annotator alpha minus annotator-annotator alpha on that model's windows
      let byModel = null, worst = null, worstGap = NaN, J2 = null;
      if (meta) {
        const g = {}; ids.forEach((i, k) => { const mc = (meta[i] || {}).model_code; if (mc) (g[mc] = g[mc] || []).push(k); });
        byModel = {};
        Object.keys(g).sort().forEach(mc => {
          const ks = g[mc], hhA = statsC(sumC(ks.map(k => Phh[k]))).alpha;
          const jA = mean(ann.map(a => statsC(sumC(ks.map(k => PJ[a][k]))).alpha));
          byModel[mc] = { windows: ks.length, judge_alpha: jA, human_alpha: hhA, gap: jA - hhA };
        });
        const ms = Object.keys(byModel).filter(mc => byModel[mc].gap === byModel[mc].gap);
        if (ms.length) {
          worst = ms.reduce((x, y) => (byModel[y].gap < byModel[x].gap ? y : x));
          worstGap = byModel[worst].gap;
          J2 = ms.every(mc => byModel[mc].gap >= PREREG.model_gap_floor);
        }
      }
      const J1 = lower > -PREREG.noninferiority_delta;
      rows.push({ judge: name, alpha: m.alpha, alpha_ci: ci(aJ), kappa: m.kappa, po: m.po, ac1: m.ac1, macro_f1_vs_annotators: m.macro_f1,
        delta_vs_human: delta, delta_lower95: lower, ceiling_ratio: hr.hh.alpha ? m.alpha / hr.hh.alpha : NaN,
        consensus_n: vc.n, consensus_accuracy: vc.po, consensus_macro_f1: vc.macro_f1, consensus_macro_f1_ci: ci(f1Boot),
        consensus_f1: LABELS.reduce((o, l) => { o[l] = vc.per_label[l].f1; return o; }, {}),
        alt_omega: alt.omega, alt_rho: alt.rho, worst_model: worst, worst_model_gap: worstGap,
        J1_noninferior: J1, J2_no_model_failure: J2, VALIDATED: hr.verdict !== 'NOT RELIABLE' && J1 && J2 === true,
        labeled: nlab, distribution: dist });
      detail[name] = { perAnn: perAnn, consensus: vc, consensusC: Cc, alt: alt, byModel: byModel };
    });
    rows.sort((a, b) => (b.alpha - a.alpha) || 0);
    return { rows: rows, detail: detail };
  }

  // ---------------------------------------------------------------- strata and model-level action rates
  function stratumTable(sx, sy, ids, meta, label) {
    const rows = [];
    ['model_code', 'domain', 'correct', 'position'].forEach(col => {
      const g = {}; ids.forEach(i => { const m = meta[i]; if (!m) return; (g[String(m[col])] = g[String(m[col])] || []).push(i); });
      Object.keys(g).sort().forEach(lvl => {
        const P = parts(sx, sy, g[lvl]), a = statsC(sumC(P)).alpha;
        const BI = bootIdx(P.length, 1000, SEED + 7919), bs = BI.map(row => statsC(sumC(take(P, row))).alpha), c = ci(bs);
        rows.push({ pair: label, stratum: col, level: lvl, windows: g[lvl].length, alpha: a, lo: c[0], hi: c[1] });
      });
    });
    return rows;
  }
  // share of each label per creator model, annotators (mean) vs each judge; Spearman of the model ranking per label
  function modelRates(H, J, ids, meta) {
    const ann = Object.keys(H), byM = {};
    const add = (acc, arr) => (arr || []).forEach(x => { if (IDX[x] != null) { acc[x] = (acc[x] || 0) + 1; acc._n = (acc._n || 0) + 1; } });
    ids.forEach(i => {
      const m = meta[i]; if (!m) return;
      const r = (byM[m.model_code] = byM[m.model_code] || { human: ann.map(() => ({})), judges: {} });
      ann.forEach((a, k) => add(r.human[k], H[a][i]));
      Object.keys(J).forEach(j => { add(r.judges[j] = r.judges[j] || {}, J[j][i]); });
    });
    const models = Object.keys(byM).sort(), rate = (acc, l) => (acc._n ? (acc[l] || 0) / acc._n : NaN);
    const rates = models.map(mc => {
      const o = { model_code: mc, human: {}, judges: {} };
      LABELS.forEach(l => { o.human[l] = mean(byM[mc].human.map(acc => rate(acc, l))); });
      Object.keys(J).forEach(j => { o.judges[j] = {}; LABELS.forEach(l => { o.judges[j][l] = rate(byM[mc].judges[j] || {}, l); }); });
      return o;
    });
    const rho = {}; Object.keys(J).forEach(j => { rho[j] = {}; LABELS.forEach(l => {
      const x = rates.map(r => r.human[l]), y = rates.map(r => r.judges[j][l]);
      rho[j][l] = models.length > 2 && new Set(x).size > 1 && new Set(y).size > 1 ? spearman(x, y) : NaN;
    }); });
    return { rates: rates, rho: rho };
  }

  return { SEED: SEED, N_BOOT: N_BOOT, PREREG: PREREG, LABELS: LABELS, rng: rng, percentile: percentile, ci: ci, lower1: lower1,
    confusion: confusion, sumC: sumC, parts: parts, statsC: statsC, alphaMulti: alphaMulti, bootIdx: bootIdx, consensus: consensus,
    humanReliability: humanReliability, altTest: altTest, judgesVsHumans: judgesVsHumans, stratumTable: stratumTable, modelRates: modelRates,
    wilcoxon: wilcoxon, spearman: spearman, byFdr: byFdr, tCdf: tCdf };
}));
