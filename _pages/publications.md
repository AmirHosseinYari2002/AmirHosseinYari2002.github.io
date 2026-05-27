---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

{% include publications-style.html %}
{% include publications-script.html %}

{% assign publications_by_year = site.publications | sort: "date" | reverse | group_by: "year" %}

{% for year_group in publications_by_year %}
<div class="pub-year">{{ year_group.name }}</div>

{% assign papers = year_group.items | sort: "date" | reverse %}
{% for paper in papers %}
  {% include publication-card.html publication=paper %}
{% endfor %}

{% endfor %}