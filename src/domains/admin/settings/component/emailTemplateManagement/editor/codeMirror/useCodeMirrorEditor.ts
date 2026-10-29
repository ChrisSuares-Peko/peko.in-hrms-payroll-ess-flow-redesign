import { RefObject, useEffect, useImperativeHandle, useRef } from 'react';

import { EditorState, Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export type CodeMirrorEditorHandle = {
    insertText: (text: string) => void;
    layout: () => void;
};

// Shared CodeMirror 6 lifecycle for the HTML and Sample Data (JSON) editors.
// The EditorView is created exactly once on mount (never recreated on
// re-render) and destroyed on unmount; external `value` changes are synced
// into the existing view via a transaction rather than tearing the editor
// down. The `current === value` guard is what prevents the
// React state -> CodeMirror update -> onChange -> React state loop: after
// CodeMirror's own edit already updated `value` via `onChange`, the doc and
// the incoming prop already match, so this effect is a no-op on that pass.
export const useCodeMirrorEditor = (
    containerRef: RefObject<HTMLDivElement>,
    value: string,
    onChange: (value: string) => void,
    extensions: Extension[],
    ref: React.Ref<CodeMirrorEditorHandle>
) => {
    const viewRef = useRef<EditorView>();
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        if (!containerRef.current) return undefined;

        const view = new EditorView({
            state: EditorState.create({
                doc: value,
                extensions: [
                    ...extensions,
                    EditorView.updateListener.of(update => {
                        if (update.docChanged) {
                            onChangeRef.current(update.state.doc.toString());
                        }
                    }),
                ],
            }),
            parent: containerRef.current,
        });
        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = undefined;
        };
        // Deliberately created once — `extensions` is a static, per-editor-type
        // configuration, and `value`'s initial doc content only matters at
        // creation time (subsequent changes are handled by the effect below).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const current = view.state.doc.toString();
        if (current === value) return;
        view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }, [value]);

    useImperativeHandle(ref, () => ({
        insertText: (text: string) => {
            const view = viewRef.current;
            if (!view) return;
            const { from, to } = view.state.selection.main;
            view.dispatch({
                changes: { from, to, insert: text },
                selection: { anchor: from + text.length },
                scrollIntoView: true,
            });
            view.focus();
        },
        // `automaticLayout`-style resize hook — CodeMirror's DOM-based
        // rendering usually reflows on its own, but forcing a re-measure right
        // when the HTML tab becomes visible again (after being `display:none`)
        // avoids relying on the browser to notice the size change on its own.
        layout: () => viewRef.current?.requestMeasure(),
    }));
};
