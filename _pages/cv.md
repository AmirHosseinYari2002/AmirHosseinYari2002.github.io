---
layout: neural-cv
title: "Curriculum Vitae"
permalink: /cv/
author_profile: false
redirect_from:
  - /resume
---

{% assign cv = site.data.cv %}

<div class="cv-index">
  <header class="cv-index__header">
    <h1>{{ cv.title }}</h1>
  </header>

  <section class="cv-section cv-section--education" aria-labelledby="cv-education-title">
    <div class="cv-section__heading">
      <svg class="cv-section__icon cv-section__icon--education" viewBox="0 0 32 32" aria-hidden="true">
        <path d="m3 11 13-7 13 7-13 7L3 11Z"/><path d="M8 14v8c4.7 3.4 11.3 3.4 16 0v-8M28 12v8"/>
      </svg>
      <h2 id="cv-education-title">Education</h2>
      <span class="cv-section__signal" aria-hidden="true"></span>
    </div>

    {% for education in cv.education %}
      <article class="cv-credential">
        <a class="cv-logo-tile" href="{{ education.url }}" target="_blank" rel="noopener noreferrer" aria-label="Visit {{ education.institution }}">
          <img class="cv-logo cv-logo--{{ education.logo_id }}" src="{{ education.logo | relative_url }}" alt="{{ education.logo_alt }}" decoding="async">
        </a>

        <div class="cv-credential__body">
          <h3>{{ education.degree }}</h3>
          <a href="{{ education.url }}" target="_blank" rel="noopener noreferrer">{{ education.institution }}</a>
        </div>

        <dl class="cv-credential__meta">
          <div>
            <dt class="visually-hidden">Date</dt>
            <dd>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></svg>
              <span>{{ education.date }}</span>
            </dd>
          </div>
          <div>
            <dt class="visually-hidden">Location</dt>
            <dd>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <span>{{ education.location }}</span>
            </dd>
          </div>
        </dl>
      </article>
    {% endfor %}
  </section>

  <section class="cv-section cv-section--experience" aria-labelledby="cv-experience-title">
    <div class="cv-section__heading">
      <svg class="cv-section__icon cv-section__icon--experience" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 25 12 17l6 4L28 9"/><path d="M21 9h7v7"/><circle cx="4" cy="25" r="2.2"/><circle cx="12" cy="17" r="2.2"/><circle cx="18" cy="21" r="2.2"/>
      </svg>
      <h2 id="cv-experience-title">Experience</h2>
      <span class="cv-section__signal" aria-hidden="true"></span>
    </div>

    <div class="cv-timeline">
      {% for entry in cv.experience %}
        {% assign remainder = forloop.index0 | modulo: 2 %}
        {% if remainder == 0 %}{% assign tone = 'cyan' %}{% else %}{% assign tone = 'violet' %}{% endif %}
        {% include cv-entry.html entry=entry tone=tone %}
      {% endfor %}
    </div>
  </section>
</div>
