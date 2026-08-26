# Amir Hossein Yari — Academic Website

Source for [amirhosseinyari2002.github.io](https://amirhosseinyari2002.github.io/), built with Jekyll and deployed automatically by GitHub Pages.

## Content structure

The site keeps content separate from presentation so routine updates do not require editing layouts or CSS.

- `_pages/about.md` — homepage introduction and research-focus visuals
- `_data/news.yaml` — homepage news entries
- `_publications/` — one Markdown file per publication
- `_data/publication_venues.yml` — reusable venue names and official logos
- `_data/cv.json` — education and experience data for the CV
- `assets/images/logos/` — institutional logos
- `assets/images/venues/` — publication-venue logos
- `assets/css/` — the shared Neural Night design and page-specific styles
- `assets/js/` — small, page-specific interactions

Detailed examples for adding news, publications, venues, and CV entries are in [`.github/CONTENT_MANAGEMENT.md`](.github/CONTENT_MANAGEMENT.md).

## Local development

Install Ruby and Bundler, then run:

```bash
bundle install
bundle exec jekyll serve --livereload
```

Open `http://localhost:4000`. Changes to `_config.yml` require restarting the Jekyll server.

Docker and VS Code Dev Container configurations are also retained for reproducible local development.

## Deployment

Merging into `master` triggers the GitHub Pages build-and-deployment workflow. The published site normally updates within a few minutes. Build status is available in the repository's **Actions** tab.

## Maintenance principles

- Add content through the data or collection files above.
- Reuse registered logos and venue definitions instead of duplicating markup.
- Keep shared navigation behavior in `neural-observatory.css` and page-only presentation in the corresponding page stylesheet.
- Preserve semantic HTML, keyboard focus states, and reduced-motion behavior when adding interactions.

## License

The site is based on AcademicPages/Minimal Mistakes. See [`LICENSE`](LICENSE) for licensing information.
