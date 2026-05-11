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
  --cv-accent: #b56b00;
  --cv-accent-2: #f4a62a;
  --cv-accent-soft: #fff3df;
  --cv-shadow: rgba(0, 0, 0, 0.06);
  --cv-link: #7a3e00;
  --cv-location-bg: #fff7ea;
  --cv-logo-bg: #ffffff;
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
  --cv-accent: #ffbd59;
  --cv-accent-2: #ffd18a;
  --cv-accent-soft: #3a2a16;
  --cv-shadow: rgba(0, 0, 0, 0.34);
  --cv-link: #ffd18a;
  --cv-location-bg: #302717;
  --cv-logo-bg: #ffffff;
}

.cv-page {
  color: var(--cv-text);
}

.cv-section {
  margin: 1.6rem 0;
}

.cv-section:first-of-type {
  margin-top: 0.2rem;
}

.cv-section-title {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0 0 1rem;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--cv-text);
}

.cv-section-title::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--cv-border);
}

.cv-card,
.cv-item-card {
  position: relative;
  border: 1px solid var(--cv-border);
  border-radius: 17px;
  background: var(--cv-bg);
  box-shadow: 0 4px 14px var(--cv-shadow);
}

.cv-card {
  padding: 1.15rem 1.25rem;
}

.cv-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.85rem;
  bottom: 0.85rem;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--cv-accent-2), var(--cv-accent));
}

.cv-item-card {
  padding: 1.1rem 1.2rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.cv-item-card:hover {
  transform: translateY(-2px);
  border-color: rgba(244, 166, 42, 0.7);
  box-shadow: 0 9px 24px var(--cv-shadow);
}

.cv-card-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.cv-card-body {
  flex: 1;
  min-width: 0;
}

.cv-logo-link {
  flex: 0 0 auto;
  width: 62px;
  height: 62px;
  border-radius: 15px;
  border: 1px solid var(--cv-border);
  background: var(--cv-logo-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-decoration: none;
  box-shadow: 0 3px 10px var(--cv-shadow);
}

.cv-logo {
  max-width: 82%;
  max-height: 82%;
  object-fit: contain;
  display: block;
}

.cv-logo-fallback {
  display: none;
  padding: 0.3rem;
  text-align: center;
  font-size: 0.58rem;
  line-height: 1.15;
  font-weight: 800;
  color: #7a3e00;
  letter-spacing: -0.02em;
}

.cv-degree {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--cv-text);
}

.cv-school-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.4rem;
  color: var(--cv-muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.cv-school-line a,
.cv-org a {
  color: var(--cv-link);
  text-decoration: none;
  font-weight: 700;
}

.cv-school-line a:hover,
.cv-org a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
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
  top: 0.42rem;
  width: 0.78rem;
  height: 0.78rem;
  border-radius: 999px;
  background: var(--cv-accent-2);
  border: 3px solid var(--cv-bg);
  box-shadow: 0 0 0 1px var(--cv-border);
  z-index: 1;
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
  font-size: 1.03rem;
  line-height: 1.35;
  font-weight: 800;
  letter-spacing: -0.01em;
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

.cv-org-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin: 0.1rem 0 0.45rem;
}

.cv-org {
  margin: 0;
  font-size: 0.92rem;
  color: var(--cv-muted);
  line-height: 1.45;
}

.cv-location {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  flex: 0 0 auto;
  max-width: 280px;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--cv-border);
  background: var(--cv-location-bg);
  color: var(--cv-muted);
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.25;
  white-space: nowrap;
}

