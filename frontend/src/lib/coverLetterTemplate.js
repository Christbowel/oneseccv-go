// A self-contained cover-letter LaTeX template.
//
// It is embedded in the frontend rather than fetched from the compile server,
// so adding cover letters needs no server change: the /compile endpoint takes
// arbitrary LaTeX. Every package used here ships in the server's TeX Live image
// (latex-base / recommended / extra + lmodern), so it compiles out of the box.
//
// The AI receives this as the reference to fill — same pattern as CV templates.

export const COVER_LETTER_TEMPLATE = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[margin=2.4cm]{geometry}
\usepackage{lmodern}
\usepackage{parskip}
\usepackage{xcolor}
\usepackage[hidelinks]{hyperref}

\definecolor{accent}{HTML}{CC4A00}
\setlength{\parindent}{0pt}

\newcommand{\sender}[4]{%
  {\LARGE\bfseries #1}\par
  \vspace{2pt}
  {\color{accent}\rule{\linewidth}{1pt}}\par
  \vspace{4pt}
  {\small #2 \quad\textbullet\quad #3 \quad\textbullet\quad #4}\par
}

\begin{document}

% ── Sender (from the CV) ──
\sender{Full Name}{email@example.com}{+00 000 000 000}{City, Country}

\vspace{18pt}

% ── Recipient / company (extracted from the job description) ──
{\bfseries Company Name}\par
Hiring Team\par
\vspace{6pt}
{\small\itshape Application for the position of: Job Title}\par

\vspace{14pt}
{\small \today}\par
\vspace{18pt}

Dear Hiring Manager,

\vspace{6pt}

% ── Opening: why this role, why this company (2-3 sentences) ──
Opening paragraph.

\vspace{6pt}

% ── Body: 1-2 paragraphs matching the candidate's real experience to the
%    offer's requirements, echoing its key terms, with concrete results. ──
Body paragraph one.

\vspace{6pt}

Body paragraph two.

\vspace{6pt}

% ── Closing: availability + call to action ──
Closing paragraph.

\vspace{12pt}

Sincerely,\par
\vspace{20pt}
{\bfseries Full Name}

\end{document}`
