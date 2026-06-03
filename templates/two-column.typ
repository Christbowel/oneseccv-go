// OneSecCV — Two-Column Minimal
// Target: Design-aware roles, PM, Marketing — structured two-column with left sidebar
// Placeholders: {{FIELD}} replaced by the backend before compilation

#set document(title: "{{FULL_NAME}} — CV", author: "{{FULL_NAME}}")
#set page(
  paper: "a4",
  margin: (top: 1.6cm, bottom: 1.6cm, left: 1.6cm, right: 1.6cm),
)
#set text(font: "Liberation Sans", size: 9.5pt, lang: "en")
#set par(justify: true, leading: 0.6em)

// ── Styles ──────────────────────────────────────────────────
#let dark = rgb("#1e293b")
#let accent = rgb("#334155")
#let light-rule = rgb("#cbd5e1")

#let section-title(title) = {
  v(8pt)
  text(size: 9pt, weight: "bold", fill: dark, tracking: 0.08em)[#upper(title)]
  v(2pt)
  line(length: 100%, stroke: 0.5pt + light-rule)
  v(4pt)
}

#let entry(title, org, location, dates, details) = {
  text(weight: "bold", size: 9.5pt, fill: dark)[#title]
  h(4pt)
  text(size: 8pt, fill: accent, font: "Liberation Mono")[#dates]
  linebreak()
  text(style: "italic", size: 9pt, fill: accent)[#org#if location != "" [, #location]]
  v(2pt)
  details
  v(4pt)
}

// ── Header ──────────────────────────────────────────────────
align(center)[
  #text(size: 24pt, weight: "bold", fill: dark, tracking: 0.02em)[{{FULL_NAME}}]
  #v(3pt)
  #text(size: 10pt, fill: accent)[{{TAGLINE}}]
  #v(5pt)
  #text(size: 8pt, fill: accent)[{{EMAIL}} · {{PHONE}} · {{LOCATION}} · {{LINKEDIN}}]
]
v(6pt)
line(length: 100%, stroke: 0.8pt + dark)
v(8pt)

// ── Two-Column Layout ───────────────────────────────────────
grid(
  columns: (32%, 1fr),
  column-gutter: 16pt,

  // ── LEFT COLUMN ──
  {
    {{#IF_SKILLS}}
    section-title("Skills")
    {{SKILLS_CONTENT}}
    {{/IF_SKILLS}}

    {{#IF_LANGUAGES}}
    section-title("Languages")
    {{LANGUAGES_CONTENT}}
    {{/IF_LANGUAGES}}

    {{#IF_CERTIFICATIONS}}
    section-title("Certifications")
    {{CERTIFICATIONS_CONTENT}}
    {{/IF_CERTIFICATIONS}}

    {{#IF_INTERESTS}}
    section-title("Interests")
    {{INTERESTS_CONTENT}}
    {{/IF_INTERESTS}}
  },

  // ── RIGHT COLUMN ──
  {
    {{#IF_SUMMARY}}
    section-title("Profile")
    text(size: 9.5pt, fill: luma(50))[{{SUMMARY}}]
    {{/IF_SUMMARY}}

    {{#IF_EXPERIENCE}}
    section-title("Experience")
    {{EXPERIENCE_ENTRIES}}
    {{/IF_EXPERIENCE}}

    {{#IF_EDUCATION}}
    section-title("Education")
    {{EDUCATION_ENTRIES}}
    {{/IF_EDUCATION}}

    {{#IF_PROJECTS}}
    section-title("Projects")
    {{PROJECTS_CONTENT}}
    {{/IF_PROJECTS}}
  },
)
