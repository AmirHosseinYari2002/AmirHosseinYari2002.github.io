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
  <h2>News</h2>
  <ul style="max-height: 300px; overflow-y: auto; padding-left: 0; list-style: none;">
    {% assign sorted_news = site.data.news | sort: "date" | reverse %}
    {% for item in sorted_news limit:5 %}
      <li style="margin-bottom: 10px;">
        <strong>{{ item.date | date: "%b %d, %Y" }}</strong><br>
        {{ item.description }}
      </li>
    {% endfor %}
  </ul>
</section>

<!-- Latest News Section -->
<section id="news" style="margin-top: 50px;">
  <h2 style="margin-bottom: 20px;">News</h2>
  <ul style="max-height: 300px; overflow-y: auto; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 10px;">
    {% assign sorted_news = site.data.news | sort: "date" | reverse %}
    {% for item in sorted_news limit:5 %}
      <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-radius: 8px;">
        <span style="">{{ item.date | date: "%b %d, %Y" }}</span>
        <span style="margin-left: 20px;">{{ item.description }}</span>
      </li>
    {% endfor %}
  </ul>
</section>
