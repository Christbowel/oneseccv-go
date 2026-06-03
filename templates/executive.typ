// OneSecCV — Executive
// Target: C-suite, VP, Director — refined, authoritative, maximum density
// Placeholders: {{FIELD}} replaced by the backend before compilation

#set document(title: "{{FULL_NAME}} — Executive Resume", author: "{{FULL_NAME}}")
#set page(
  paper: "a4",
  margin: (top: 1.6cm, bottom: 1.6cm, left: 2cm, right: 2cm),
)
#set text(font: "New Computer Modern", size: 10pt, lang: "en")
#set par(justify: true, leading: 0.6em)

// ── Styles ──────────────────────────────────────────────────
#let navy = rgb("#0c1b33")
#let steel = rgb("#475569")
#let gold-line = rgb("#94a3b8")

#let header(name, tagline, contact) = {
  line(length: 100%, stroke: 2pt + navy)
  v(8pt)
  text(size: 24pt, weight: "bold", fill: navy, tracking: 0.06em)[#upper(name)]
  v(2pt)
  text(size: 11pt, fill: steel, tracking: 0.03em)[#tagline]
  v(6pt)
  text(size: 8.5pt, fill: steel)[#contact]
  v(8pt)
  line(length: 100%, stroke: 2pt + navy)
  v(4pt)
}

#let section-title(title) = {
  v(10pt)
  text(size: 10pt, weight: "bold", fill: navy, tracking: 0.06em)[#upper(title)]
  v(2pt)
  line(length: 100%, stroke: 0.5pt + gold-line)
  v(4pt)
}

#let entry(title, org, location, dates, details) = {
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(weight: "bold", size: 10pt, fill: navy)[#title],
    text(size: 9pt, fill: steel)[#dates],
  )
  v(1pt)
  grid(
    columns: (1fr, auto),
    align: (left, right),
    text(size: 9.5pt, fill: steel, style: "italic")[#org],
    text(size: 8.5pt, fill: steel)[#location],
  )
  v(2pt)
  details
  v(5pt)
}

// ── Content ─────────────────────────────────────────────────
#header(
  "{{FULL_NAME}}",
  "{{TAGLINE}}",
  "{{EMAIL}} · {{PHONE}} · {{LOCATION}} · {{LINKEDIN}}",
)

{{#IF_SUMMARY}}
#section-title("Executive Summary")
text(size: 10pt, fill: luma(40))[{{SUMMARY}}]
v(2pt)
{{/IF_SUMMARY}}

{{#IF_HIGHLIGHTS}}
#section-title("Key Achievements")
{{HIGHLIGHTS_CONTENT}}
{{/IF_HIGHLIGHTS}}

{{#IF_EXPERIENCE}}
#section-title("Professional Experience")
{{EXPERIENCE_ENTRIES}}
{{/IF_EXPERIENCE}}

{{#IF_BOARD}}
#section-title("Board Memberships & Advisory Roles")
{{BOARD_CONTENT}}
{{/IF_BOARD}}

{{#IF_EDUCATION}}
#section-title("Education")
{{EDUCATION_ENTRIES}}
{{/IF_EDUCATION}}

{{#IF_CERTIFICATIONS}}
#section-title("Certifications & Professional Development")
{{CERTIFICATIONS_CONTENT}}
{{/IF_CERTIFICATIONS}}

{{#IF_SKILLS}}
#section-title("Core Competencies")
{{SKILLS_CONTENT}}
{{/IF_SKILLS}}

{{#IF_LANGUAGES}}
#section-title("Languages")
{{LANGUAGES_CONTENT}}
{{/IF_LANGUAGES}}
