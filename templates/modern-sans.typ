// OneSecCV — Modern Sans
// Target: Tech, Startups, Product — clean sans-serif, geometric accents
// Placeholders: {{FIELD}} replaced by the backend before compilation

#set document(title: "{{FULL_NAME}} — CV", author: "{{FULL_NAME}}")
#set page(
  paper: "a4",
  margin: (top: 1.6cm, bottom: 1.6cm, left: 1.8cm, right: 1.8cm),
)
#set text(font: "Liberation Sans", size: 10pt, lang: "en")
#set par(justify: false, leading: 0.6em)

// ── Styles ──────────────────────────────────────────────────
#let primary = rgb("#0f172a")
#let muted = rgb("#64748b")
#let rule-color = rgb("#e2e8f0")

#let header(name, tagline, contact) = {
  text(size: 26pt, weight: "bold", fill: primary, tracking: -0.02em)[#name]
  v(2pt)
  text(size: 11pt, fill: muted)[#tagline]
  v(6pt)
  text(size: 8.5pt, fill: muted, tracking: 0.02em)[#contact]
  v(8pt)
  line(length: 100%, stroke: 1.2pt + primary)
  v(6pt)
}

#let section-title(title) = {
  v(10pt)
  grid(
    columns: (auto, 1fr),
    column-gutter: 8pt,
    align: (left, horizon),
    text(size: 10.5pt, weight: "bold", fill: primary, tracking: 0.06em)[#upper(title)],
    line(length: 100%, stroke: 0.4pt + rule-color),
  )
  v(5pt)
}

#let entry(title, org, location, dates, details) = {
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(weight: "bold", size: 10pt, fill: primary)[#title],
    text(size: 8.5pt, weight: "medium", fill: muted, font: "Liberation Mono")[#dates],
  )
  v(1pt)
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(size: 9.5pt, fill: muted)[#org],
    text(size: 8.5pt, fill: muted)[#location],
  )
  v(3pt)
  details
  v(5pt)
}

// ── Content ─────────────────────────────────────────────────
#header(
  "{{FULL_NAME}}",
  "{{TAGLINE}}",
  "{{EMAIL}}  ·  {{PHONE}}  ·  {{LOCATION}}  ·  {{LINKEDIN}}",
)

{{#IF_SUMMARY}}
#section-title("Summary")
text(size: 10pt, fill: luma(60))[{{SUMMARY}}]
{{/IF_SUMMARY}}

{{#IF_EXPERIENCE}}
#section-title("Experience")
{{EXPERIENCE_ENTRIES}}
{{/IF_EXPERIENCE}}

{{#IF_EDUCATION}}
#section-title("Education")
{{EDUCATION_ENTRIES}}
{{/IF_EDUCATION}}

{{#IF_SKILLS}}
#section-title("Technical Skills")
{{SKILLS_CONTENT}}
{{/IF_SKILLS}}

{{#IF_PROJECTS}}
#section-title("Projects")
{{PROJECTS_CONTENT}}
{{/IF_PROJECTS}}

{{#IF_CERTIFICATIONS}}
#section-title("Certifications")
{{CERTIFICATIONS_CONTENT}}
{{/IF_CERTIFICATIONS}}

{{#IF_LANGUAGES}}
#section-title("Languages")
{{LANGUAGES_CONTENT}}
{{/IF_LANGUAGES}}
