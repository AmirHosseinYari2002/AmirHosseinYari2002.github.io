---
title: "AMIR-GRPO: Inducing Implicit Preference Signals into GRPO"
year: 2026
date: 2026-01-01
authors: "<u>Amir Hossein Yari</u>, Fajri Koto"
paper_url: "https://arxiv.org/abs/2601.03661"
code_url: "https://github.com/AmirHosseinYari2002/AMIR-GRPO"
abstract: "Despite its effectiveness for post-training reasoning models, group relative policy optimization (GRPO) suffers from several key limitations. Specifically, it introduces response-level length bias, weakly penalizes low-quality trajectories, and reduces rich intra-group preference information to a simplified scalar reward, limiting direct pairwise comparison between reasoning trajectories. To address these issues, we propose <strong><code>AMIR-GRPO</code></strong>, which augments GRPO with an implicit DPO-style contrastive regularizer constructed directly from intra-group reward rankings, without requiring additional annotations. This mechanism strengthens suppression of low-reward trajectories, mitigates length bias, and converts each rollout group into a denser set of supervision constraints. Across multiple mathematical reasoning benchmarks, <strong><code>AMIR-GRPO</code></strong> consistently outperforms strong GRPO baselines, achieves clearer separation between correct and incorrect reasoning chains, and delivers broader coverage beyond instances solved by standard GRPO."
bibtex: |
  @article{yari2026amir,
    title={AMIR-GRPO: Inducing Implicit Preference Signals into GRPO},
    author={Yari, Amir Hossein and Koto, Fajri},
    journal={arXiv preprint arXiv:2601.03661},
    year={2026}
  }
---