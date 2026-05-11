---
layout: archive
title: ""
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

<style>
:root {
  --cv-bg: #ffffff;
  --cv-text: #222222;
  --cv-muted: #5f6368;
  --cv-border: #e6e8eb;
  --cv-soft: #f8f9fb;
  --cv-soft-2: #fff7ea;
  --cv-accent: #b56b00;
  --cv-accent-2: #f4a62a;
  --cv-accent-soft: #fff1d6;
  --cv-shadow: rgba(0, 0, 0, 0.06);
  --cv-link: #7a3e00;
  --cv-chip-bg: #fff3df;
  --cv-chip-border: #ffdca8;
}

/* Dark mode support */
html[data-theme="dark"],
body[data-theme="dark"],
html.dark,
body.dark,
html.dark-mode,
body.dark-mode,
html.theme-dark,
body.theme-dark {
  --cv-bg: #1f1f1f;
  --cv-text: #f2f2f2;
  --cv-muted: #c8c8c8;
  --cv-border: #3a3a3a;
  --cv-soft: #292929;
  --cv-soft-2: #302717;
  --cv-accent: #ffbd59;
  --cv-accent-2: #ffd18a;
  --cv-accent-soft: #3a2a16;
  --cv-shadow: rgba(0, 0, 0, 0.34);
  --cv-link: #ffd18a;
  --cv-chip-bg: #3a2a16;
  --cv-chip-border: #6a4a20;
}

.cv-page {
  color: var(--cv-text);
}

.cv-hero {
  position: relative;
  overflow: hidden;
  margin: 0.4rem 0 1.7rem;
  padding: 1.5rem 1.6rem;
  border: 1px solid var(--cv-border);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(244, 166, 42, 0.22), transparent 35%),
    linear-gradient(135deg, var(--cv-soft-2), transparent 55%),
    var(--cv-bg);
  box-shadow: 0 8px 28px var(--cv-shadow);
}

.cv-hero h1 {
  margin: 0 0 0.35rem;
  font-size: 1.9rem;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--cv-text);
}

.cv-hero-subtitle {
  margin: 0;
  max-width: 760px;
  color: var(--cv-muted);
  font-size: 0.98rem;
  line-height: 1.65;
}

.cv-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.cv-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.72rem;
  border-radius: 999px;
  border: 1px solid var(--cv-chip-border);
  background: var(--cv-chip-bg);
  color: var(--cv-link);
  font-size: 0.82rem;
  font-weight: 650;
  line-height: 1.2;
}

.cv-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1.4rem;
}

.cv-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--cv-border);
  background: var(--cv-soft);
  color: var(--cv-text);
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.cv-action-btn:hover {
  background: var(--cv-accent-soft);
  border-color: var(--cv-chip-border);
  color: var(--cv-link);
  text-decoration: none;
}

.cv-section {
  margin: 1.7rem 0;
}

.cv-section-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0 0 0.9rem;
  font-size: 1.28rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--cv-text);
}

.cv-section-title::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--cv-border);
}

.cv-card {
  position: relative;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--cv-border);
  border-radius: 16px;
  background: var(--cv-bg);
  box-shadow: 0 5px 18px var(--cv-shadow);
}

.cv-timeline {
  position: relative;
  margin-left: 0.25rem;
}

.cv-timeline::before {
  content: "";
  position: absolute;
  top: 0.35rem;
  bottom: 0.35rem;
  left: 0.43rem;
  width: 2px;
  background: linear-gradient(180deg, var(--cv-accent-2), var(--cv-border));
}

.cv-item {
  position: relative;
  padding: 0 0 1.25rem 1.55rem;
}

.cv-item:last-child {
  padding-bottom: 0;
}

.cv-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.32rem;
  width: 0.78rem;
  height: 0.78rem;
  border-radius: 999px;
  background: var(--cv-accent-2);
  border: 3px solid var(--cv-bg);
  box-shadow: 0 0 0 1px var(--cv-chip-border);
  z-index: 1;
}

