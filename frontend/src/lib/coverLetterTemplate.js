// Cover-letter LaTeX template, French formal letter format (A4).
//
// It is embedded in the frontend rather than fetched from the compile server,
// so cover letters need no server change: the /compile endpoint takes arbitrary
// LaTeX. Every package used here ships in the server's TeX Live image
// (latex-base / recommended + lmodern), so it compiles out of the box.
//
// The AI receives this as the reference to fill, same pattern as CV templates.
// Placeholders: {{SENDER_NAME}}, {{SENDER_ADDRESS}}, {{SENDER_CITY}},
// {{SENDER_PHONE}}, {{SENDER_EMAIL}}, {{RECIPIENT_COMPANY}}, {{RECIPIENT_NAME}},
// {{RECIPIENT_ADDRESS}}, {{DATE_CITY}}, {{DATE}}, {{POSITION}}, {{SALUTATION}},
// {{PARAGRAPH_1}}, {{PARAGRAPH_2}}, {{PARAGRAPH_3}}.

export const COVER_LETTER_TEMPLATE = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[a4paper,margin=2.5cm]{geometry}
\usepackage{lmodern}
\linespread{1.15}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.8em}
\pagestyle{empty}

\begin{document}

% Sender top left; recipient on the right, 1.5cm lower, with the date under it.
% If a detail is unknown, delete its whole line (including the trailing \\).
\noindent
\begin{minipage}[t]{0.48\textwidth}
\vspace{0pt}
{\bfseries {{SENDER_NAME}}}\\
{{SENDER_ADDRESS}}\\
{{SENDER_CITY}}\\
{{SENDER_PHONE}}\\
{{SENDER_EMAIL}}
\end{minipage}%
\hfill
\begin{minipage}[t]{0.42\textwidth}
\vspace{1.5cm}
\raggedright
{{RECIPIENT_COMPANY}}\\
{{RECIPIENT_NAME}}\\
{{RECIPIENT_ADDRESS}}

\vspace{1em}
{{DATE_CITY}}, le {{DATE}}
\end{minipage}

\vspace{1.2cm}

% Without a target position, the subject is: Objet : Candidature spontanée
\textbf{\underline{Objet : Candidature au poste de {{POSITION}}}}

{{SALUTATION}}

{{PARAGRAPH_1}}

{{PARAGRAPH_2}}

{{PARAGRAPH_3}}

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

\vspace{2cm}
\noindent\hfill {{SENDER_NAME}}

\end{document}`
