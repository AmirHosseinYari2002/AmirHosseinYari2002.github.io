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
    I am a natural language processing researcher interested in building intelligent systems that can understand language, reason over complex information, and generate meaningful responses across diverse contexts. My work focuses on multilingual NLP and learning methods that improve reasoning, reliability, and alignment with human intent.
  </p>
  <p>
    I am especially interested in the intersection of principled machine learning and practical AI systems: developing methods that are theoretically grounded, empirically rigorous, and useful beyond standard benchmarks. More broadly, I aim to contribute to AI systems that are not only capable, but also robust, interpretable, and beneficial in real-world settings.
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

