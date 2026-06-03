// OneSecCV — SWE (port of swe.tex)
// Audric Serador style — Lato font, icon-rich header, small-caps sections
// Dense SWE-focused layout, ATS-parsable

#set document(title: "{{FULL_NAME}} — Resume", author: "{{FULL_NAME}}")
#set page(paper: "us-letter", margin: (top: 1.2cm, bottom: 1.2cm, left: 1.4cm, right: 1.4cm))
#set text(font: "Liberation Sans", size: 11pt, lang: "en")
#set par(justify: false, leading: 0.5em)

// ── Styles ──────────────────────────────────────────────────
#let section-title(title) = {
  v(4pt)
  text(size: 11pt, tracking: 0.06em)[#smallcaps(title)]
  v(-3pt)
  line(length: 100%, stroke: 0.6pt + black)
  v(3pt)
}

#let resume-subheading(title, date, subtitle, location) = {
  v(-2pt)
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(weight: "bold", size: 10.5pt)[#title],
    text(size: 10pt)[#date],
  )
  v(-1pt)
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(style: "italic", size: 9.5pt)[#subtitle],
    text(style: "italic", size: 9.5pt)[#location],
  )
  v(1pt)
}

#let resume-project(title, tech) = {
  v(-2pt)
  [#text(weight: "bold", size: 10pt)[#title] #text(size: 9.5pt)[ | ] #text(style: "italic", size: 9.5pt)[#tech]]
  v(1pt)
}

// ── Content ─────────────────────────────────────────────────
#align(center)[
  #text(size: 20pt, weight: "bold", tracking: 0.04em)[#smallcaps[{{FULL_NAME}}]]
  #v(3pt)
  #text(size: 9pt)[
    ☎ {{PHONE}}
    #h(8pt)
    ✉ #underline[{{EMAIL}}]
    #h(8pt)
    💼 #underline[{{LINKEDIN}}]
    #h(8pt)
    🐙 #underline[{{GITHUB}}]
  ]
]

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
#section-title("Technical Skills")
{{SKILLS_CONTENT}}
{{/IF_SKILLS}}
