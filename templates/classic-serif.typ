// OneSecCV — Classic Serif
// Target: Finance, Consulting, Law — single-column, dense, ATS-optimized
// Placeholders: {{FIELD}} replaced by the backend before compilation

#set document(title: "{{FULL_NAME}} — CV", author: "{{FULL_NAME}}")
#set page(
  paper: "a4",
  margin: (top: 1.8cm, bottom: 1.8cm, left: 2cm, right: 2cm),
)
#set text(font: "New Computer Modern", size: 10.5pt, lang: "en")
#set par(justify: true, leading: 0.65em)

// ── Styles ──────────────────────────────────────────────────
#let accent = rgb("#1a1a2e")

#let header(name, tagline, contact) = {
  align(center)[
    #text(size: 22pt, weight: "bold", fill: accent, tracking: 0.05em)[#name]
    #v(3pt)
    #text(size: 10pt, style: "italic", fill: luma(80))[#tagline]
    #v(4pt)
    #text(size: 8.5pt, fill: luma(100))[#contact]
  ]
  v(6pt)
  line(length: 100%, stroke: 0.6pt + accent)
  v(4pt)
}

#let section-title(title) = {
  v(8pt)
  text(size: 11pt, weight: "bold", fill: accent, tracking: 0.04em)[#upper(title)]
  v(1pt)
  line(length: 100%, stroke: 0.3pt + luma(180))
  v(4pt)
}

#let entry(title, org, location, dates, details) = {
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(weight: "bold", size: 10.5pt)[#title],
    text(size: 9pt, fill: luma(100))[#dates],
  )
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(style: "italic", size: 10pt)[#org],
    text(size: 9pt, fill: luma(120))[#location],
  )
  v(2pt)
  details
  v(4pt)
}

// ── Content ─────────────────────────────────────────────────
#header(
  "{{FULL_NAME}}",
  "{{TAGLINE}}",
  "{{EMAIL}} · {{PHONE}} · {{LOCATION}} · {{LINKEDIN}}",
)

{{#IF_SUMMARY}}
#section-title("Professional Summary")
{{SUMMARY}}
{{/IF_SUMMARY}}

{{#IF_EXPERIENCE}}
#section-title("Professional Experience")
{{EXPERIENCE_ENTRIES}}
{{/IF_EXPERIENCE}}

{{#IF_EDUCATION}}
#section-title("Education")
{{EDUCATION_ENTRIES}}
{{/IF_EDUCATION}}

{{#IF_SKILLS}}
#section-title("Skills")
{{SKILLS_CONTENT}}
{{/IF_SKILLS}}

{{#IF_CERTIFICATIONS}}
#section-title("Certifications & Licenses")
{{CERTIFICATIONS_CONTENT}}
{{/IF_CERTIFICATIONS}}

{{#IF_LANGUAGES}}
#section-title("Languages")
{{LANGUAGES_CONTENT}}
{{/IF_LANGUAGES}}

{{#IF_EXTRA}}
#section-title("Additional")
{{EXTRA_CONTENT}}
{{/IF_EXTRA}}
