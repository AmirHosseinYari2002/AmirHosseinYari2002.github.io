/* TRACE · Task A — agreement metrics for the researcher page.
 *
 * A line-by-line port of Part B of taskA_human_validation.ipynb (cells B1–B5), so the live numbers on the
 * researcher page are the numbers the notebook reports:
 *   - Boundary Similarity B and its edit operations: segeval 2.x, boundary_similarity / boundary_statistics
 *     (single boundary type, near-miss transpositions spanning up to n_t positions, weighted by distance / n_t)
 *   - kappa_B (Fleiss/Cohen-style) and pi_B (Fleiss/Scott-style): segeval fleiss_kappa_linear / fleiss_pi_linear
 *   - Krippendorff's alpha (nominal) on the yes/no boundary decision at every unit start
 *   - F1 exact and within k units (one-to-one matching), Pk and WindowDiff (segeval, window from the reference)
 *   - percentile bootstrap over windows, chance floor, Wilcoxon / t / Kruskal–Wallis / Spearman (SciPy rules),
 *     Benjamini–Yekutieli, the Alternative Annotator Test (Calderon et al., ACL 2025)
 * The only intended difference: random numbers (bootstrap, chance floor) come from a seeded JavaScript generator,
 * not NumPy's, so confidence intervals can differ from the notebook in the last digit. Part B stays the source
 * of record for the paper.
 * No DOM access: the same file runs in the browser (window.TaskAMetrics) and in Node (module.exports) for tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TaskAMetrics = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Part B, cell "settings" + preregistered thresholds (preregistered_thresholds.json)
  const SEED = 20261115, TOL_UNITS = 3, N_BOOT = 2000;
  const PREREG = { human_reliable: 0.80, human_acceptable_lower: 0.667, noninferiority_delta: 0.05, alt_epsilon: 0.15,
    alt_alpha: 0.05, alt_paper_omega: 0.5, model_gap_floor: -0.10, ceiling_ratio_target: 0.90, ci_level_one_sided: 0.95,
    tol_units: TOL_UNITS, seed: SEED };

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

  // ---------------------------------------------------------------- B1: units
  // char offsets -> sorted unique unit indices (> 0): skip whitespace, then back to the unit start
  function snapUnits(item, offsets) {
    const w = item.window_text, st = item.unit_starts, out = new Set();
    (offsets || []).forEach(c0 => {
      let c = Math.trunc(Number(c0));
      if (!(c > 0) || c >= w.length) return;
      while (c < w.length && /\s/.test(w[c])) c++;
      let lo = 0, hi = st.length;                       // searchsorted(starts, c, side="right") - 1
      while (lo < hi) { const m = (lo + hi) >> 1; if (st[m] <= c) lo = m + 1; else hi = m; }
      const u = lo - 1;
      if (u > 0) out.add(u);
    });
    return Array.from(out).sort((a, b) => a - b);
  }
  function masses(units, n) {
    const b = [0].concat(units, [n]), out = [];
    for (let i = 1; i < b.length; i++) out.push(b[i] - b[i - 1]);
    return out;
  }

  // ---------------------------------------------------------------- segeval: boundary edit distance (one type)
  // A cut before unit u is boundary position u-1 of the boundary string (length n-1).
  function boundaryStats(a, b, n, nt) {
    nt = nt == null ? TOL_UNITS : nt;
    const L = n - 1, A = new Set(a.map(u => u - 1)), Bs = new Set(b.map(u => u - 1));
    const inA = p => A.has(p), inB = p => Bs.has(p), taken = new Set(), trans = [];
    for (let span = 2; span <= nt; span++) {           // segeval: n_t = range(2, n_t + 1), sorted
      const d = span - 1;
      for (let i = 0; i < L - d; i++) {
        const j = i + d;
        if (inA(i) !== inB(i) && inA(j) !== inB(j) && inA(i) !== inA(j) && inB(i) !== inB(j) && !taken.has(i) && !taken.has(j)) {
          trans.push([i, j]); taken.add(i); taken.add(j);
        }
      }
    }
    let matches = 0; const addA = [], addB = [];
    A.forEach(p => { if (Bs.has(p)) matches++; else if (!taken.has(p)) addA.push(p); });
    Bs.forEach(p => { if (!A.has(p) && !taken.has(p)) addB.push(p); });
    const wt = sum(trans.map(t => Math.abs(t[0] - t[1]))) / nt;
    const den = addA.length + addB.length + trans.length + matches;
    return { matches, transpositions: trans.length, spurious: addA.length, missed: addB.length,
             den, num: den - (addA.length + addB.length + wt) };
  }
  function B(a, b, n) {
    if (!a.length && !b.length) return 1;
    const s = boundaryStats(a, b, n, TOL_UNITS);
    return s.den > 0 ? s.num / s.den : 1;
  }
  function editCounts(hyp, ref, n) {      // segeval edit breakdown of hyp vs ref
    if (!hyp.length && !ref.length) return { match: 0, near: 0, spurious: 0, missed: 0 };
    const s = boundaryStats(hyp, ref, n, TOL_UNITS);
    return { match: s.matches, near: s.transpositions, spurious: s.spurious, missed: s.missed };
  }

  // one-to-one matching within k units (two-pointer on sorted positions is optimal)
  function match(a, b, k) {
    a = a.slice().sort((x, y) => x - y); b = b.slice().sort((x, y) => x - y);
    let i = 0, j = 0, m = 0;
    while (i < a.length && j < b.length) {
      if (Math.abs(a[i] - b[j]) <= k) { m++; i++; j++; } else if (a[i] < b[j]) i++; else j++;
    }
    return m;
  }

  // ---------------------------------------------------------------- segeval: Pk and WindowDiff (hyp, ref)
  function labels(ms) { const out = []; ms.forEach((m, i) => { for (let k = 0; k < m; k++) out.push(i + 1); }); return out; }
  function windowSize(refMasses) { const w = roundHalfEven(mean(refMasses) / 2); return w > 1 ? w : 2; }
  function pk(hypM, refM) {
    const ref = labels(refM), hyp = labels(hypM), ws = windowSize(refM);
    let diff = 0, meas = 0;
    for (let i = 0; i < ref.length - ws; i++) {
      if ((ref[i] === ref[i + ws]) !== (hyp[i] === hyp[i + ws])) diff++;
      meas++;
    }
    return meas > 0 ? diff / meas : 0;
  }
  function windowDiff(hypM, refM) {
    const ref = labels(refM), hyp = labels(hypM), ws = windowSize(refM), meas = ref.length - ws;
    let diff = 0;
    for (let i = 0; i < meas; i++) {
      let rb = 0, hb = 0;
      for (let j = i; j < i + ws; j++) { if (ref[j] !== ref[j + 1]) rb++; if (hyp[j] !== hyp[j + 1]) hb++; }
      if (rb !== hb) diff++;
    }
    const den = ref.length - ws;
    return den > 0 ? diff / den : NaN;               // segeval raises here; Part B's _safe turns it into NaN
  }

  // ---------------------------------------------------------------- B2: parts and pooled statistics
  // sa, sb: {item_id: units}; ids: windows; items: {item_id: item}
  function parts(sa, sb, ids, items) {
    return ids.map(i => {
      const a = sa[i], b = sb[i], n = items[i].n_units, ma = masses(a, n), mb = masses(b, n);
      let num = 0, den = 0, used = 0;
      if (a.length || b.length) { const s = boundaryStats(a, b, n, TOL_UNITS); num = s.num; den = s.den; used = 1; }
      let pkv, wdv;
      try { pkv = pk(ma, mb); } catch (e) { pkv = NaN; }
      try { wdv = windowDiff(ma, mb); } catch (e) { wdv = NaN; }
      return { item_id: i, n, na: a.length, nb: b.length, B: B(a, b, n), num, den, used,
               m0: match(a, b, 0), mk: match(a, b, TOL_UNITS),
               dis: a.filter(x => b.indexOf(x) < 0).length + b.filter(x => a.indexOf(x) < 0).length,
               ones: a.length + b.length, pk: pkv, wd: wdv };
    });
  }
  function statsFrom(P) {
    const U = P.filter(r => r.used === 1), pbs = sum(U.map(r => r.n - 1));
    let kB = 1;
    const sDen = sum(U.map(r => r.den));
    if (U.length && sDen > 0) {
      const Aa = sum(U.map(r => r.num)) / sDen, Ae = (sum(U.map(r => r.na)) / pbs) * (sum(U.map(r => r.nb)) / pbs);
      kB = (Aa - Ae) / (1 - Ae);
    }
    const N = sum(P.map(r => r.n - 1)), n_ = 2 * N, n1 = sum(P.map(r => r.ones)), n0 = n_ - n1;
    const al = (n1 && n0) ? 1 - (n_ - 1) * sum(P.map(r => r.dis)) / (n0 * n1) : 1;
    const na = sum(P.map(r => r.na)), nb = sum(P.map(r => r.nb)), f1 = m => (na + nb) ? 2 * m / (na + nb) : 1;
    const nu = sum(P.map(r => r.n));
    return { kappa_B: kB, alpha_exact: al, B: mean(P.map(r => r.B)), F1_exact: f1(sum(P.map(r => r.m0))),
             F1_tol: f1(sum(P.map(r => r.mk))), Pk: nanmean(P.map(r => r.pk)), WindowDiff: nanmean(P.map(r => r.wd)),
             dens_a: 100 * na / nu, dens_b: 100 * nb / nu };
  }

  // segeval fleiss_pi_linear / fleiss_kappa_linear for any number of coders.
  // coders: {name: {item_id: units}}; an item enters when some coder has a boundary (Part B: "if sa[i] or sb[i]").
  function multiAgreement(coders, ids, items) {
    const names = Object.keys(coders), use = ids.filter(i => names.some(c => coders[c][i].length));
    let numS = 0, denS = 0; const per = {}; const pEntries = []; let skipped = 0;
    names.forEach(c => { per[c] = [0, 0]; });
    for (let m = 0; m < names.length - 1; m++) for (let k = m + 1; k < names.length; k++) {
      use.forEach(i => {
        const a = coders[names[m]][i], b = coders[names[k]][i], n = items[i].n_units;
        if (!a.length && !b.length) { skipped++; return; }  // segeval would divide by zero here
        const s = boundaryStats(a, b, n, TOL_UNITS), pbs = n - 1;
        numS += s.num; denS += s.den;
        per[names[m]][0] += a.length; per[names[m]][1] += pbs; per[names[k]][0] += b.length; per[names[k]][1] += pbs;
        pEntries.push(a.length / pbs, b.length / pbs);
      });
    }
    const Aa = denS > 0 ? numS / denS : 1;
    const Pe = mean(pEntries), AePi = Pe * Pe;
    const prods = [];
    for (let m = 0; m < names.length - 1; m++) for (let k = m + 1; k < names.length; k++)
      prods.push((per[names[m]][0] / per[names[m]][1]) * (per[names[k]][0] / per[names[k]][1]));
    const AeK = mean(prods);
    return { items: use.length, pairs_skipped: skipped, A_a: Aa,
             pi_B: (Aa - AePi) / (1 - AePi), kappa_B: (Aa - AeK) / (1 - AeK) };
  }
  const piB = (sa, sb, ids, items) => multiAgreement({ a: sa, b: sb }, ids, items).pi_B;

  // Krippendorff's alpha, nominal, every coder codes every boundary position (unit index 1..n-1)
  function alphaNominal(coders, ids, items) {
    const names = Object.keys(coders), c = names.length;
    let n0 = 0, n1 = 0, cross = 0;
    ids.forEach(i => {
      const n = items[i].n_units, sets = names.map(k => new Set(coders[k][i]));
      for (let u = 1; u < n; u++) {
        let ones = 0; sets.forEach(s => { if (s.has(u)) ones++; });
        n1 += ones; n0 += c - ones; cross += ones * (c - ones);
      }
    });
    const n = n0 + n1;
    return (n0 && n1) ? 1 - (n - 1) * (cross / (c - 1)) / (n0 * n1) : 1;
  }

  // ---------------------------------------------------------------- bootstrap and chance floor
  function bootIdx(n, nBoot, seed) {
    const r = rng(seed == null ? SEED : seed), out = [];
    for (let b = 0; b < nBoot; b++) { const row = new Array(n); for (let k = 0; k < n; k++) row[k] = Math.floor(r() * n); out.push(row); }
    return out;
  }
  const take = (P, row) => row.map(k => P[k]);
  function boot(P, metric, BI) { return BI.map(row => statsFrom(take(P, row))[metric]); }

  function randLike(seg, ids, items, r) {   // random cuts, same number per window
    const out = {};
    ids.forEach(i => {
      const n = items[i].n_units, k = Math.min(seg[i].length, n - 1);
      if (!seg[i].length) { out[i] = []; return; }
      const pool = []; for (let u = 1; u < n; u++) pool.push(u);
      for (let t = 0; t < k; t++) { const j = t + Math.floor(r() * (pool.length - t)); const x = pool[t]; pool[t] = pool[j]; pool[j] = x; }
      out[i] = pool.slice(0, k).sort((a, b) => a - b);
    });
    return out;
  }
  function chanceFloor(sa, sb, ids, items, draws, seed) {
    const r = rng(seed == null ? SEED + 1 : seed), rows = [];
    for (let d = 0; d < (draws || 20); d++) rows.push(statsFrom(parts(randLike(sa, ids, items, r), randLike(sb, ids, items, r), ids, items)));
    const out = {}; Object.keys(rows[0]).forEach(k => { out[k] = mean(rows.map(x => x[k])); });
    return out;
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

  // ---------------------------------------------------------------- B3: human–human
  function humanReliability(H, names, ids, items, BI, opt) {
    opt = opt || {};
    const A1 = H[names[0]], A2 = H[names[1]], P = parts(A1, A2, ids, items), hh = statsFrom(P);
    hh.pi_B = piB(A1, A2, ids, items);
    const boots = {}; ['kappa_B', 'alpha_exact', 'B', 'F1_exact', 'F1_tol'].forEach(m => { boots[m] = boot(P, m, BI); });
    const chance = chanceFloor(A1, A2, ids, items, 20, SEED + 1);
    const lower = lower1(boots.kappa_B);
    const verdict = hh.kappa_B >= PREREG.human_reliable && lower >= PREREG.human_acceptable_lower ? 'RELIABLE'
      : lower >= PREREG.human_acceptable_lower ? 'ACCEPTABLE' : 'NOT RELIABLE';
    const row = (metric, key, withCi) => ({ metric, value: hh[key], ci: withCi ? ci(boots[key]) : [NaN, NaN], chance: key === 'pi_B' ? NaN : chance[key] });
    const table = [row('kappa_B (primary)', 'kappa_B', true), row('pi_B', 'pi_B', false), row('alpha, exact positions', 'alpha_exact', true),
      row('Boundary Similarity B (mean)', 'B', true), row('F1 exact', 'F1_exact', true), row('F1 within ' + TOL_UNITS + ' units', 'F1_tol', true),
      row('Pk (lower is better)', 'Pk', false), row('WindowDiff (lower is better)', 'WindowDiff', false)];
    const densA = P.map(r => r.na / r.n), densB = P.map(r => r.nb / r.n);
    const gran = { dens_a: hh.dens_a, dens_b: hh.dens_b,
      wilcoxon_p: P.some(r => r.na !== r.nb) ? wilcoxon(densA.map((x, i) => x - densB[i])) : 1,
      nested_a_in_b: sum(P.map(r => r.mk)) / Math.max(1, sum(P.map(r => r.na))), nested_b_in_a: sum(P.map(r => r.mk)) / Math.max(1, sum(P.map(r => r.nb))) };
    let flags = null;
    if (opt.flagged) {
      const f = new Set(opt.flagged), fl = P.filter(r => f.has(r.item_id)), un = P.filter(r => !f.has(r.item_id));
      flags = { windows: fl.length, B_flagged: mean(fl.map(r => r.B)), B_unflagged: mean(un.map(r => r.B)) };
    }
    return { pair: names.slice(0, 2), P, hh, boots, chance, lower, verdict, table, gran, flags };
  }

  // ---------------------------------------------------------------- B4: judge vs humans
  function altTest(judge, H, ids, items, eps, alpha) {
    const names = Object.keys(H), res = [], pvals = [];
    names.forEach(j => {
      const others = names.filter(k => k !== j).map(k => H[k]);
      const Sf = ids.map(i => mean(others.map(o => B(judge[i], o[i], items[i].n_units))));
      const Sh = ids.map(i => mean(others.map(o => B(H[j][i], o[i], items[i].n_units))));
      const Wf = Sf.map((x, k) => x >= Sh[k] ? 1 : 0), Wh = Sh.map((x, k) => x >= Sf[k] ? 1 : 0);
      const d = Wh.map((x, k) => x - Wf[k]), n = d.length;
      let p;
      if (std1(d) === 0 || !(n > 1)) p = mean(d) < eps ? 0 : 1;
      else if (n >= 30) p = tCdf((mean(d) - eps) / (std1(d) / Math.sqrt(n)), n - 1);
      else p = wilcoxon(d.map(x => x - eps), 'less');
      pvals.push(p); res.push({ excluded: j, rho_f: mean(Wf), rho_h: mean(Wh), p });
    });
    byFdr(pvals).forEach((a, k) => { res[k].p_BY = a; res[k].judge_wins = a < alpha; });
    return { omega: mean(res.map(r => r.judge_wins ? 1 : 0)), rho: mean(res.map(r => r.rho_f)), rows: res };
  }
  function consensusPR(judge, a, b, ids, k) {
    k = k == null ? TOL_UNITS : k;
    let tpU = 0, totJ = 0, tpB = 0, totB = 0;
    ids.forEach(i => {
      const both = a[i].filter(x => b[i].some(y => Math.abs(x - y) <= k));
      const union = Array.from(new Set(a[i].concat(b[i])));
      totJ += judge[i].length; tpU += judge[i].filter(x => union.some(y => Math.abs(x - y) <= k)).length;
      totB += both.length; tpB += match(both, judge[i], k);
    });
    return [tpU / Math.max(1, totJ), tpB / Math.max(1, totB)];
  }
  const METRICS = ['kappa_B', 'alpha_exact', 'B', 'F1_exact', 'F1_tol', 'Pk', 'WindowDiff'];
  // H: {annotator: {item: units}}; J: {judge: {item: units}}; meta: {item: {model_code,...}} or null
  function judgesVsHumans(H, J, ids, items, BI, hr, meta) {
    const ann = Object.keys(H), A1 = H[ann[0]], A2 = H[ann[1]], Phh = hr.P, hh = hr.hh, rows = [], detail = {};
    Object.keys(J).forEach(name => {
      const Jn = J[name], PJ = {}; ann.forEach(a => { PJ[a] = parts(Jn, H[a], ids, items); });
      const perAnn = {}; ann.forEach(a => { perAnn[a] = statsFrom(PJ[a]); perAnn[a].pi_B = piB(Jn, H[a], ids, items); });
      const m = {}; METRICS.forEach(k => { m[k] = mean(ann.map(a => perAnn[a][k])); });
      const diff = BI.map(row => mean(ann.map(a => statsFrom(take(PJ[a], row)).kappa_B)) - statsFrom(take(Phh, row)).kappa_B);
      const kJ = BI.slice(0, 500).map(row => mean(ann.map(a => statsFrom(take(PJ[a], row)).kappa_B)));
      const delta = m.kappa_B - hh.kappa_B, lower = lower1(diff);
      const alt = altTest(Jn, H, ids, items, PREREG.alt_epsilon, PREREG.alt_alpha);
      const pr = consensusPR(Jn, A1, A2, ids);
      const errs = { match: 0, near: 0, spurious: 0, missed: 0 };
      ann.forEach(a => ids.forEach(i => { const e = editCounts(Jn[i], H[a][i], items[i].n_units); Object.keys(errs).forEach(k => { errs[k] += e[k]; }); }));
      let byModel = null, worst = null, worstGap = NaN, kw = NaN, J2 = null;
      const gap = ids.map((i, k) => ({ item_id: i, gap: mean(ann.map(a => PJ[a][k].B)) - Phh[k].B }));
      if (meta) {
        const g = {}; gap.forEach(r => { const mc = (meta[r.item_id] || {}).model_code; if (mc) (g[mc] = g[mc] || []).push(r.gap); });
        byModel = {}; Object.keys(g).sort().forEach(mc => { byModel[mc] = mean(g[mc]); });
        const ks = Object.keys(byModel);
        if (ks.length) {
          worst = ks.reduce((a, b) => byModel[b] < byModel[a] ? b : a);
          worstGap = byModel[worst];
          kw = new Set(gap.map(r => r.gap)).size > 1 && ks.length > 1 ? kruskal(ks.map(mc => g[mc])) : 1;
          J2 = ks.every(mc => byModel[mc] >= PREREG.model_gap_floor);
        }
      }
      const J1 = lower > -PREREG.noninferiority_delta;
      const nu = sum(ids.map(i => items[i].n_units));
      rows.push(Object.assign({ judge: name, kappa_B: m.kappa_B, kappa_B_ci: ci(kJ), delta_vs_human: delta, delta_lower95: lower,
        ceiling_ratio: hh.kappa_B ? m.kappa_B / hh.kappa_B : NaN }, {
        alpha_exact: m.alpha_exact, B: m.B, F1_exact: m.F1_exact, F1_tol: m.F1_tol, Pk: m.Pk, WindowDiff: m.WindowDiff,
        precision_vs_union: pr[0], recall_of_agreed: pr[1],
        density_judge: 100 * sum(ids.map(i => Jn[i].length)) / nu, density_human: (hh.dens_a + hh.dens_b) / 2,
        alt_omega: alt.omega, alt_rho: alt.rho, worst_model: worst, worst_model_gap: worstGap, kruskal_p_models: kw,
        J1_noninferior: J1, J2_no_model_failure: J2,
        VALIDATED: hr.verdict !== 'NOT RELIABLE' && J1 && J2 === true }));
      detail[name] = { perAnn, alt, errors: errs, gap, byModel };
    });
    rows.sort((a, b) => b.kappa_B - a.kappa_B);
    return { rows, detail };
  }

  // ---------------------------------------------------------------- B5: strata and model ranking
  function stratumTable(sx, sy, ids, items, meta, label) {
    const rows = [], Bs = ids.map(i => ({ item_id: i, B: B(sx[i], sy[i], items[i].n_units) }));
    ['model_code', 'domain', 'correct', 'position'].forEach(col => {
      const g = {}; Bs.forEach(r => { const m = meta[r.item_id]; if (!m) return; (g[String(m[col])] = g[String(m[col])] || []).push(r.B); });
      Object.keys(g).sort().forEach(lvl => {
        const v = g[lvl], bs = [];
        for (let k = 0; k < 1000; k++) { const r = rng(SEED + 7919 * (k + 1)); bs.push(mean(v.map(() => v[Math.floor(r() * v.length)]))); }
        const c = ci(bs); rows.push({ pair: label, stratum: col, level: lvl, n: v.length, B: mean(v), lo: c[0], hi: c[1] });
      });
    });
    return rows;
  }
  function modelRanking(H, J, ids, items, meta) {
    const ann = Object.keys(H), byM = {};
    ids.forEach(i => {
      const m = meta[i]; if (!m) return; const n = items[i].n_units;
      const r = (byM[m.model_code] = byM[m.model_code] || { human: [], judges: {} });
      r.human.push(mean(ann.map(a => H[a][i].length)) / n * 100);
      Object.keys(J).forEach(j => { (r.judges[j] = r.judges[j] || []).push(J[j][i].length / n * 100); });
    });
    const models = Object.keys(byM).sort(), dens = models.map(mc => ({ model_code: mc, human: mean(byM[mc].human) }));
    Object.keys(J).forEach(j => dens.forEach(d => { d[j] = mean(byM[d.model_code].judges[j]); }));
    const rho = {}; Object.keys(J).forEach(j => { rho[j] = models.length > 1 ? spearman(dens.map(d => d.human), dens.map(d => d[j])) : NaN; });
    return { dens, rho };
  }

  return { SEED, TOL_UNITS, N_BOOT, PREREG, rng, snapUnits, masses, boundaryStats, B, editCounts, match, pk, windowDiff,
    parts, statsFrom, multiAgreement, piB, alphaNominal, bootIdx, boot, ci, lower1, percentile, chanceFloor,
    wilcoxon, kruskal, spearman, byFdr, tCdf, normCdf, chi2Sf,
    humanReliability, altTest, consensusPR, judgesVsHumans, stratumTable, modelRanking };
}));
