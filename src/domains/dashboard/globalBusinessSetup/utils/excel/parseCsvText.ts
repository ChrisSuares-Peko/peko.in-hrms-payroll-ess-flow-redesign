// ExcelJS's CSV reader is built on Node streams and does not run in the browser,
// so CSV is parsed here. Follows RFC 4180: a quoted field may contain commas and
// newlines, and a doubled quote inside one is a literal quote.
export const parseCsvText = (text: string): string[][] => {
    // Strip a UTF-8 BOM if present (0xFEFF as the first code unit).
    const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    const rows: string[][] = [];

    let row: string[] = [];
    let field = '';
    let quoted = false;

    const endField = () => {
        row.push(field);
        field = '';
    };

    const endRow = () => {
        endField();
        rows.push(row);
        row = [];
    };

    for (let i = 0; i < input.length; i += 1) {
        const char = input[i];

        if (quoted) {
            if (char === '"' && input[i + 1] === '"') {
                field += '"';
                i += 1;
            } else if (char === '"') {
                quoted = false;
            } else {
                field += char;
            }
            // eslint-disable-next-line no-continue
            continue;
        }

        if (char === '"') quoted = true;
        else if (char === ',') endField();
        else if (char === '\n') endRow();
        else if (char !== '\r') field += char;
    }

    if (field !== '' || row.length > 0) endRow();

    return rows;
};
