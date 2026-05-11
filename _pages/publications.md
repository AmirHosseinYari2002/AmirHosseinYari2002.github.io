---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

<style>
:root {
  --pub-bg: #ffffff;
  --pub-text: #222222;
  --pub-muted: #555555;
  --pub-border: #e8e8e8;
  --pub-soft: #fafafa;
  --pub-hover: #f0f0f0;
  --pub-shadow: rgba(0,0,0,0.055);
  --pub-badge-bg: #fff3df;
  --pub-badge-text: #7a3e00;
  --pub-badge-border: #ffdca8;
  --pub-code-bg: #f7f7f7;
}

/* Dark mode only when your site explicitly enables it */
html[data-theme="dark"],
body[data-theme="dark"],
html.dark,
body.dark,
html.dark-mode,
body.dark-mode,
html.theme-dark,
body.theme-dark {
  --pub-bg: #1f1f1f;
  --pub-text: #f2f2f2;
  --pub-muted: #c7c7c7;
  --pub-border: #3a3a3a;
  --pub-soft: #2a2a2a;
  --pub-hover: #343434;
  --pub-shadow: rgba(0,0,0,0.35);
  --pub-badge-bg: #3a2a16;
  --pub-badge-text: #ffd18a;
  --pub-badge-border: #6a4a20;
  --pub-code-bg: #252525;
}

.pub-year {
  margin-top: 1.8rem;
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--pub-text);
  border-bottom: 2px solid var(--pub-border);
  padding-bottom: 0.35rem;
}

.pub-card {
  margin: 1.1rem 0;
  padding: 1rem 1.15rem;
  border-radius: 14px;
  border: 1px solid var(--pub-border);
  background: var(--pub-bg);
  color: var(--pub-text);
  box-shadow: 0 4px 14px var(--pub-shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.pub-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px var(--pub-shadow);
}

.pub-title {
  font-size: 1.02rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
  color: var(--pub-text);
}

.pub-authors {
  font-size: 0.92rem;
  color: var(--pub-muted);
  line-height: 1.45;
  margin-bottom: 0.35rem;
}

.pub-authors u {
  font-weight: 600;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.authors-full {
  display: none;
}

.pub-authors.open .authors-short {
  display: none;
}

.pub-authors.open .authors-full {
  display: inline;
}

.pub-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.45rem 0 0.65rem;
}

.pub-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--pub-badge-text);
  background: var(--pub-badge-bg);
  border: 1px solid var(--pub-badge-border);
  border-radius: 999px;
  padding: 0.22rem 0.55rem;
}

.location-icon {
  width: 13px;
  height: 13px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.pub-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.45rem;
}

.pub-actions a,
.pub-actions button,
.author-toggle,
.copy-bibtex {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.86rem;
  line-height: 1.2;
  text-decoration: none;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--pub-border);
  color: var(--pub-text);
  background: var(--pub-soft);
  cursor: pointer;
  font-family: inherit;
}

.pub-actions a:hover,
.pub-actions button:hover,
.author-toggle:hover,
.copy-bibtex:hover {
  background: var(--pub-hover);
  text-decoration: none;
}

.author-toggle {
  margin-left: 0.35rem;
  font-size: 0.78rem;
  padding: 0.18rem 0.48rem;
}

.pub-actions img {
  width: 15px;
  height: 15px;
  vertical-align: middle;
}

.pub-abstract-toggle {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: var(--pub-text);
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  width: fit-content;
}

.pub-abstract-toggle span {
  display: inline-block;
  transition: transform 0.15s ease;
  margin-right: 0.3rem;
}

.pub-abstract-toggle.open span {
  transform: rotate(90deg);
}

.pub-panel {
  display: none;
  margin-top: 0.75rem;
  padding: 0.85rem 0.95rem;
  border-left: 3px solid var(--pub-badge-border);
  background: var(--pub-soft);
  color: var(--pub-muted);
  border-radius: 10px;
  font-size: 0.9rem;
  line-height: 1.55;
}

.pub-panel.open {
  display: block;
}

.pub-bibtex pre {
  margin: 0.4rem 0 0;
  padding: 0.85rem;
  overflow-x: auto;
  border-radius: 10px;
  background: var(--pub-code-bg);
  color: var(--pub-text);
  border: 1px solid var(--pub-border);
  font-size: 0.82rem;
  line-height: 1.45;
}

.pub-bibtex code {
  background: transparent;
  color: inherit;
  padding: 0;
}

.copy-bibtex {
  margin-top: 0.55rem;
}
</style>

<script>
function togglePanel(id, btn, showText, hideText) {
  var el = document.getElementById(id);
  if (!el) return;

  var isOpen = el.classList.toggle("open");
  btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  btn.textContent = isOpen ? hideText : showText;
}

function toggleAbstract(id, el) {
  var panel = document.getElementById(id);
  if (!panel) return;

  panel.classList.toggle("open");
  el.classList.toggle("open");
}

function toggleAuthors(id, btn) {
  var el = document.getElementById(id);
  if (!el) return;

  var isOpen = el.classList.toggle("open");
  btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  btn.textContent = isOpen ? "Hide authors" : "Show all authors";
}