.cv-location svg {
  width: 13px;
  height: 13px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  flex: 0 0 auto;
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

.cv-details {
  margin-top: 0.75rem;
  border-radius: 13px;
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

@media (max-width: 760px) {
  .cv-item-header,
  .cv-school-line,
  .cv-org-row {
    flex-direction: column;
    gap: 0.2rem;
  }

  .cv-date,
  .cv-location {
    white-space: normal;
  }

  .cv-location {
    max-width: 100%;
  }

  .cv-course-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .cv-card-content {
    gap: 0.75rem;
  }

  .cv-logo-link {
    width: 52px;
    height: 52px;
    border-radius: 13px;
  }
}

@media (max-width: 420px) {
  .cv-card-content {
    flex-direction: column;
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
  .sidebar {
    display: none !important;
  }

  .archive {
    width: 100% !important;
    padding: 0 !important;
  }

  .cv-card,
  .cv-item-card,
  .cv-logo-link {
    box-shadow: none !important;
  }

  .cv-item-card {
    break-inside: avoid;
  }

  .cv-details {
    border: 1px solid #ddd;
  }

  a {
    color: inherit !important;
    text-decoration: none !important;
  }
}
</style>

<div class="cv-page">

  <section class="cv-section">
    <h2 class="cv-section-title">Education</h2>

    <div class="cv-card">
      <div class="cv-card-content">
        <a class="cv-logo-link" href="https://en.sharif.ir/" target="_blank" rel="noopener noreferrer" aria-label="Sharif University of Technology">
          <span class="cv-logo-fallback">Sharif</span>
          <img class="cv-logo" src="{{ '/assets/images/logos/sharif.png' | relative_url }}" alt="Sharif University of Technology logo" loading="lazy" onerror="this.style.display='none'; this.previousElementSibling.style.display='inline-flex';">
        </a>

        <div class="cv-card-body">
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
    </div>
  </section>

  <section class="cv-section">
    <h2 class="cv-section-title">Experience</h2>

    <div class="cv-timeline">

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-card-content">
            <a class="cv-logo-link" href="https://mbzuai.ac.ae/" target="_blank" rel="noopener noreferrer" aria-label="MBZUAI">
              <span class="cv-logo-fallback">MBZUAI</span>
              <img class="cv-logo" src="{{ '/assets/images/logos/mbzuai.png' | relative_url }}" alt="MBZUAI logo" loading="lazy" onerror="this.style.display='none'; this.previousElementSibling.style.display='inline-flex';">
            </a>

            <div class="cv-card-body">
              <div class="cv-item-header">
                <h3 class="cv-role">Researcher</h3>
                <div class="cv-date">Oct 2024 – Dec 2025</div>
              </div>

              <div class="cv-org-row">
                <p class="cv-org">
                  <a href="https://mbzuai.ac.ae/" target="_blank" rel="noopener noreferrer">
                    Mohamed bin Zayed University of Artificial Intelligence — MBZUAI
                  </a>
                </p>

                <span class="cv-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"></path>
                    <circle cx="12" cy="9" r="2.5"></circle>
                  </svg>
                  Abu Dhabi, UAE
                </span>
              </div>

              <p class="cv-supervisor">
                <em>Supervisor: Prof. Fajri Koto</em>
              </p>

              <ul class="cv-bullets">
                <li>
                  Developed <strong><code>AMIR-GRPO</code></strong>, a GRPO extension that injects implicit preference
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
            </div>
          </div>
        </div>
      </article>

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-card-content">
            <a class="cv-logo-link" href="https://www.epfl.ch/en/" target="_blank" rel="noopener noreferrer" aria-label="EPFL">
              <span class="cv-logo-fallback">EPFL</span>
              <img class="cv-logo" src="{{ '/assets/images/logos/epfl.png' | relative_url }}" alt="EPFL logo" loading="lazy" onerror="this.style.display='none'; this.previousElementSibling.style.display='inline-flex';">
            </a>

            <div class="cv-card-body">
              <div class="cv-item-header">
                <h3 class="cv-role">E3 Intern</h3>
                <div class="cv-date">Dec 2024 – Jul 2025</div>
              </div>

              <div class="cv-org-row">
                <p class="cv-org">
                  <a href="https://www.epfl.ch/en/" target="_blank" rel="noopener noreferrer">
                    École Polytechnique Fédérale de Lausanne — EPFL
                  </a>
                </p>

                <span class="cv-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"></path>
                    <circle cx="12" cy="9" r="2.5"></circle>
                  </svg>
                  Geneva, Switzerland
                </span>
              </div>

              <p class="cv-supervisor">
                <em>Supervisor: Prof. Mahsa Shoaran</em>
              </p>

              <ul class="cv-bullets">
                <li>
                  Developed a speech-based brain-computer interface system to decode neural signals and
                  support communication restoration for individuals with speech impairments.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </article>

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-card-content">
            <a class="cv-logo-link" href="https://basirtechnologies.com/en/" target="_blank" rel="noopener noreferrer" aria-label="Basir Technologies">
              <span class="cv-logo-fallback">Basir</span>
              <img class="cv-logo" src="{{ '/assets/images/logos/basir.png' | relative_url }}" alt="Basir Technologies logo" loading="lazy" onerror="this.style.display='none'; this.previousElementSibling.style.display='inline-flex';">
            </a>

            <div class="cv-card-body">
              <div class="cv-item-header">
                <h3 class="cv-role">Software Engineer</h3>
                <div class="cv-date">Jul 2023 – Jul 2024</div>
              </div>

              <div class="cv-org-row">
                <p class="cv-org">
                  <a href="https://basirtechnologies.com/en/" target="_blank" rel="noopener noreferrer">
                    Basir Technologies
                  </a>
                </p>

                <span class="cv-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"></path>
                    <circle cx="12" cy="9" r="2.5"></circle>
                  </svg>
                  Tehran, Iran
                </span>
              </div>

              <ul class="cv-bullets">
                <li>
                  Designed and implemented software components for millimeter-wave body scanner systems.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </article>

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-card-content">
            <a class="cv-logo-link" href="https://en.sharif.ir/" target="_blank" rel="noopener noreferrer" aria-label="Sharif University of Technology">
              <span class="cv-logo-fallback">Sharif</span>
              <img class="cv-logo" src="{{ '/assets/images/logos/sharif.png' | relative_url }}" alt="Sharif University of Technology logo" loading="lazy" onerror="this.style.display='none'; this.previousElementSibling.style.display='inline-flex';">
            </a>

            <div class="cv-card-body">
              <div class="cv-item-header">
                <h3 class="cv-role">Teaching Assistant</h3>
                <div class="cv-date">Feb 2022 – Jul 2024</div>
              </div>

              <div class="cv-org-row">
                <p class="cv-org">
                  <a href="https://en.sharif.ir/" target="_blank" rel="noopener noreferrer">
                    Sharif University of Technology
                  </a>
                </p>

                <span class="cv-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"></path>
                    <circle cx="12" cy="9" r="2.5"></circle>
                  </svg>
                  Tehran, Iran
                </span>
              </div>

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
            </div>
          </div>
        </div>
      </article>

      <article class="cv-item">
        <div class="cv-item-card">
          <div class="cv-card-content">
            <a class="cv-logo-link" href="https://behyaar.com/en" target="_blank" rel="noopener noreferrer" aria-label="Behyaar Medical Equipment Company">
              <span class="cv-logo-fallback">Behyaar</span>
              <img class="cv-logo" src="{{ '/assets/images/logos/behyaar.jpg' | relative_url }}" alt="Behyaar Medical Equipment Company logo" loading="lazy" onerror="this.style.display='none'; this.previousElementSibling.style.display='inline-flex';">
            </a>

            <div class="cv-card-body">
              <div class="cv-item-header">
                <h3 class="cv-role">Summer Intern</h3>
                <div class="cv-date">Jul 2022 – Sep 2022</div>
              </div>

              <div class="cv-org-row">
                <p class="cv-org">
                  <a href="https://behyaar.com/en" target="_blank" rel="noopener noreferrer">
                    Behyaar Medical Equipment Company
                  </a>
                </p>

                <span class="cv-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"></path>
                    <circle cx="12" cy="9" r="2.5"></circle>
                  </svg>
                  Isfahan, Iran
                </span>
              </div>

              <ul class="cv-bullets">
                <li>
                  Implemented basic FPGA programming projects and gained hands-on experience with
                  hardware-oriented development.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </article>

    </div>
  </section>

</div>