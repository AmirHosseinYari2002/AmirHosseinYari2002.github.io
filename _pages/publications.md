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
  margin-top: 0.6rem;
  font-size: 0.88rem;
  color: var(--pub-muted);
  cursor: pointer;
  user-select: none;
}

.pub-abstract-toggle:hover {
  color: var(--pub-text);
}

.pub-abstract-toggle span {
  display: inline-block;
  transition: transform 0.15s ease;
  margin-right: 0.25rem;
}

.pub-abstract-toggle.open span {
  transform: rotate(90deg);
}

.pub-panel {
  display: none;
  margin-top: 0.4rem;
  padding: 0.5rem 0.2rem 0.2rem 0.2rem;
  background: transparent;
  color: var(--pub-muted);
  font-size: 0.88rem;
  line-height: 1.6;
  border-left: none;
  border-radius: 0;
  max-width: 95%;
}

.pub-panel.open {
  display: block;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

<!-- Year = 2026 -->
<div class="pub-year">2026</div>

<!-- Neural Prostheses for Communication Restoration: Algorithmic, Systemic, and Clinical Perspectives -->
<div class="pub-card">
  <div class="pub-title">Neural Prostheses for Communication Restoration: Algorithmic, Systemic, and Clinical Perspectives</div>

  <div class="pub-authors">
    Mohammad Ali Shaeri*, <u>Amir Hossein Yari*</u>, Jinhan Liu, Mahsa Shoaran
  </div>

  <div class="pub-actions">
    <a href="https://www.techrxiv.org/doi/pdf/10.36227/techrxiv.176972150.04568340/v1">📄 Paper</a>

    <button type="button" onclick="togglePanel('bib-neural-prostheses', this, 'Show BibTeX', 'Hide BibTeX')" aria-expanded="false">
      Show BibTeX
    </button>
  </div>

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-item', this)">
    <span>▸</span> Abstract
  </div>

  <div id="abs-neural-prostheses" class="pub-panel">
    Brain-computer interfaces (BCIs) are transforming the lives of individuals with severe motor and speech impairments by restoring communication or movement control through direct decoding of neural activity. This review provides a comprehensive overview of communication BCIs, covering cursor&click, typing, handwriting, speech, and emotion decoding applications from algorithmic, system-level, and clinical perspectives. Recent advances in machine learning have improved the decoding of both semantic tokens (e.g., words) and linguistic primitives (e.g., letters), enabling context-aware reconstruction of coherent text and speech. Current BCI systems, typically implemented on bulky rack-mounted or bench-top platforms, can synthesize speech, handwriting, or typing at roughly half the speed of natural conversation. Future-generation BCIs, however, are being developed as implantable systems for safe and convenient everyday use. Yet, key challenges remain for real-world deployment, including safety, reliability, portability, user-friendliness, and naturalness, along with ethical considerations and societal implications. Addressing these challenges requires careful attention to patient-centered factors, such as target populations, task paradigms, and implantation sites, which guide translational development. Looking ahead, improving model adaptability, cross-user generalization, and hardware efficiency will be essential for realizing practical, scalable, and fully embodied neural prostheses.
  </div>

  <div id="bib-neural-prostheses" class="pub-panel pub-bibtex">
<pre><code id="bibtex-neural-prostheses">{% raw %}@article{shaeri2026neural,
  title={Neural Prostheses for Communication Restoration: Algorithmic, Systemic, and Clinical Perspectives},
  author={Shaeri, MohammadAli and Yari, Amir Hossein and Liu, Jinhan and Shoaran, Mahsa},
  year={2026},
  publisher={TechRxiv}
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-neural-prostheses', this)">Copy BibTeX</button>
  </div>
</div>
<!-- ------------------------- -->


<!-- AMIR-GRPO: Inducing Implicit Preference Signals into GRPO -->
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

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-item', this)">
    <span>▸</span> Abstract
  </div>

  <div id="abs-amir-grpo" class="pub-panel">
    Despite its effectiveness for post-training reasoning models, group relative policy optimization (GRPO) suffers from several key limitations. Specifically, it introduces response-level length bias, weakly penalizes low-quality trajectories, and reduces rich intra-group preference information to a simplified scalar reward, limiting direct pairwise comparison between reasoning trajectories. To address these issues, we propose <strong><code>AMIR-GRPO</code></strong>, which augments GRPO with an implicit DPO-style contrastive regularizer constructed directly from intra-group reward rankings, without requiring additional annotations. This mechanism strengthens suppression of low-reward trajectories, mitigates length bias, and converts each rollout group into a denser set of supervision constraints. Across multiple mathematical reasoning benchmarks, <strong><code>AMIR-GRPO</code></strong> consistently outperforms strong GRPO baselines, achieves clearer separation between correct and incorrect reasoning chains, and delivers broader coverage beyond instances solved by standard GRPO.
  </div>

  <div id="bib-amir-grpo" class="pub-panel pub-bibtex">
<pre><code id="bibtex-amir-grpo">{% raw %}@article{yari2026amir,
  title={AMIR-GRPO: Inducing Implicit Preference Signals into GRPO},
  author={Yari, Amir Hossein and Koto, Fajri},
  journal={arXiv preprint arXiv:2601.03661},
  year={2026}
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-amir-grpo', this)">Copy BibTeX</button>
  </div>
</div>
<!-- ---------------------------------------------- -->

<!-- Multilingual Idioms in Sentences and Conversations Across High-, Medium-, and Low-Resource Languages -->

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

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-item', this)">
    <span>▸</span> Abstract
  </div>

  <div id="abs-idioms" class="pub-panel">
    Idiomatic expressions pose a major challenge for multilingual NLP because their meanings shift between figurative and literal usage, often requiring context for accurate interpretation. Prior work has focused on high-resource languages typically evaluates isolated idiom-meaning questions, overlooking realistic discourse. We introduce <strong><code>MIDI</code></strong>, a multilingual idiom dataset spanning 3 high-, 3 medium-, and 12 low-resource languages, curated by native speakers. Unlike previous datasets, <strong><code>MIDI</code></strong> provides idioms embedded in both sentence-level and conversational contexts, capturing both literal and figurative readings. Benchmarking state-of-the-art models shows that idiom comprehension degrades in low-resource languages and that, in all resource tiers, literal interpretations are substantially harder than figurative ones. Conversational context improves performance but does not eliminate these disparities. Through controlled tests and interventions on hidden representations, we further separate memorization from reasoning, exposing core limitations of current models.
  </div>

  <div id="bib-idioms" class="pub-panel pub-bibtex">
<pre><code id="bibtex-idioms">{% raw %}
<!-- ADD BibTex -->
{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-idioms', this)">Copy BibTeX</button>
  </div>
</div>
<!-- --------------------------------- -->

<!-- Revisiting Metric Reliability for Fine-grained Evaluation of Machine Translation and Summarization in Indian Languages -->

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
    <span>▸</span> Abstract
  </div>

  <div id="abs-item" class="pub-panel">
  While automatic metrics drive progress in Machine Translation (MT) and Text Summarization (TS), existing metrics have been developed and validated almost exclusively for English and other high-resource languages. This narrow focus leaves Indian languages—spoken by over 1.5 billion people—largely overlooked, casting doubt on the universality of current evaluation practices. To address this gap, we introduce <strong><code>ITEM</code></strong>, a large-scale benchmark that systematically evaluates the alignment of 29 automatic metrics with human judgments across six major Indian languages, enriched with fine-grained annotations. Our extensive evaluation—covering agreement with human judgments, sensitivity to outliers, language-specific reliability, inter-metric correlations, and resilience to controlled perturbations—reveals four central findings: (1) LLM-based evaluators show the strongest alignment with human judgments at both segment and system levels; (2) outliers exert a significant impact on metric-human agreement; (3) in TS, metrics are more effective at capturing content fidelity, whereas in MT, they better reflect fluency; and (4) metrics differ in their robustness and sensitivity when subjected to diverse perturbations. Collectively, these findings offer critical guidance for advancing metric design and evaluation in Indian languages.
  </div>

  <div id="bib-item" class="pub-panel pub-bibtex">
<pre><code id="bibtex-item">{% raw %}@article{yari2025revisiting,
  title={Revisiting Metric Reliability for Fine-grained Evaluation of Machine Translation and Summarization in Indian Languages},
  author={Yari, Amir Hossein and Kulkarni, Kalmit and Khan, Ahmad Raza and Koto, Fajri},
  journal={arXiv preprint arXiv:2510.07061},
  year={2025}
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-item', this)">Copy BibTeX</button>
  </div>
</div>
<!-- ------------------------------------------------------ -->

<!-- Year = 2025 -->
<div class="pub-year">2025</div>

<!-- Unveiling Cultural Blind Spots: Analyzing the Limitations of mLLMs in Procedural Text Comprehension -->
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

  <div class="pub-abstract-toggle" onclick="toggleAbstract('abs-item', this)">
    <span>▸</span> Abstract
  </div>

  <div id="abs-captex" class="pub-panel">
    Despite the impressive performance of multilingual large language models (mLLMs) in various natural language processing tasks, their ability to understand procedural texts, particularly those with culture-specific content, remains largely unexplored. Texts describing cultural procedures, including rituals, traditional craftsmanship, and social etiquette, require an inherent understanding of cultural context, presenting a significant challenge for mLLMs. In this work, we introduce <strong><code>CAPTex</code></strong> a benchmark designed to evaluate mLLMs’ ability to process and reason over culturally diverse procedural texts in multiple languages. Using a range of evaluation methods, we find that (1) mLLMs struggle with culturally contextualized procedural content, particularly in low-resource languages; (2) performance varies across cultural domains, with some proving more difficult than others; and (3) models perform better on multiple-choice tasks presented in conversational formats than on direct questions. These results highlight the current limitations of mLLMs and emphasize the need for culturally informed benchmarks like <strong><code>CAPTex</code></strong> to support more accurate and inclusive language understanding.
  </div>

  <div id="bib-captex" class="pub-panel pub-bibtex">
<pre><code id="bibtex-captex">{% raw %}@inproceedings{yari-koto-2025-unveiling,
    title = "Unveiling Cultural Blind Spots: Analyzing the Limitations of m{LLM}s in Procedural Text Comprehension",
    author = "Yari, Amir Hossein  and
      Koto, Fajri",
    booktitle = "Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)",
    month = jul,
    year = "2025",
    address = "Vienna, Austria",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2025.acl-long.987/",
    doi = "10.18653/v1/2025.acl-long.987",
    pages = "20151--20170",
    ISBN = "979-8-89176-251-0",
}{% endraw %}</code></pre>
    <button type="button" class="copy-bibtex" onclick="copyBibtex('bibtex-captex', this)">Copy BibTeX</button>
  </div>
</div>

<!-- ------------------------ -->