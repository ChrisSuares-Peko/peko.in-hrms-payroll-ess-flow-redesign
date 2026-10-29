module.exports = {
    // Type-check only the staged TS/TSX files and the files they import
    // (not the whole project). Catches undefined variables, invalid imports and
    // type errors in the touched files. See scripts/typecheck-staged.mjs.
    '**/*.(ts|tsx)': filenames =>
        `node scripts/typecheck-staged.mjs ${filenames.map(file => `"${file}"`).join(' ')}`,

    // This will lint and format TypeScript and                                             //JavaScript files
    '**/*.(ts|tsx|js)': filenames => [
        `yarn eslint --fix ${filenames.join(' ')}`,
        `yarn prettier --write ${filenames.join(' ')}`,
    ],

    // this will Format MarkDown and JSON
    '**/*.(md|json)': filenames => `yarn prettier --write ${filenames.join(' ')}`,
};
