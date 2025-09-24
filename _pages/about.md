---
permalink: /
title: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

<!-- Latest News Section -->
<section id="news" style="margin-top: 50px;">
  <h2 style="font-family: Arial, sans-serif; color: #333; margin-bottom: 15px;">News</h2>
  <ul style="max-height: 300px; overflow-y: auto; padding-left: 0; list-style: none; font-size: 0.9em;">
    {% assign sorted_news = site.data.news | sort: "date" | reverse %}
    {% for item in sorted_news limit:5 %}
      <li style="margin-bottom: 8px;">
        <strong>{{ item.date | date: "%b %d, %Y" }}</strong> — {{ item.description }}
      </li>
    {% endfor %}
  </ul>
</section>

