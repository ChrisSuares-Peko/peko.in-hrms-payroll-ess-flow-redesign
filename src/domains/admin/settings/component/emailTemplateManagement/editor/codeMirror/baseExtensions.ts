import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
    bracketMatching,
    defaultHighlightStyle,
    foldGutter,
    indentOnInput,
    syntaxHighlighting,
} from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Extension } from '@codemirror/state';
import {
    drawSelection,
    EditorView,
    highlightActiveLine,
    keymap,
    lineNumbers,
} from '@codemirror/view';

// Shared editor chrome/behavior for both the HTML and Sample Data (JSON)
// CodeMirror instances: line numbers, active-line highlight, bracket
// matching, folding, undo/redo history, search, and a light theme sized to
// sit inside the existing card-style container the app already renders
// around it (border/radius/background come from the wrapping div, not here).
export const baseExtensions: Extension[] = [
    lineNumbers(),
    highlightActiveLine(),
    drawSelection(),
    history(),
    bracketMatching(),
    foldGutter(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    highlightSelectionMatches(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
    EditorView.lineWrapping,
    EditorView.theme({
        '&': { fontSize: '13px', height: '100%' },
        '.cm-scroller': { fontFamily: 'Menlo, Consolas, monospace', overflow: 'auto' },
        '.cm-content': { padding: '8px 0' },
        '&.cm-focused': { outline: 'none' },
    }),
];
