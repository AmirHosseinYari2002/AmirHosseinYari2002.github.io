---
permalink: /
title: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

<!-- About Me Section -->
<section id="about" style="margin-top: 50px; font-family: Arial, sans-serif; line-height: 1.6;">
  <p>
    I am currently a research assistant at MBZUAI, working under the supervision of <a href="https://www.fajrikoto.com/home" target="_blank" rel="noopener">Prof. Fajri Koto</a>. I earned my B.Sc. in Electrical Engineering from Sharif University of Technology. My research primarily focuses on machine learning and natural language processing.
  </p>
  <p>
    I am deeply interested in creating intelligent systems capable of understanding and generating human language, with the goal of solving real-world problems. I find great satisfaction in exploring both the theoretical underpinnings and practical implementations of AI.
  </p>
</section>


<!-- Latest News Section -->
<section id="news" style="margin-top: 50px;">
  <h2 style="font-family: Arial, sans-serif; margin-bottom: 15px;">News</h2>
  <ul style="max-height: 300px; overflow-y: auto; padding-left: 0; list-style: none; font-size: 0.9em;">
    {% assign sorted_news = site.data.news | sort: "date" | reverse %}
    {% for item in sorted_news limit:5 %}
      <li style="margin-bottom: 8px;">
        <strong>{{ item.date | date: "%b %d, %Y" }}</strong> — {{ item.description }}
      </li>
    {% endfor %}
  </ul>
</section>

