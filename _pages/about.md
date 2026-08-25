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
  <aside class="neural-profile-rail" aria-label="Profile details">
    <ul class="neural-profile-rail__details">
      <li class="neural-profile-rail__item">
        <svg class="neural-profile-icon neural-profile-icon--line" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 21h18M5 18h14M6 18V9m4 9V9m4 9V9m4 9V9M4 7l8-4 8 4H4Z"/>
        </svg>
        <span>{{ site.author.employer }}</span>
      </li>
      <li class="neural-profile-rail__item">
        <svg class="neural-profile-icon neural-profile-icon--line" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>
        </svg>
        <span>IRAN</span>
      </li>
      <li class="neural-profile-rail__item">
        <svg class="neural-profile-icon neural-profile-icon--line" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>
        </svg>
        <a href="mailto:{{ site.author.email }}">{{ site.author.email }}</a>
      </li>
    </ul>

    <nav class="neural-profile-rail__social" aria-label="Research profiles">
      <a href="https://scholar.google.com/citations?hl=en&user=cYc6hYkAAAAJ">
        <svg class="neural-profile-icon neural-profile-icon--brand" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 24a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-24L0 9.5l4.84 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.16 4.44L24 9.5 12 0Z"/>
        </svg>
        <span>Google Scholar</span>
      </a>
      <a href="https://github.com/AmirHosseinYari2002">
        <svg class="neural-profile-icon neural-profile-icon--brand" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.3c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"/>
        </svg>
        <span>GitHub</span>
      </a>
      <a href="https://www.linkedin.com/in/amir-hossein-yari-358456272">
        <svg class="neural-profile-icon neural-profile-icon--brand" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33 0-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.1 20.45H3.54V8.98H7.1v11.47Z"/>
        </svg>
        <span>LinkedIn</span>
      </a>
    </nav>
  </aside>

  <div class="neural-observatory__stage">
    <section class="neural-hero" id="about" aria-labelledby="hero-title">
      <div class="neural-hero__copy" data-reveal>
        <h1 id="hero-title">Amir Hossein <span>Yari</span></h1>
        <p class="neural-lead">My research focuses on building intelligent systems that understand language, reason over complex information, and generate meaningful responses across diverse contexts and languages. I aim to develop AI that is not only capable, but also robust, interpretable, and beneficial in real-world settings.</p>
      </div>

      <div class="neural-orbit" data-neural-orbit aria-label="An interactive visual map of Amir's research areas">
        <canvas class="neural-orbit__canvas" data-neural-canvas aria-hidden="true"></canvas>
        <div class="neural-orbit__halo neural-orbit__halo--one" aria-hidden="true"></div>
        <div class="neural-orbit__halo neural-orbit__halo--two" aria-hidden="true"></div>
        <div class="neural-orbit__portrait">
          <div class="neural-orbit__portrait-ring" aria-hidden="true"></div>
          <img src="{{ '/images/portrait-eiffel.webp' | relative_url }}" width="246" height="388" alt="Portrait of Amir Hossein Yari" decoding="async" fetchpriority="high">
        </div>
      </div>
    </section>

    <section class="neural-overview" aria-label="Research focus and latest news">
      <div class="neural-focus" data-reveal>
        <div class="neural-section-heading">
          <h2>Research Focus</h2>
        </div>

        <div class="neural-focus__path">
          <article class="neural-focus__item">
            <header class="neural-focus__content">
              <span class="neural-focus__number">01</span>
              <h3>Multilingual NLP</h3>
            </header>
            <div class="neural-focus__visual neural-focus__visual--globe" aria-hidden="true">
              <svg viewBox="0 0 240 240">
                <defs>
                  <radialGradient id="globeGlow" cx="40%" cy="34%" r="72%">
                    <stop offset="0" stop-color="#56edff" stop-opacity=".28"/>
                    <stop offset="1" stop-color="#1689e9" stop-opacity=".03"/>
                  </radialGradient>
                </defs>
                <circle class="focus-fill" cx="120" cy="120" r="82" fill="url(#globeGlow)"/>
                <circle cx="120" cy="120" r="82"/>
                <ellipse cx="120" cy="120" rx="42" ry="82"/>
                <ellipse cx="120" cy="120" rx="70" ry="82"/>
                <ellipse cx="120" cy="120" rx="82" ry="31"/>
                <ellipse cx="120" cy="120" rx="82" ry="61"/>
                <path d="M42 120h156M58 72h124M58 168h124"/>
                <g class="focus-nodes">
                  <circle cx="67" cy="76" r="4"/><circle cx="151" cy="55" r="4"/>
                  <circle cx="175" cy="108" r="5"/><circle cx="128" cy="142" r="5"/>
                  <circle cx="77" cy="166" r="4"/><circle cx="169" cy="176" r="4"/>
                  <path d="M67 76 151 55l24 53-47 34-51 24M128 142l41 34"/>
                </g>
              </svg>
            </div>
          </article>

          <article class="neural-focus__item">
            <header class="neural-focus__content">
              <span class="neural-focus__number">02</span>
              <h3>LLM Reasoning</h3>
            </header>
            <div class="neural-focus__visual neural-focus__visual--brain" aria-hidden="true">
              <svg viewBox="0 0 240 240">
                <path class="focus-brain-outline" d="M119 49c-15-20-47-12-50 14-23-2-37 24-24 43-16 15-7 44 14 48 2 25 33 34 52 17 4 18 30 19 38 4 22 9 44-12 37-34 20-10 19-39-2-47 7-25-19-46-41-34-4-16-20-21-24-11Z"/>
                <g class="focus-brain-network">
                  <path d="M69 63 91 88l28-39 25 42 36 3-25 28 31 19-45 8-30 22-24-32-28 15M91 88l-4 51 54 10 14-27-36-73v76M69 106l50 19 36-3M87 139l-28-33M141 149l-22-24"/>
                  <circle cx="69" cy="63" r="4"/><circle cx="91" cy="88" r="5"/>
                  <circle cx="119" cy="49" r="4"/><circle cx="144" cy="91" r="5"/>
                  <circle cx="180" cy="94" r="4"/><circle cx="155" cy="122" r="5"/>
                  <circle cx="186" cy="141" r="4"/><circle cx="141" cy="149" r="5"/>
                  <circle cx="111" cy="171" r="4"/><circle cx="87" cy="139" r="5"/>
                  <circle cx="59" cy="154" r="4"/><circle cx="69" cy="106" r="5"/>
                  <circle cx="119" cy="125" r="6"/>
                </g>
                <path class="focus-beam" d="M119 173v36M94 214h50M104 222h30"/>
              </svg>
            </div>
          </article>

        </div>
      </div>

      <aside class="neural-news" data-reveal aria-labelledby="latest-news-title">
        <div class="neural-section-heading neural-section-heading--news">
          <h2 id="latest-news-title">Latest News</h2>
        </div>

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
            <span class="neural-news__chevron" aria-hidden="true"></span>
          </button>
        {% endif %}
      </aside>
    </section>
  </div>
</div>
