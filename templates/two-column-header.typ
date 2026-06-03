// OneSecCV — Two-Column Header (port of two-column.tex)
// Tri-zone header: contact left | name center | links right
// Source Sans Pro, UI_blue accent, keywords strip under header

#set document(title: "{{FULL_NAME}} — CV", author: "{{FULL_NAME}}")
#set page(paper: "a4", margin: (top: 1cm, bottom: 1cm, left: 1cm, right: 1cm))
#set text(font: "Liberation Sans", size: 10pt, lang: "en")
#set par(justify: false, leading: 0.5em)

// ── Styles ──────────────────────────────────────────────────
#let ui-blue = rgb("#204097")

#let section-title(title) = {
  v(4pt)
  text(size: 11pt, fill: ui-blue, tracking: 0.06em)[#smallcaps(title)]
  v(-4pt)
  line(length: 100%, stroke: 0.5pt + ui-blue.lighten(30%))
  v(3pt)
}

#let subsection-entry(title, date) = {
  v(1pt)
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(weight: "bold", size: 10.5pt)[#title],
    text(size: 10pt, weight: "bold")[#date],
  )
}

#let subtext(content) = {
  text(size: 9.5pt)[#content]
  v(-2pt)
}

// ── Header (tri-zone) ───────────────────────────────────────
grid(
  columns: (30%, 40%, 30%),
  align: (left, center, right),
  {
    text(size: 10pt)[{{PHONE}}]
    linebreak()
    text(size: 10pt)[{{EMAIL}}]
  },
  {
    text(size: 20pt, weight: "bold")[{{FULL_NAME}}]
    v(2pt)
    text(size: 12pt, fill: ui-blue, weight: "bold")[{{TAGLINE}}]
  },
  {
    text(size: 10pt)[{{LINKEDIN}}]
    linebreak()
    text(size: 10pt)[{{GITHUB}}]
  },
)

v(3pt)
line(length: 100%, stroke: 1pt + ui-blue)
v(3pt)

// ── Keywords strip ──────────────────────────────────────────
{{#IF_KEYWORDS}}
align(center)[
  #text(size: 9pt)[{{KEYWORDS}}]
]
v(2pt)
{{/IF_KEYWORDS}}

// ── Sections ────────────────────────────────────────────────
{{#IF_EDUCATION}}
#section-title("Education")
{{EDUCATION_ENTRIES}}
{{/IF_EDUCATION}}

{{#IF_EXPERIENCE}}
#section-title("Experience")
{{EXPERIENCE_ENTRIES}}
{{/IF_EXPERIENCE}}

{{#IF_PROJECTS}}
#section-title("Projects")
{{PROJECTS_CONTENT}}
{{/IF_PROJECTS}}

{{#IF_SKILLS}}
#section-title("Skills")
{{SKILLS_CONTENT}}
{{/IF_SKILLS}}

{{#IF_CERTIFICATIONS}}
#section-title("Certifications")
{{CERTIFICATIONS_CONTENT}}
{{/IF_CERTIFICATIONS}}
