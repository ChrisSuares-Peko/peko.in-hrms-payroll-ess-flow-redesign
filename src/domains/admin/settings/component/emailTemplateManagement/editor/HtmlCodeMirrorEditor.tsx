import { forwardRef, useRef } from 'react';

import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';

import { baseExtensions } from './codeMirror/baseExtensions';
import { CodeMirrorEditorHandle, useCodeMirrorEditor } from './codeMirror/useCodeMirrorEditor';
import { variableHighlightPlugin, variableHighlightTheme } from './codeMirror/variableHighlight';

export type HtmlEditorHandle = CodeMirrorEditorHandle;

type HtmlCodeMirrorEditorProps = {
    value: string;
    onChange: (value: string) => void;
};

const extensions = [
    ...baseExtensions,
    html(),
    variableHighlightPlugin,
    variableHighlightTheme,
    EditorView.contentAttributes.of({ 'aria-label': 'Email HTML editor' }),
];

const HtmlCodeMirrorEditor = forwardRef<HtmlEditorHandle, HtmlCodeMirrorEditorProps>(
    ({ value, onChange }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        useCodeMirrorEditor(containerRef, value, onChange, extensions, ref);

        return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
    }
);

HtmlCodeMirrorEditor.displayName = 'HtmlCodeMirrorEditor';

export default HtmlCodeMirrorEditor;
