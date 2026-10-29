// Shared helpers for building self-styled HTML documents (used by custom-section
// components for the new-tab preview and as input to the PDF generator).

const ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
};

export const escapeHtml = (value: unknown) =>
    String(value ?? '').replace(/[&<>"]/g, ch => ESCAPE_MAP[ch]);

export const BLANK = '____________';

// Read the first non-empty value among the given keys, else a fallback placeholder.
export const pick = (data: Record<string, unknown>, keys: string[], fallback: string) => {
    const found = keys.find(key => {
        const value = data[key];

        return value !== undefined && value !== null && String(value).trim() !== '';
    });

    return found !== undefined ? String(data[found]) : fallback;
};

const DOC_STYLES = `body{font-family:Georgia,'Times New Roman',serif;color:#1f2937;line-height:1.6;padding:24px;margin:0}
h1{text-align:center;font-size:20px;text-transform:uppercase;letter-spacing:1px}
h2{font-size:15px;margin-top:28px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
ol{padding-left:22px}li{margin:6px 0}.muted{color:#6b7280;font-size:13px}
.center{text-align:center}.mt{margin-top:28px}
.draft{border:1px solid #f59e0b;background:#fffbeb;color:#92400e;font-size:12px;padding:10px 14px;margin:18px 0;border-radius:6px}
.subscriber p{margin:12px 0}`;

// Wrap a document body into a full, self-styled HTML page.
export const wrapDocument = (title: string, body: string): string =>
    `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title><style>${DOC_STYLES}</style></head><body>${body}</body></html>`;

// Open the rendered document in a new browser tab/window for viewing (no printing).
export const openDocument = (title: string, body: string) => {
    const win = window.open('', '_blank', 'width=840,height=1000');

    if (!win) return;

    win.document.write(wrapDocument(title, body));
    win.document.close();
    win.focus();
};
