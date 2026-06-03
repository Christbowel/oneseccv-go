// OneSecCV — Elegant (port of elegant.tex)
// Lato font, DodgerBlue accent, dashed dividers, uppercase letterpsaced sections
// Original: Harikrishnan style — profile, summary, experience w/ projects, awards, education

#set document(title: "{{FULL_NAME}} — CV", author: "{{FULL_NAME}}")
#set page(paper: "a4", margin: (top: 1.2cm, bottom: 1.2cm, left: 1.2cm, right: 1.2cm))
#set text(font: "Liberation Sans", size: 10pt, lang: "en")
#set par(justify: false, leading: 0.55em)

// ── Styles ──────────────────────────────────────────────────
#let accent = rgb("#4F83FF")
#let body-color = rgb("#000000").lighten(20%)
#let divider-color = accent.lighten(40%)

#let cv-header(name, tagline, contact) = {
  align(center)[
    #text(size: 14pt, weight: "bold", tracking: 0.25em, fill: black)[#upper(name)]
    #v(2pt)
    #text(size: 10pt, weight: "bold", fill: accent, tracking: 0.34em)[#upper(tagline)]
    #v(2pt)
    #text(size: 8pt, weight: "bold", fill: body-color)[#contact]
  ]
  v(4pt)
}

#let section-title(title) = {
  v(8pt)
  text(size: 10pt, weight: "bold", fill: accent, tracking: 0.25em)[#upper(title)]
  v(-2pt)
  line(length: 100%, stroke: 1.2pt + accent)
  v(4pt)
}

#let dashed-divider() = {
  v(4pt)
  align(center)[
    #text(fill: divider-color, size: 8pt)[#"— " * 30]
  ]
  v(4pt)
}

#let company-entry(name, title, location, dates) = {
  v(2pt)
  grid(
    columns: (1fr, 1fr),
    align: (left, right),
    text(size: 9pt, weight: "bold", fill: body-color, tracking: 0.14em)[#upper(name)],
    text(size: 9pt, weight: "bold", fill: body-color, tracking: 0.14em)[#upper(title)],
  )
  v(1pt)
  grid(
    columns: (1fr, 1fr),
    align: (left, right),
    text(size: 9pt, fill: body-color)[📍 #location],
    text(size: 9pt, fill: body-color)[📅 #dates],
  )
  v(2pt)
}

#let project-entry(name, client, role, tech) = {
  v(3pt)
  text(size: 9pt)[*Project:* #name #h(1fr) *Client:* #client]
  linebreak()
  text(size: 9pt)[*Role(s):* #role #h(1fr) *Technologies:* #tech]
  v(1pt)
  text(size: 9pt, weight: "bold")[Responsibilities:]
  v(2pt)
}

#let education-entry(degree, institution, dates) = {
  v(2pt)
  text(size: 9pt, fill: body-color, tracking: 0.14em)[#upper(degree)]
  linebreak()
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(size: 9pt, tracking: 0.14em)[#institution],
    text(size: 9pt)[📅 #dates],
  )
}

#let award-entry(title, date, description) = {
  grid(
    columns: (2em, 1fr),
    column-gutter: 6pt,
    align: (center, left),
    text(size: 14pt, fill: accent)[🏆],
    {
      grid(
        columns: (1fr, auto),
        text(size: 9pt, weight: "bold")[#title],
        text(size: 9pt, fill: accent)[📅 #date],
      )
      v(1pt)
      text(size: 9pt, fill: body-color)[#description]
    },
  )
  v(2pt)
}

// ── Content ─────────────────────────────────────────────────
#cv-header(
  "{{FULL_NAME}}",
  "{{TAGLINE}}",
  "✉ {{EMAIL}}  ☎ {{PHONE}}  📍 {{LOCATION}}  🔗 {{LINKEDIN}}",
)

{{#IF_SUMMARY}}
#section-title("Profile")
{{SUMMARY}}
{{/IF_SUMMARY}}

{{#IF_EXPERIENCE}}
#section-title("Professional Experience")
{{EXPERIENCE_ENTRIES}}
{{/IF_EXPERIENCE}}

{{#IF_AWARDS}}
#section-title("Awards")
{{AWARDS_CONTENT}}
{{/IF_AWARDS}}

{{#IF_EDUCATION}}
#section-title("Education")
{{EDUCATION_ENTRIES}}
{{/IF_EDUCATION}}

{{#IF_SKILLS}}
#section-title("Technical Skills")
{{SKILLS_CONTENT}}
{{/IF_SKILLS}}

{{#IF_LANGUAGES}}
#section-title("Languages")
{{LANGUAGES_CONTENT}}
{{/IF_LANGUAGES}}
