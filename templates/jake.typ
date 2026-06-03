// OneSecCV — Jake (port of jake.tex)
// Classic Jake Gutierrez resume — compact, small-caps section titles with black rule
// Dense layout, ATS-parsable, letterpaper equivalent

#set document(title: "{{FULL_NAME}} — Resume", author: "{{FULL_NAME}}")
#set page(paper: "us-letter", margin: (top: 1.2cm, bottom: 1.2cm, left: 1.4cm, right: 1.4cm))
#set text(font: "New Computer Modern", size: 11pt, lang: "en")
#set par(justify: false, leading: 0.5em)

// ── Styles ──────────────────────────────────────────────────
#let section-title(title) = {
  v(4pt)
  text(size: 11pt, weight: "regular", tracking: 0.08em)[#smallcaps(title)]
  v(-3pt)
  line(length: 100%, stroke: 0.8pt + black)
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

#let resume-project(title, tech, date) = {
  v(-2pt)
  grid(
    columns: (1fr, auto),
    align: (left, right),
    [#text(weight: "bold", size: 10pt)[#title] #text(size: 9.5pt)[ | ] #text(style: "italic", size: 9.5pt)[#tech]],
    text(size: 9.5pt)[#date],
  )
  v(1pt)
}

// ── Content ─────────────────────────────────────────────────
#align(center)[
  #text(size: 20pt, weight: "bold", tracking: 0.04em)[#smallcaps[{{FULL_NAME}}]]
  #v(2pt)
  #text(size: 9.5pt)[{{CONTACT_LINE}}]
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
