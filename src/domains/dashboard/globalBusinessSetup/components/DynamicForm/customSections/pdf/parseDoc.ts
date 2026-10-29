// Parse the generated document body HTML (from moaTemplate/aoaTemplate) into a flat
// list of blocks so it can be rendered to a react-pdf document — keeping a single
// content source (the HTML templates) for both the preview and the PDF.

export type DocBlock =
    | { type: 'title' | 'subtitle' | 'meta' | 'note' | 'draft' | 'heading' | 'para'; text: string }
    | { type: 'list'; items: string[] };

const ENTITIES: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&middot;': '·',
    '&nbsp;': ' ',
};

const decode = (value: string) => value.replace(/&[a-z]+;/gi, match => ENTITIES[match] ?? match);

// Strip tags to text, turning <br> into line breaks and </p> into paragraph breaks.
// Collapse raw whitespace (incl. source-code newlines) to single spaces FIRST, so
// only the intentional <br>/</p> breaks survive — otherwise prose wraps early
// (leaving blank space) instead of flowing to the page margin.
const toText = (html: string) =>
    decode(
        html
            .replace(/\s+/g, ' ')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]+>/g, '')
    )
        .replace(/[ \t]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

const classOf = (attrs: string) => attrs.match(/class="([^"]*)"/)?.[1] ?? '';

const ELEMENT_RE = /<(h1|h2|div|p|ol)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const LI_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

export const parseDoc = (bodyHtml: string): DocBlock[] => {
    const blocks: DocBlock[] = [];
    const elementRe = new RegExp(ELEMENT_RE);
    let match = elementRe.exec(bodyHtml);

    while (match !== null) {
        const [, tag, attrs, inner] = match;

        if (tag === 'ol') {
            const items: string[] = [];
            const liRe = new RegExp(LI_RE);
            let li = liRe.exec(inner);

            while (li !== null) {
                items.push(toText(li[1]));
                li = liRe.exec(inner);
            }

            blocks.push({ type: 'list', items: items.filter(Boolean) });
        } else {
            const text = toText(inner);

            if (text) {
                const cls = classOf(attrs);

                if (tag === 'h1') blocks.push({ type: 'title', text });
                else if (tag === 'h2') blocks.push({ type: 'heading', text });
                else if (tag === 'div')
                    blocks.push({ type: cls.includes('draft') ? 'draft' : 'para', text });
                else if (cls.includes('center') && cls.includes('muted'))
                    blocks.push({ type: 'meta', text });
                else if (cls.includes('center')) blocks.push({ type: 'subtitle', text });
                else if (cls.includes('muted')) blocks.push({ type: 'note', text });
                else blocks.push({ type: 'para', text });
            }
        }

        match = elementRe.exec(bodyHtml);
    }

    return blocks;
};
