import { useEffect, useRef } from 'react'
import { Annotation, EditorState } from '@codemirror/state'
import {
  EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { StreamLanguage, bracketMatching, syntaxHighlighting } from '@codemirror/language'
import { stex } from '@codemirror/legacy-modes/mode/stex'

const C = {
  bg:     '#080C18',
  text:   '#F5F5F5',
  muted:  '#A0A8C0',
  border: '#1A2040',
  orange: '#FF6B1A',
  blue:   '#5B8FFF',
}

const latex = StreamLanguage.define(stex)

// Token classes, keyed by highlight tag name. A token is matched on its own
// tag first, then on the tag's parents (`atom` before `keyword`), so no
// highlighting package beyond CodeMirror's own is needed.
const TOKEN_CLASS = {
  tagName:                 'cm-tex-command',  // \section, \textbf
  atom:                    'cm-tex-name',     // {itemize}, {article}
  keyword:                 'cm-tex-math',     // $ delimiters
  'special(variableName)': 'cm-tex-math',
  number:                  'cm-tex-number',
  comment:                 'cm-tex-comment',
  bracket:                 'cm-tex-bracket',
  invalid:                 'cm-tex-invalid',  // unbalanced }
}

const latexHighlighter = {
  style(tags) {
    for (const tag of tags) {
      for (const t of tag.set) {
        const cls = TOKEN_CLASS[String(t)]
        if (cls) return cls
      }
    }
    return null
  },
}

const editorTheme = EditorView.theme({
  '&': { height: '100%', color: C.text, backgroundColor: C.bg, fontSize: '13px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Ubuntu Mono', ui-monospace, monospace",
    lineHeight: '1.65',
    overscrollBehavior: 'contain',
  },
  '.cm-content': { caretColor: C.orange, padding: '10px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: C.orange, borderLeftWidth: '2px' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(255,107,26,0.3)',
  },
  '.cm-activeLine': { backgroundColor: 'rgba(245,245,245,0.03)' },
  '.cm-gutters': {
    backgroundColor: C.bg,
    color: 'rgba(160,168,192,0.45)',
    border: 'none',
    borderRight: `1px solid ${C.border}`,
  },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255,107,26,0.08)', color: C.orange },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'rgba(91,143,255,0.22)',
    outline: 'none',
  },
  '.cm-nonmatchingBracket, &.cm-focused .cm-nonmatchingBracket': {
    backgroundColor: 'rgba(255,107,26,0.25)',
    outline: 'none',
  },

  '.cm-tex-command': { color: C.blue },
  '.cm-tex-name':    { color: C.orange },
  '.cm-tex-math':    { color: 'rgba(255,107,26,0.75)' },
  '.cm-tex-number':  { color: 'rgba(91,143,255,0.8)' },
  '.cm-tex-comment': { color: 'rgba(160,168,192,0.55)', fontStyle: 'italic' },
  '.cm-tex-bracket': { color: C.muted },
  '.cm-tex-invalid': { textDecoration: `underline wavy ${C.orange}` },
}, { dark: true })

// Marks edits that come from props (AI result), so they are not echoed back.
const External = Annotation.define()

/** CodeMirror 6 editor for a LaTeX source. `value` is the text, `onChange` gets every edit. */
export default function LatexEditor({ value, onChange }) {
  const hostRef = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // The view is created once; later `value` changes go through the effect below.
  useEffect(() => {
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          bracketMatching(),
          EditorView.lineWrapping,
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          latex,
          syntaxHighlighting(latexHighlighter),
          editorTheme,
          EditorView.contentAttributes.of({
            'aria-label': 'LaTeX source', spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off',
          }),
          EditorView.updateListener.of(update => {
            if (update.docChanged && !update.transactions.some(tr => tr.annotation(External))) {
              onChangeRef.current?.(update.state.doc.toString())
            }
          }),
        ],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view || value === view.state.doc.toString()) return
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: External.of(true),
    })
  }, [value])

  return <div ref={hostRef} className="h-full" />
}
