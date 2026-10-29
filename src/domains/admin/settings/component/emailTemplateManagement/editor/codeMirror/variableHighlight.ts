import { Decoration, EditorView, MatchDecorator, ViewPlugin } from '@codemirror/view';

// Purely cosmetic decoration — visually highlights `${variable_name}`
// placeholders in the HTML editor. Matches the same simple-identifier rule
// the backend/template system supports (`${[A-Za-z0-9_]{1,64}}`); anything
// that doesn't match this shape (`${user.name}`, `${foo()}`, etc.) is left
// unstyled rather than guessed at — this never parses or evaluates anything,
// it only decides what to colorize.
const variableMatcher = new MatchDecorator({
    regexp: /\$\{[A-Za-z0-9_]{1,64}\}/g,
    decoration: () => Decoration.mark({ class: 'cm-variable-token' }),
});

export const variableHighlightPlugin = ViewPlugin.define(
    view => ({
        decorations: variableMatcher.createDeco(view),
        update(update) {
            this.decorations = variableMatcher.updateDeco(update, this.decorations);
        },
    }),
    { decorations: instance => instance.decorations }
);

export const variableHighlightTheme = EditorView.baseTheme({
    '.cm-variable-token': {
        color: '#FF3A3A',
        fontWeight: '600',
    },
});