function copyBibtex(id, btn) {
  var el = document.getElementById(id);
  if (!el) return;

  var text = el.innerText.trim();

  navigator.clipboard.writeText(text).then(function() {
    var oldText = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(function() {
      btn.textContent = oldText;
    }, 1400);
  });
}
</script>

## Publications

<div class="pub-year">2026</div>

<div class="pub-card">
  <div class="pub-title">Neural Prostheses for Communication Restoration: Algorithmic, Systemic, and Clinical Perspectives</div>

  <div class="pub-authors">
    Mohammad Ali Shaeri*, <u>Amir Hossein Yari*</u>, Jinhan Liu, Mahsa Shoaran
  </div>

  <div class="pub-actions">
    <a href="https://infoscience.epfl.ch/server/api/core/bitstreams/6398b02f-1265-421a-b050-b199c556671a/content">📄 Paper</a>

    <button type="button" onclick="togglePanel('bib-neural-prostheses', this, 'Show BibTeX', 'Hide BibTeX')" aria-expanded="false">
      Show BibTeX
    </button>
  </div>

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-neural-prostheses', this)">
    <span>&gt;</span> Abstract
  </div>

  <div id="abs-neural-prostheses" class="pub-panel">
    Add your abstract here.
  </div>

  <div id="bib-neural-prostheses" class="pub-panel pub-bibtex">