.cv-item-card {
  padding: 1.05rem 1.15rem;
  border: 1px solid var(--cv-border);
  border-radius: 16px;
  background: var(--cv-bg);
  box-shadow: 0 4px 14px var(--cv-shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.cv-item-card:hover {
  transform: translateY(-2px);
  border-color: var(--cv-chip-border);
  box-shadow: 0 9px 24px var(--cv-shadow);
}

.cv-item-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.35rem;
}

.cv-role {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.35;
  font-weight: 800;
  color: var(--cv-text);
}

.cv-date {
  flex: 0 0 auto;
  color: var(--cv-muted);
  font-size: 0.84rem;
  font-weight: 650;
  white-space: nowrap;
  padding-top: 0.08rem;
}

.cv-org {
  margin: 0.1rem 0 0.35rem;
  font-size: 0.92rem;
  color: var(--cv-muted);
  line-height: 1.45;
}

.cv-org a,
.cv-card a {
  color: var(--cv-link);
  text-decoration: none;
  font-weight: 700;
}

.cv-org a:hover,
.cv-card a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.cv-supervisor {
  margin: 0.1rem 0 0.65rem;
  color: var(--cv-muted);
  font-size: 0.86rem;
  line-height: 1.45;
}

.cv-bullets {
  margin: 0.55rem 0 0;
  padding: 0;
  list-style: none;
}

.cv-bullets li {
  position: relative;
  margin: 0.42rem 0;
  padding-left: 1.05rem;
  color: var(--cv-text);
  font-size: 0.91rem;
  line-height: 1.6;
}

.cv-bullets li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.72em;
  width: 0.38rem;
  height: 0.38rem;
  border-radius: 999px;
  background: var(--cv-accent-2);
}

.cv-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  margin: 0.6rem 0 0;
}

.cv-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--cv-border);
  background: var(--cv-soft);
  color: var(--cv-muted);
  font-size: 0.76rem;
  font-weight: 650;
  line-height: 1.2;
}

.cv-education-grid {
  display: grid;
  gap: 0.8rem;
}

.cv-degree {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--cv-text);
}

.cv-school-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.35rem;
  color: var(--cv-muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.cv-details {
  margin-top: 0.65rem;
  border-radius: 12px;
  border: 1px solid var(--cv-border);
  background: var(--cv-soft);
  overflow: hidden;
}

.cv-details summary {
  cursor: pointer;
  padding: 0.65rem 0.8rem;
  color: var(--cv-text);
  font-size: 0.88rem;
  font-weight: 750;
}

.cv-details summary:hover {
  color: var(--cv-link);
}

.cv-course-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  padding: 0 0.8rem 0.85rem;
}

.cv-course {
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  background: var(--cv-bg);
  border: 1px solid var(--cv-border);
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--cv-text);
}

.cv-course strong {
  display: block;
  font-size: 0.86rem;
}

.cv-course span {
  display: block;
  margin-top: 0.12rem;
  color: var(--cv-muted);
  font-size: 0.78rem;
}

