---
layout: neural-publications
title: "Publications"
permalink: /publications/
author_profile: false
---

<section class="publication-index" aria-labelledby="publications-title" data-publication-index>
  <header class="publication-index__header">
    <h1 id="publications-title">Publications</h1>

    <label class="publication-search">
      <span class="sr-only">Search publications</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>
      </svg>
      <input type="search" placeholder="Search publications…" autocomplete="off" data-publication-search>
    </label>
  </header>

  <p class="publication-empty" data-publication-empty hidden>No publications match your search.</p>

  {% assign publications_by_year = site.publications | sort: "date" | reverse | group_by: "year" %}
  {% for year_group in publications_by_year %}
    <section class="pub-year-group" aria-labelledby="year-{{ year_group.name }}" data-publication-year>
      <div class="pub-year-heading">
        <h2 id="year-{{ year_group.name }}" class="pub-year">{{ year_group.name }}</h2>
        <span aria-hidden="true"></span>
      </div>

      {% assign papers = year_group.items | sort: "date" | reverse %}
      <div class="pub-list">
        {% for paper in papers %}
          {% include publication-card.html publication=paper %}
        {% endfor %}
      </div>
    </section>
  {% endfor %}
</section>

{% include publications-script.html %}
