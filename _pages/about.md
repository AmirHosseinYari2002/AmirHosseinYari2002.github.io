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
    <dl class="neural-profile-rail__details">
      <div class="neural-profile-rail__item">
        <dt><i class="fas fa-building-columns" aria-hidden="true"></i><span>Affiliation</span></dt>
        <dd>{{ site.author.employer }}</dd>
      </div>
      <div class="neural-profile-rail__item">
        <dt><i class="fas fa-location-dot" aria-hidden="true"></i><span>Location</span></dt>
        <dd>{{ site.author.location }}</dd>
      </div>
      <div class="neural-profile-rail__item">
        <dt><i class="fas fa-envelope" aria-hidden="true"></i><span>Email</span></dt>
        <dd><a href="mailto:{{ site.author.email }}">{{ site.author.email }}</a></dd>
      </div>
    </dl>

    <nav class="neural-profile-rail__social" aria-label="Research profiles">
      <a href="https://scholar.google.com/citations?hl=en&user=cYc6hYkAAAAJ"><i class="ai ai-google-scholar" aria-hidden="true"></i><span>Google Scholar</span></a>
      <a href="https://github.com/AmirHosseinYari2002"><i class="fab fa-github" aria-hidden="true"></i><span>GitHub</span></a>
      <a href="https://www.linkedin.com/in/amir-hossein-yari-358456272"><i class="fab fa-linkedin-in" aria-hidden="true"></i><span>LinkedIn</span></a>
    </nav>
  </aside>

  <div class="neural-observatory__stage">
    <section class="neural-hero" id="about" aria-labelledby="hero-title">
      <div class="neural-hero__copy" data-reveal>
        <h1 id="hero-title">Amir Hossein<br><span>Yari</span></h1>
        <p class="neural-lead">My research focuses on building intelligent systems that understand language, reason over complex information, and generate meaningful responses across diverse contexts and languages. I aim to develop AI that is not only capable, but also robust, interpretable, and beneficial in real-world settings.</p>
      </div>

      <div class="neural-orbit" data-neural-orbit aria-label="An interactive visual map of Amir's research areas">
        <canvas class="neural-orbit__canvas" data-neural-canvas aria-hidden="true"></canvas>
        <div class="neural-orbit__halo neural-orbit__halo--one" aria-hidden="true"></div>
        <div class="neural-orbit__halo neural-orbit__halo--two" aria-hidden="true"></div>
        <div class="neural-orbit__portrait">
          <div class="neural-orbit__portrait-ring" aria-hidden="true"></div>
          <img src="{{ '/images/myPhoto.png' | relative_url }}" alt="Portrait of Amir Hossein Yari" fetchpriority="high">
        </div>
        <span class="neural-orbit__label neural-orbit__label--one">Multilingual corpora</span>
        <span class="neural-orbit__label neural-orbit__label--two">Reasoning trace</span>
        <span class="neural-orbit__label neural-orbit__label--three">Reliability evaluation</span>
        <span class="neural-orbit__label neural-orbit__label--four">Alignment checkpoint</span>
        <span class="neural-orbit__label neural-orbit__label--five">Inference path</span>
      </div>
    </section>

    <section class="neural-overview" aria-label="Research focus and latest news">
      <div class="neural-focus" data-reveal>
        <div class="neural-section-heading">
          <p>Core directions</p>
          <h2>Research Focus</h2>
        </div>

        <div class="neural-focus__path">
          <article class="neural-focus__item">
            <div class="neural-focus__node" aria-hidden="true"><i class="fas fa-language"></i></div>
            <div class="neural-focus__content">
              <span class="neural-focus__number">01</span>
              <h3>Multilingual NLP</h3>
              <p>Building language technology that transfers knowledge across diverse languages and data conditions.</p>
            </div>
          </article>

          <article class="neural-focus__item">
            <div class="neural-focus__node" aria-hidden="true"><i class="fas fa-brain"></i></div>
            <div class="neural-focus__content">
              <span class="neural-focus__number">02</span>
              <h3>LLM Reasoning</h3>
              <p>Studying how language models reason, where their inference breaks, and how to make it more dependable.</p>
            </div>
          </article>
        </div>
      </div>

      <aside class="neural-news" data-reveal aria-labelledby="latest-news-title">
        <div class="neural-section-heading neural-section-heading--news">
          <div>
            <p>Signal log</p>
            <h2 id="latest-news-title">Latest News</h2>
          </div>
          <span class="neural-news__limit">Latest 5</span>
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
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </button>
        {% endif %}
      </aside>
    </section>
  </div>
</div>