<pre><code id="bibtex-neural-prostheses">{% raw %}@misc{shaeri2026neuralprostheses,
  title = {Neural Prostheses for Communication Restoration: Algorithmic, Systemic, and Clinical Perspectives},
  author = {Shaeri, Mohammad Ali and Yari, Amir Hossein and Liu, Jinhan and Shoaran, Mahsa},
  year = {2026},
  note = {Preprint}
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-neural-prostheses', this)">Copy BibTeX</button>
  </div>
</div>

<div class="pub-card">
  <div class="pub-title">AMIR-GRPO: Inducing Implicit Preference Signals into GRPO</div>

  <div class="pub-authors">
    <u>Amir Hossein Yari</u>, Fajri Koto
  </div>

  <div class="pub-actions">
    <a href="https://arxiv.org/abs/2601.03661">📄 Paper</a>

    <a href="https://github.com/AmirHosseinYari2002/AMIR-GRPO">
      <img src="../assets/github.png" alt="GitHub"> Code
    </a>

    <button type="button" onclick="togglePanel('bib-amir-grpo', this, 'Show BibTeX', 'Hide BibTeX')" aria-expanded="false">
      Show BibTeX
    </button>
  </div>

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-amir-grpo', this)">
    <span>&gt;</span> Abstract
  </div>

  <div id="abs-amir-grpo" class="pub-panel">
    Add your abstract here.
  </div>

  <div id="bib-amir-grpo" class="pub-panel pub-bibtex">
<pre><code id="bibtex-amir-grpo">{% raw %}@misc{yari2026amirgrpo,
  title = {AMIR-GRPO: Inducing Implicit Preference Signals into GRPO},
  author = {Yari, Amir Hossein and Koto, Fajri},
  year = {2026},
  eprint = {2601.03661},
  archivePrefix = {arXiv}
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-amir-grpo', this)">Copy BibTeX</button>
  </div>
</div>

<div class="pub-card">
  <div class="pub-title">Multilingual Idioms in Sentences and Conversations Across High-, Medium-, and Low-Resource Languages</div>

  <div id="authors-idioms" class="pub-authors">
    <span class="authors-short">
      Saeed Almheiri, Bilal Elbouardi, ..., <u>Amir Hossein Yari</u>, ..., Fajri Koto
    </span>

    <span class="authors-full">
      Saeed Almheiri, Bilal Elbouardi, Salsabila Zahirah Pranida, Irina Nikishina, Ashwath Rao B, Parameswari Krishnamurthy, Muhammad Cendekia Airlangga, Rifo Ahmad Genadi, Nguyễn Phan Gia Bảo, <u>Amir Hossein Yari</u>, Hawau Olamide Toyin, Nurdaulet Mukhituly, Mena Attia, Besher Hassan, Ahmad Fathan Hidayatullah, Tatsuki Kuribayashi, Haonan Li, Suma Bhat, Fajri Koto
    </span>

    <button type="button" class="author-toggle" onclick="toggleAuthors('authors-idioms', this)" aria-expanded="false">
      Show all authors
    </button>
  </div>

  <div class="pub-meta">
    <span class="pub-badge">ACL 2026</span>
    <span class="pub-badge">
      <svg class="location-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"></path>
        <circle cx="12" cy="9" r="2.5"></circle>
      </svg>
      San Diego, CA, USA
    </span>
  </div>

  <div class="pub-actions">
    <button type="button" onclick="togglePanel('bib-idioms', this, 'Show BibTeX', 'Hide BibTeX')" aria-expanded="false">
      Show BibTeX
    </button>
  </div>

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-idioms', this)">
    <span>&gt;</span> Abstract
  </div>

  <div id="abs-idioms" class="pub-panel">
    Add your abstract here.
  </div>

  <div id="bib-idioms" class="pub-panel pub-bibtex">
<pre><code id="bibtex-idioms">{% raw %}@inproceedings{almheiri2026multilingualidioms,
  title = {Multilingual Idioms in Sentences and Conversations Across High-, Medium-, and Low-Resource Languages},
  author = {Almheiri, Saeed and Elbouardi, Bilal and Pranida, Salsabila Zahirah and Nikishina, Irina and Rao B, Ashwath and Krishnamurthy, Parameswari and Airlangga, Muhammad Cendekia and Genadi, Rifo Ahmad and Bao, Nguyen Phan Gia and Yari, Amir Hossein and Toyin, Hawau Olamide and Mukhituly, Nurdaulet and Attia, Mena and Hassan, Besher and Hidayatullah, Ahmad Fathan and Kuribayashi, Tatsuki and Li, Haonan and Bhat, Suma and Koto, Fajri},
  booktitle = {Proceedings of the 64th Annual Meeting of the Association for Computational Linguistics},
  year = {2026},
  address = {San Diego, California, USA}
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-idioms', this)">Copy BibTeX</button>
  </div>
</div>

<div class="pub-card">
  <div class="pub-title">Revisiting Metric Reliability for Fine-grained Evaluation of Machine Translation and Summarization in Indian Languages</div>

  <div class="pub-authors">
    <u>Amir Hossein Yari</u>, Kalmit Kulkarni, Ahmad Raza Khan, Fajri Koto
  </div>

  <div class="pub-meta">
    <span class="pub-badge">ACL 2026</span>
    <span class="pub-badge">
      <svg class="location-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"></path>
        <circle cx="12" cy="9" r="2.5"></circle>
      </svg>
      San Diego, CA, USA
    </span>
  </div>

  <div class="pub-actions">
    <a href="https://arxiv.org/abs/2510.07061">📄 Paper</a>

    <a href="https://huggingface.co/datasets/AmirHossein2002/ITEM">
      <img src="https://huggingface.co/front/assets/huggingface_logo.svg" alt="Hugging Face"> Dataset
    </a>

    <button type="button" onclick="togglePanel('bib-item', this, 'Show BibTeX', 'Hide BibTeX')" aria-expanded="false">
      Show BibTeX
    </button>
  </div>

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-item', this)">
    <span>&gt;</span> Abstract
  </div>

  <div id="abs-item" class="pub-panel">
    Add your abstract here.
  </div>

  <div id="bib-item" class="pub-panel pub-bibtex">
<pre><code id="bibtex-item">{% raw %}@inproceedings{yari2026revisitingmetricreliability,
  title = {Revisiting Metric Reliability for Fine-grained Evaluation of Machine Translation and Summarization in Indian Languages},
  author = {Yari, Amir Hossein and Kulkarni, Kalmit and Khan, Ahmad Raza and Koto, Fajri},
  booktitle = {Proceedings of the 64th Annual Meeting of the Association for Computational Linguistics},
  year = {2026},
  address = {San Diego, California, USA}
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-item', this)">Copy BibTeX</button>
  </div>
</div>

<div class="pub-year">2025</div>

<div class="pub-card">
  <div class="pub-title">Unveiling Cultural Blind Spots: Analyzing the Limitations of mLLMs in Procedural Text Comprehension</div>

  <div class="pub-authors">
    <u>Amir Hossein Yari</u>, Fajri Koto
  </div>

  <div class="pub-meta">
    <span class="pub-badge">ACL 2025</span>
    <span class="pub-badge">
      <svg class="location-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"></path>
        <circle cx="12" cy="9" r="2.5"></circle>
      </svg>
      Vienna, Austria
    </span>
  </div>

  <div class="pub-actions">
    <a href="https://aclanthology.org/2025.acl-long.987/">📄 Paper</a>

    <a href="https://huggingface.co/datasets/AmirHossein2002/CAPTex">
      <img src="https://huggingface.co/front/assets/huggingface_logo.svg" alt="Hugging Face"> Dataset
    </a>

    <button type="button" onclick="togglePanel('bib-captex', this, 'Show BibTeX', 'Hide BibTeX')" aria-expanded="false">
      Show BibTeX
    </button>
  </div>

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-captex', this)">
    <span>&gt;</span> Abstract
  </div>

  <div id="abs-captex" class="pub-panel">
    Add your abstract here.
  </div>

  <div id="bib-captex" class="pub-panel pub-bibtex">
<pre><code id="bibtex-captex">{% raw %}@inproceedings{yari2025unveilingculturalblindspots,
  title = {Unveiling Cultural Blind Spots: Analyzing the Limitations of mLLMs in Procedural Text Comprehension},
  author = {Yari, Amir Hossein and Koto, Fajri},
  booktitle = {Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics},
  year = {2025},
  address = {Vienna, Austria},
  url = {https://aclanthology.org/2025.acl-long.987/}
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-captex', this)">Copy BibTeX</button>
  </div>
</div>