.cv-note {
  margin-top: 0.6rem;
  color: var(--cv-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

@media (max-width: 760px) {
  .cv-hero {
    padding: 1.25rem;
  }

  .cv-hero h1 {
    font-size: 1.55rem;
  }

  .cv-item-header,
  .cv-school-line {
    flex-direction: column;
    gap: 0.15rem;
  }

  .cv-date {
    white-space: normal;
  }

  .cv-course-list {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cv-item-card {
    transition: none;
  }

  .cv-item-card:hover {
    transform: none;
  }
}

@media print {
  .masthead,
  .page__footer,
  .greedy-nav,
  .sidebar,
  .cv-actions {
    display: none !important;
  }

  .archive {
    width: 100% !important;
    padding: 0 !important;
  }

  .cv-hero,
  .cv-card,
  .cv-item-card {
    box-shadow: none !important;
  }

  .cv-item-card {
    break-inside: avoid;
  }

  .cv-details {
    border: 1px solid #ddd;
  }

  .cv-details[open] .cv-course-list {
    display: grid;
  }

  a {
    color: inherit !important;
    text-decoration: none !important;
  }
}
</style>

<script>
function printCV() {
  window.print();
}
</script>

<div class="cv-page">

  <section class="cv-hero">
    <h1>Curriculum Vitae</h1>
    <p class="cv-hero-subtitle">
      Electrical Engineering graduate from Sharif University of Technology with research experience in
      multilingual NLP, LLM evaluation, cultural language understanding, reasoning models, and
      neural interfaces for communication restoration.
    </p>

    <div class="cv-hero-meta">
      <span class="cv-pill">Machine Learning</span>
      <span class="cv-pill">Multilingual NLP</span>
      <span class="cv-pill">LLM Evaluation</span>
      <span class="cv-pill">Brain-Computer Interfaces</span>
    </div>
  </section>

  <div class="cv-actions">
    <button type="button" class="cv-action-btn" onclick="printCV()">Print / Save as PDF</button>
    <a class="cv-action-btn" href="/publications/">Publications</a>
  </div>

  <section class="cv-section">
    <h2 class="cv-section-title">Education</h2>

    <div class="cv-card cv-education-grid">
      <div>
        <p class="cv-degree">B.Sc. in Electrical Engineering</p>
        <div class="cv-school-line">
          <span>
            <a href="https://en.sharif.ir/" target="_blank" rel="noopener noreferrer">
              Sharif University of Technology
            </a>
          </span>
          <span>2020 – 2024</span>
        </div>
      </div>
    </div>
  </section>

  <section class="cv-section">
    <h2 class="cv-section-title">Experience</h2>

    <div class="cv-timeline">

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-item-header">
            <h3 class="cv-role">Researcher</h3>
            <div class="cv-date">Oct 2024 – Dec 2025</div>
          </div>

          <p class="cv-org">
            <a href="https://mbzuai.ac.ae/" target="_blank" rel="noopener noreferrer">
              Mohamed bin Zayed University of Artificial Intelligence — MBZUAI
            </a>
          </p>

          <p class="cv-supervisor">
            <em>Supervisor: Prof. Fajri Koto</em>
          </p>

          <ul class="cv-bullets">
            <li>
              Developed <strong>AMIR-GRPO</strong>, a GRPO extension that injects implicit preference
              regularization to improve reasoning performance without additional annotation cost.
            </li>
            <li>
              Assessed the reliability, robustness, and human alignment of automated evaluation metrics
              for machine translation and text summarization.
            </li>
            <li>
              Investigated multilingual LLMs on culturally grounded procedural texts, highlighting gaps,
              biases, and limitations in cross-cultural language understanding.
            </li>
          </ul>

          <div class="cv-tags">
            <span class="cv-tag">Reasoning Models</span>
            <span class="cv-tag">LLM Evaluation</span>
            <span class="cv-tag">Multilingual NLP</span>
            <span class="cv-tag">Cultural NLP</span>
          </div>
        </div>
      </article>

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-item-header">
            <h3 class="cv-role">E3 Intern</h3>
            <div class="cv-date">Dec 2024 – Jul 2025</div>
          </div>

          <p class="cv-org">
            <a href="https://www.epfl.ch/en/" target="_blank" rel="noopener noreferrer">
              École Polytechnique Fédérale de Lausanne — EPFL
            </a>
          </p>

          <p class="cv-supervisor">
            <em>Supervisor: Prof. Mahsa Shoaran</em>
          </p>

          <ul class="cv-bullets">
            <li>
              Developed a speech-based brain-computer interface system to decode neural signals and
              support communication restoration for individuals with speech impairments.
            </li>
          </ul>

          <div class="cv-tags">
            <span class="cv-tag">Brain-Computer Interfaces</span>
            <span class="cv-tag">Neural Decoding</span>
            <span class="cv-tag">Speech BCI</span>
          </div>
        </div>
      </article>

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-item-header">
            <h3 class="cv-role">Software Engineer</h3>
            <div class="cv-date">Jul 2023 – Jul 2024</div>
          </div>

          <p class="cv-org">
            <a href="https://basirtechnologies.com/en/" target="_blank" rel="noopener noreferrer">
              Basir Technologies
            </a>
          </p>

          <ul class="cv-bullets">
            <li>
              Designed and implemented software components for millimeter-wave body scanner systems.
            </li>
          </ul>

          <div class="cv-tags">
            <span class="cv-tag">Software Engineering</span>
            <span class="cv-tag">Signal Processing</span>
            <span class="cv-tag">Imaging Systems</span>
          </div>
        </div>
      </article>

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-item-header">
            <h3 class="cv-role">Teaching Assistant</h3>
            <div class="cv-date">Feb 2022 – Jul 2024</div>
          </div>

          <p class="cv-org">
            <a href="https://en.sharif.ir/" target="_blank" rel="noopener noreferrer">
              Sharif University of Technology
            </a>
          </p>

          <ul class="cv-bullets">
            <li>
              Assisted undergraduate courses in mathematics, machine learning, optimization, electrical
              circuits, and digital logic.
            </li>
          </ul>

          <details class="cv-details" open>
            <summary>Teaching assistantships</summary>

            <div class="cv-course-list">
              <div class="cv-course">
                <strong>Linear Algebra</strong>
                <span>Spring 2024 · Prof. Amiri</span>
              </div>

              <div class="cv-course">
                <strong>Linear Algebra</strong>
                <span>Fall 2023 · Prof. Amiri</span>
              </div>

              <div class="cv-course">
                <strong>Machine Learning</strong>
                <span>Spring 2024 · Prof. Amiri</span>
              </div>

              <div class="cv-course">
                <strong>Convex Optimization</strong>
                <span>Fall 2023 · Prof. Amiri</span>
              </div>

              <div class="cv-course">
                <strong>Linear Algebra</strong>
                <span>Spring 2023 · Prof. Kazemi</span>
              </div>

              <div class="cv-course">
                <strong>Linear Algebra</strong>
                <span>Spring 2023 · Prof. Amiri</span>
              </div>

              <div class="cv-course">
                <strong>Electrical Circuit Theory</strong>
                <span>Fall 2022 · Prof. Shamsollahi</span>
              </div>

              <div class="cv-course">
                <strong>Logic Circuit & Lab</strong>
                <span>Fall 2022 · Prof. Shabany</span>
              </div>

              <div class="cv-course">
                <strong>Electrical Circuits & Lab</strong>
                <span>Spring 2022 · Prof. Shamsollahi</span>
              </div>
            </div>
          </details>

          <div class="cv-tags">
            <span class="cv-tag">Teaching</span>
            <span class="cv-tag">Linear Algebra</span>
            <span class="cv-tag">Machine Learning</span>
            <span class="cv-tag">Optimization</span>
          </div>
        </div>
      </article>

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-item-header">
            <h3 class="cv-role">Summer Intern</h3>
            <div class="cv-date">Jul 2022 – Sep 2022</div>
          </div>

          <p class="cv-org">
            <a href="https://behyaar.com/en" target="_blank" rel="noopener noreferrer">
              Behyaar Medical Equipment Company
            </a>
          </p>

          <ul class="cv-bullets">
            <li>
              Implemented basic FPGA programming projects and gained hands-on experience with hardware-oriented development.
            </li>
          </ul>

          <div class="cv-tags">
            <span class="cv-tag">FPGA</span>
            <span class="cv-tag">Hardware Design</span>
            <span class="cv-tag">Medical Equipment</span>
          </div>
        </div>
      </article>

    </div>
  </section>

</div>