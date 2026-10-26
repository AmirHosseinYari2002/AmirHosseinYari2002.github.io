---
title: "AMIR-GRPO: Inducing Implicit Preference Signals into GRPO"
year: 2026
date: 2026-02-01
authors: "<u>Amir Hossein Yari</u>, Fajri Koto"
venue: "MathNLP @ EMNLP 2026"
venue_id: "mathnlp"
location: "Budapest, Hungary"
paper_url: "https://aclanthology.org/2026.mathnlp-main.6/"
code_url: "https://github.com/AmirHosseinYari2002/AMIR-GRPO"
abstract: "Despite its effectiveness for post-training reasoning models, group relative policy optimization (GRPO) suffers from several key limitations. Specifically, it introduces response-level length bias, weakly penalizes low-quality trajectories, and reduces rich intra-group preference information to a simplified scalar reward, limiting direct pairwise comparison between reasoning trajectories. To address these issues, we propose <strong><code>AMIR-GRPO</code></strong>, which augments GRPO with an implicit DPO-style contrastive regularizer constructed directly from intra-group reward rankings, without requiring additional annotations. This mechanism strengthens suppression of low-reward trajectories, mitigates length bias, and converts each rollout group into a denser set of supervision constraints. Across multiple mathematical reasoning benchmarks, <strong><code>AMIR-GRPO</code></strong> consistently outperforms strong GRPO baselines, achieves clearer separation between correct and incorrect reasoning chains, and delivers broader coverage beyond instances solved by standard GRPO."
bibtex: |
  @inproceedings{yari-koto-2026-amir,
    title = "{AMIR}-{GRPO}: Inducing Implicit Preference Signals into {GRPO}",
    author = "Yari, Amir Hossein  and
      Koto, Fajri",
    booktitle = "The Proceedings of the 4th Workshop on Mathematical Natural Language Processing ({M}ath{NLP} 2026)",
    month = oct,
    year = "2026",
    address = "Budapest, Hungary",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2026.mathnlp-main.6/",
    pages = "69--85",
    ISBN = "979-8-89176-468-2",
  }
---
