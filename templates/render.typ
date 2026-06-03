// OneSecCV — Render (port of render.tex)
// RenderCV style — Source Sans Pro, blue primary accent, two-column entries
// Page numbering footer, ATS-parsable, clean professional look

#set document(title: "{{FULL_NAME}}'s CV", author: "{{FULL_NAME}}")
#set page(
  paper: "us-letter",
  margin: (top: 2cm, bottom: 2cm, left: 2cm, right: 2cm),
  numbering: "1",
  footer: context {
    let current = counter(page).get().first()
    let total = counter(page).final().first()
    align(center)[
      #text(size: 8pt, fill: luma(150), style: "italic")[
        {{FULL_NAME}} -- Page #current of #total
      ]
    ]
  },
)
#set text(font: "Liberation Sans", size: 10pt, lang: "en")
#set par(justify: false, leading: 0.55em)

// ── Styles ──────────────────────────────────────────────────
#let primary = rgb("#004F90")

#let section-title(title) = {
  v(6pt)
  {
    text(size: 13pt, fill: primary, weight: "bold")[#title]
    h(4pt)
    box(width: 1fr, line(length: 100%, stroke: 0.8pt + primary))
  }
  v(4pt)
}

#let two-col-entry(left-content, right-content) = {
  grid(
    columns: (1fr, 4.5cm),
    column-gutter: 8pt,
    align: (left, right),
    left-content,
    text(size: 9pt, fill: luma(80))[#right-content],
  )
  v(4pt)
}

#let three-col-entry(label, left-content, right-content) = {
  grid(
    columns: (1cm, 1fr, 4.5cm),
    column-gutter: 6pt,
    align: (left, left, right),
    text(weight: "bold", size: 10pt)[#label],
    left-content,
    text(size: 9pt, fill: luma(80))[#right-content],
  )
  v(4pt)
}

#let one-col-entry(content) = {
  pad(left: 0.2cm, right: 0.2cm)[#content]
  v(4pt)
}

// ── Header ──────────────────────────────────────────────────
#align(center)[
  #text(size: 26pt, weight: "bold", fill: primary)[{{FULL_NAME}}]
  #v(6pt)
  #text(size: 9pt, fill: primary)[
    📍 {{LOCATION}}
    #h(6pt) · #h(6pt)
    ✉ {{EMAIL}}
    #h(6pt) · #h(6pt)
    ☎ {{PHONE}}
    #h(6pt) · #h(6pt)
    🔗 {{WEBSITE}}
    #h(6pt) · #h(6pt)
    💼 {{LINKEDIN}}
    #h(6pt) · #h(6pt)
    🐙 {{GITHUB}}
  ]
]
#v(4pt)

{{#IF_SUMMARY}}
#section-title("Summary")
#one-col-entry[{{SUMMARY}}]
{{/IF_SUMMARY}}

{{#IF_EDUCATION}}
#section-title("Education")
{{EDUCATION_ENTRIES}}
{{/IF_EDUCATION}}

{{#IF_EXPERIENCE}}
#section-title("Experience")
{{EXPERIENCE_ENTRIES}}
{{/IF_EXPERIENCE}}

{{#IF_PUBLICATIONS}}
#section-title("Publications")
{{PUBLICATIONS_CONTENT}}
{{/IF_PUBLICATIONS}}

{{#IF_PROJECTS}}
#section-title("Projects")
{{PROJECTS_CONTENT}}
{{/IF_PROJECTS}}

{{#IF_SKILLS}}
#section-title("Technologies")
{{SKILLS_CONTENT}}
{{/IF_SKILLS}}
