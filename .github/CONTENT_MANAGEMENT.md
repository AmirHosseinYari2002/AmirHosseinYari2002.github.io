# Website content management

## Update the CV

The CV page is generated from `_data/cv.json`. Edit that single file to add or
update education and experience entries; the layout, timeline, logo sizing,
responsive behavior, and accessibility markup are applied automatically.

Add a new object to the `experience` array in reverse chronological order:

```json
{
  "role": "Researcher",
  "organization": "Institution name",
  "url": "https://institution.example/",
  "date": "Jan 2027–Present",
  "location": "City, Country",
  "supervisor": "Prof. Name",
  "logo": "/assets/images/logos/institution.png",
  "logo_id": "institution",
  "logo_alt": "Institution logo",
  "highlights": [
    "A concise description of the work."
  ]
}
```

`supervisor` and `courses` are optional. Store each original logo once under
`assets/images/logos/`; every logo is fitted proportionally inside the same
fixed-size tile, so a new entry never requires redesigning a card.

## Add a publication

Create one Markdown file in `_publications/`, using a descriptive filename such as
`2027-paper-short-title.md`. The Publications page discovers the collection,
sorts it by date, groups it by year, and renders a card automatically.

```yaml
---
title: "Paper title"
year: 2027
date: 2027-05-01
authors: "<u>Amir Hossein Yari</u>, Coauthor Name"
venue: "ACL 2027"
venue_id: "acl"
location: "Conference city, Country"
paper_url: "https://..."
code_url: "https://github.com/..."       # optional
dataset_url: "https://huggingface.co/..." # optional
abstract: "Abstract text"
bibtex: |
  @inproceedings{...}
---
```

Optional URLs create their corresponding buttons automatically. Use
`authors_short` only for unusually long author lists; `authors` should always
contain the complete list.

Venue presentation is centralized in `_data/publication_venues.yml`. For a paper
at an existing venue, reuse its `venue_id`; no template or logo change is needed.
For a genuinely new venue, add its official logo under `assets/images/venues/`
and register it once in `publication_venues.yml`.

For preprints, keep `year` for sorting and grouping, but their badge intentionally
shows only the repository name (for example, `arXiv` or `TechRxiv`).

## Add news

Add one entry to `_data/news.yaml`:

```yaml
- date: 2027-05-01
  description: "Paper accepted at ACL 2027"
```

News is sorted automatically by date. The homepage shows the newest five entries
and places older entries behind **View all news**.
