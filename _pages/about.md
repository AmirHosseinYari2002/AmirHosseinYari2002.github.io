---
permalink: /
title: ""
layout: neural-home
author_profile: false
redirect_from:
  - /about/
  - /about.html
---

<div class="neural-observatory" data-neural-home>
  <aside class="neural-profile-rail" aria-label="Profile and contact details">
    <figure class="neural-profile-rail__portrait">
      <img src="{{ '/images/portrait-eiffel-hq.webp' | relative_url }}" width="720" height="1224" alt="Amir Hossein Yari in Paris" decoding="async" fetchpriority="high">
    </figure>

    <nav aria-label="Profile links">
      <ul class="neural-profile-rail__links">
        <li>
          <svg class="neural-profile-icon neural-profile-icon--line" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 21h18M5 18h14M6 18V9m4 9V9m4 9V9m4 9V9M4 7l8-4 8 4H4Z"/>
          </svg>
          <span>{{ site.author.employer }}</span>
        </li>
        <li>
          <svg class="neural-profile-icon neural-profile-icon--line" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>
          </svg>
          <span>IRAN</span>
        </li>
        <li>
          <a href="mailto:{{ site.author.email }}">
            <svg class="neural-profile-icon neural-profile-icon--line" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>
            </svg>
            <span>Email</span>
          </a>
        </li>
        <li>
          <a href="https://scholar.google.com/citations?hl=en&amp;user=cYc6hYkAAAAJ">
            <svg class="neural-profile-icon neural-profile-icon--brand neural-profile-icon--scholar" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 24a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-24L0 9.5l4.84 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.16 4.44L24 9.5 12 0Z"/>
            </svg>
            <span>Google Scholar</span>
          </a>
        </li>
        <li>
          <a href="https://github.com/AmirHosseinYari2002">
            <svg class="neural-profile-icon neural-profile-icon--brand" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.3c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"/>
            </svg>
            <span>GitHub</span>
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/amir-hossein-yari-358456272">
            <svg class="neural-profile-icon neural-profile-icon--brand" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33 0-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.1 20.45H3.54V8.98H7.1v11.47Z"/>
            </svg>
            <span>LinkedIn</span>
          </a>
        </li>
      </ul>
    </nav>
  </aside>

  <div class="neural-observatory__stage">
    <section class="neural-intro" id="about" aria-labelledby="hero-title">
      <div class="neural-intro__copy" data-reveal>
        <h1 id="hero-title">Amir Hossein Yari</h1>
        <div class="neural-intro__text">
          <p>I am a Natural Language Processing researcher interested in building intelligent systems that can understand language, reason over complex information, and generate meaningful responses across diverse contexts. My work focuses on multilingual NLP and learning methods that improve reasoning, reliability, and alignment with human intent.</p>
          <p>I am especially interested in the intersection of principled machine learning and practical AI systems: developing methods that are theoretically grounded, empirically rigorous, and useful beyond standard benchmarks. More broadly, I aim to contribute to AI systems that are not only capable, but also robust, interpretable, and beneficial in real-world settings.</p>
        </div>
      </div>

      <aside class="neural-news" data-reveal aria-labelledby="latest-news-title">
        <h2 id="latest-news-title">Latest News</h2>
        {% assign sorted_news = site.data.news | sort: 'date' | reverse %}
        <ol class="neural-news__timeline" data-news-timeline>
          {% for item in sorted_news %}
            <li class="neural-news__item{% if forloop.index > 5 %} is-news-extra{% endif %}"{% if forloop.index > 5 %} data-news-extra hidden{% endif %}>
              <span class="neural-news__pulse" aria-hidden="true"></span>
              <time datetime="{{ item.date | date: '%Y-%m-%d' }}">{{ item.date | date: "%b %d, %Y" }}</time>
              <p>{{ item.description }}</p>
            </li>
          {% endfor %}
        </ol>
        {% if sorted_news.size > 5 %}
          <button class="neural-news__toggle" type="button" data-news-toggle aria-expanded="false">
            <span data-news-toggle-label>View all news</span>
            <span class="neural-news__arrow" aria-hidden="true">→</span>
          </button>
        {% endif %}
      </aside>
    </section>

    <section class="neural-focus" aria-labelledby="research-focus-title" data-reveal>
      <h2 id="research-focus-title">Research Focus</h2>
      <div class="neural-focus__grid">
        <article class="neural-focus-card neural-focus-card--multilingual">
          <h3>Multilingual NLP</h3>
          <div class="neural-focus-card__visual" aria-hidden="true">
            <svg class="multilingual-mark" viewBox="0 0 560 270">
              <defs>
                <radialGradient id="multilingual-glow" cx="42%" cy="34%" r="72%">
                  <stop offset="0" stop-color="#5bf0ff" stop-opacity=".34"/>
                  <stop offset=".72" stop-color="#168ee9" stop-opacity=".08"/>
                  <stop offset="1" stop-color="#071127" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <g class="multilingual-mark__globe" transform="translate(4 0)">
                <circle class="multilingual-mark__aura" cx="278" cy="145" r="105"/>
                <circle class="multilingual-mark__fill" cx="278" cy="145" r="88"/>
                <circle cx="278" cy="145" r="88"/>
                <ellipse cx="278" cy="145" rx="45" ry="88"/>
                <ellipse cx="278" cy="145" rx="72" ry="88"/>
                <ellipse cx="278" cy="145" rx="88" ry="32"/>
                <ellipse cx="278" cy="145" rx="88" ry="61"/>
                <path d="M190 145h176M205 96h146M205 194h146"/>
                <path class="multilingual-mark__land" d="m229 80 20-12 18 8 7 15-13 7-4 16-20 8-13-10 7-12-9-9Zm57 53 13-17 26-2 18 14-8 15 9 13-19 9-9 25-15 17-9-25-13-15 8-15-10-10Zm-63 24 14-10 15 9-2 18-18 13-14-10 5-20Z"/>
                <g class="multilingual-mark__network">
                  <path d="m216 113 37-20 44 34 42-9M253 93l-16 64 64 13 38-52M237 157l41-12 23 25-25 46"/>
                  <circle cx="216" cy="113" r="3"/><circle cx="253" cy="93" r="3.5"/>
                  <circle cx="297" cy="127" r="4"/><circle cx="339" cy="118" r="3.5"/>
                  <circle cx="237" cy="157" r="3.5"/><circle cx="278" cy="145" r="4"/>
                  <circle cx="301" cy="170" r="3.5"/><circle cx="276" cy="216" r="3"/>
                </g>
              </g>
              <g class="multilingual-mark__speech-links">
                <path d="M326 80c12-3 21-1 30 1"/>
                <path d="M350 116c31-4 55 7 79 19"/>
                <path d="M330 198c35 12 61 27 89 45"/>
                <path d="M207 118c-39 1-70 18-101 44"/>
                <path d="M225 193c-27 18-47 39-66 62"/>
                <circle cx="326" cy="80" r="3"/><circle cx="350" cy="116" r="3"/>
                <circle cx="330" cy="198" r="3"/><circle cx="207" cy="118" r="3"/><circle cx="225" cy="193" r="3"/>
              </g>
              <g class="language-token" transform="translate(336 32)"><path d="M8 1h64a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7H30l-10 9 2-9H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7Z"/><text x="40" y="26">Hello</text></g>
              <g class="language-token" transform="translate(411 86)"><path d="M8 1h58a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7H28l-10 9 2-9H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7Z"/><text x="37" y="26" direction="rtl">سلام</text></g>
              <g class="language-token" transform="translate(394 194)"><path d="M8 1h79a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7H35l-10 9 2-9H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7Z"/><text x="48" y="26">Bonjour</text></g>
              <g class="language-token" transform="translate(88 113)"><path d="M8 1h58a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7H28l-10 9 2-9H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7Z"/><text x="37" y="26">Hola</text></g>
              <g class="language-token" transform="translate(141 206)"><path d="M8 1h58a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7H28l-10 9 2-9H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7Z"/><text x="37" y="26">你好</text></g>
            </svg>
          </div>
        </article>

        <article class="neural-focus-card neural-focus-card--reasoning">
          <h3>LLM Reasoning</h3>
          <div class="neural-focus-card__visual" aria-hidden="true">
            <svg class="reasoning-mark" viewBox="0 0 820 270">
              <defs>
                <marker id="reason-arrow-cyan" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z"/></marker>
                <marker id="reason-arrow-violet" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z"/></marker>
                <marker id="reason-arrow-muted" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z"/></marker>
              </defs>
              <g class="reasoning-mark__selected">
                <path d="M115 145h34M185 145h31M252 145h32"/><path d="M392 145c48 0 42-65 91-65"/><path d="M532 80h29"/><path d="M649 80h76"/>
              </g>
              <g class="reasoning-mark__repair-route"><path d="M605 118v24"/><path d="M607 209c55 0 57-79 20-108"/></g>
              <g class="reasoning-mark__abandoned"><path d="M348 169c0 44 49 56 100 56h31"/></g>
              <g class="reasoning-capsule reasoning-capsule--prompt" transform="translate(8 123)">
                <rect width="107" height="44" rx="22"/><path class="reasoning-capsule__icon" d="M18 13h18v13H25l-6 5 1-5h-2Z"/><text x="68" y="28">PROMPT</text>
              </g>
              <g class="reasoning-step" transform="translate(167 145)"><circle r="19"/><circle class="reasoning-step__node" cx="-7" cy="5" r="2.3"/><circle class="reasoning-step__node" cx="1" cy="-7" r="2.3"/><circle class="reasoning-step__node" cx="9" cy="5" r="2.3"/><path d="m-5 3 5-8 7 8"/></g>
              <g class="reasoning-step" transform="translate(234 145)"><circle r="19"/><path d="M-7-7h14M-7 0h14M-7 7h14"/><circle class="reasoning-step__node" cx="-11" cy="-7" r="1.4"/><circle class="reasoning-step__node" cx="-11" cy="0" r="1.4"/><circle class="reasoning-step__node" cx="-11" cy="7" r="1.4"/></g>
              <g class="reasoning-capsule reasoning-capsule--expand" transform="translate(284 123)"><rect width="108" height="44" rx="22"/><path class="reasoning-capsule__icon" d="M18 22h18M28 12l10 10-10 10M18 22l-8-8M18 22l-8 8"/><text x="72" y="28">EXPAND</text></g>
              <g class="reasoning-step reasoning-step--selected" transform="translate(501 80)"><circle r="19"/><path d="M-7-7h14M-7 0h14M-7 7h14"/><circle class="reasoning-step__node" cx="-11" cy="-7" r="1.4"/><circle class="reasoning-step__node" cx="-11" cy="0" r="1.4"/><circle class="reasoning-step__node" cx="-11" cy="7" r="1.4"/></g>
              <g class="reasoning-verify" transform="translate(605 80)"><path d="M0-48 44 0 0 48-44 0Z"/><circle cx="0" cy="-12" r="12"/><path d="m-6-12 4 4 8-9"/><text x="0" y="20">VERIFY</text></g>
              <g class="reasoning-label reasoning-label--pass" transform="translate(667 34)"><rect width="45" height="22" rx="11"/><text x="22.5" y="15">PASS</text></g>
              <g class="reasoning-label reasoning-label--fail" transform="translate(584 116)"><rect width="44" height="22" rx="11"/><text x="22" y="15">FAIL</text></g>
              <g class="reasoning-repair" transform="translate(558 159)"><rect width="99" height="50" rx="10"/><text x="49.5" y="17">REPAIR</text><path d="M18 31h15l6 6M58 37l6-6h16"/><path d="m38 33 5 4-5 4M64 27l-5 4 5 4"/></g>
              <g class="reasoning-step reasoning-step--muted" transform="translate(462 225)"><circle r="18"/><path d="M-7-6h14M-7 0h14M-7 6h14"/></g>
              <g class="reasoning-stop" transform="translate(508 225)"><circle r="16"/><path d="m-6-6 12 12M6-6-6 6"/></g>
              <g class="reasoning-capsule reasoning-capsule--response" transform="translate(725 58)"><rect width="88" height="44" rx="22"/><path class="reasoning-capsule__icon" d="M10 13h18v13H17l-6 5 1-5h-2Z"/><text x="58" y="28">RESPONSE</text></g>
            </svg>
          </div>
        </article>
      </div>
    </section>
  </div>
</div>
