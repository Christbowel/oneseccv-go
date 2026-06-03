// OneSecCV — Academic
// Target: Research, Academia, PhD — traditional scholarly CV with publications
// Placeholders: {{FIELD}} replaced by the backend before compilation

#set document(title: "{{FULL_NAME}} — Curriculum Vitae", author: "{{FULL_NAME}}")
#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 2.2cm, right: 2.2cm),
  numbering: "1",
  number-align: center,
)
#set text(font: "New Computer Modern", size: 10.5pt, lang: "en")
#set par(justify: true, leading: 0.7em)

// ── Styles ──────────────────────────────────────────────────
#let dark = rgb("#111827")

#let header(name, tagline, contact) = {
  align(center)[
    #text(size: 20pt, weight: "bold", fill: dark)[#name]
    #v(3pt)
    #text(size: 10.5pt, style: "italic", fill: luma(70))[#tagline]
    #v(5pt)
    #text(size: 8.5pt, fill: luma(90))[#contact]
  ]
  v(6pt)
  line(length: 100%, stroke: 0.8pt + dark)
  v(2pt)
  line(length: 100%, stroke: 0.3pt + luma(180))
  v(4pt)
}

#let section-title(title) = {
  v(10pt)
  text(size: 12pt, weight: "bold", fill: dark)[#title]
  v(2pt)
  line(length: 100%, stroke: 0.4pt + luma(160))
  v(5pt)
}

#let entry(title, org, location, dates, details) = {
  grid(
    columns: (auto, 1fr),
    column-gutter: 12pt,
    align: (left, left),
    text(size: 9.5pt, fill: luma(100), font: "New Computer Modern")[#dates],
    {
      text(weight: "bold", size: 10.5pt)[#title]
      linebreak()
      text(style: "italic", size: 10pt, fill: luma(60))[#org#if location != "" [, #location]]
      v(2pt)
      details
    },
  )
  v(5pt)
}

// ── Content ─────────────────────────────────────────────────
#header(
  "{{FULL_NAME}}",
  "{{TAGLINE}}",
  "{{EMAIL}} · {{PHONE}} · {{LOCATION}} · {{WEBSITE}}",
)

{{#IF_SUMMARY}}
#section-title("Research Interests")
{{SUMMARY}}
{{/IF_SUMMARY}}

{{#IF_EDUCATION}}
#section-title("Education")
{{EDUCATION_ENTRIES}}
{{/IF_EDUCATION}}

{{#IF_EXPERIENCE}}
#section-title("Academic & Professional Experience")
{{EXPERIENCE_ENTRIES}}
{{/IF_EXPERIENCE}}

{{#IF_PUBLICATIONS}}
#section-title("Publications")
{{PUBLICATIONS_CONTENT}}
{{/IF_PUBLICATIONS}}

{{#IF_TALKS}}
#section-title("Talks & Presentations")
{{TALKS_CONTENT}}
{{/IF_TALKS}}

{{#IF_AWARDS}}
#section-title("Honors & Awards")
{{AWARDS_CONTENT}}
{{/IF_AWARDS}}

{{#IF_SKILLS}}
#section-title("Technical Skills")
{{SKILLS_CONTENT}}
{{/IF_SKILLS}}

{{#IF_LANGUAGES}}
#section-title("Languages")
{{LANGUAGES_CONTENT}}
{{/IF_LANGUAGES}}

{{#IF_REFERENCES}}
#section-title("References")
{{REFERENCES_CONTENT}}
{{/IF_REFERENCES}}
