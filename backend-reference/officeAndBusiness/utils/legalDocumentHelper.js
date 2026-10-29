'use strict';

const PizZip = require('pizzip');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');

exports.fetchBuffer = async (url) => {
    const https = require('https');
    const http = require('http');
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
};

const fixSplitTags = (xml) => {
    let result = xml;
    let prev;
    do {
        prev = result;
        result = result.replace(
            /(<w:t(?:[^>]*)>[^<]*\{\{[^}<]*)<\/w:t><\/w:r>(?:<w:proofErr[^/]*\/>|<w:bookmarkStart[^/]*\/>|<w:bookmarkEnd[^/]*\/>)*<w:r(?:[^>]*)>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t(?:[^>]*)>([^<]*)/g,
            '$1$2'
        );
    } while (result !== prev);
    return result;
};

exports.fillDocxBuffer = (docBuffer) => {
    const zip = new PizZip(docBuffer);
    const docXml = zip.file('word/document.xml');
    if (docXml) {
        let xmlContent = docXml.asText();
        xmlContent = xmlContent.replace(/<w:del\b[^>]*>[\s\S]*?<\/w:del>/g, '');
        xmlContent = xmlContent.replace(/<\/?w:ins\b[^>]*>/g, '');
        xmlContent = fixSplitTags(xmlContent);
        zip.file('word/document.xml', xmlContent);
    }
    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
};

const convertTabs = (element) => {
    if (Array.isArray(element.children)) {
        element = { ...element, children: element.children.map(convertTabs) };
    }
    if (element.type === 'tab') return { type: 'text', value: '  ' };
    return element;
};

const ALIGN_STYLE_MAP = [
    "p[style-name='p-center'] => p.align-center:fresh",
    "p[style-name='p-right'] => p.align-right:fresh",
    "p[style-name='p-justify'] => p.align-justify:fresh",
    "p[style-name='H1-center'] => h1.align-center:fresh",
    "p[style-name='H2-center'] => h2.align-center:fresh",
    "p[style-name='H3-center'] => h3.align-center:fresh",
    "p[style-name='H1-right'] => h1.align-right:fresh",
    "p[style-name='H2-right'] => h2.align-right:fresh",
    "p[style-name='H3-right'] => h3.align-right:fresh",
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
];

// Reads word/styles.xml and returns a map of styleId → alignment, following basedOn inheritance.
const buildStyleAlignments = (zip) => {
    const file = zip.file('word/styles.xml');
    if (!file) return {};
    const xml = file.asText();
    const raw = {};
    const re = /<w:style\b[^>]*\bw:styleId="([^"]+)"[^>]*>([\s\S]*?)<\/w:style>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
        const jc  = /<w:jc\s+w:val="([^"]+)"/.exec(m[2]);
        const bas = /<w:basedOn\s+w:val="([^"]+)"/.exec(m[2]);
        raw[m[1]] = { align: jc ? jc[1] : null, basedOn: bas ? bas[1] : null };
    }
    const resolve = (id, seen = new Set()) => {
        if (!id || seen.has(id) || !raw[id]) return null;
        seen.add(id);
        return raw[id].align || resolve(raw[id].basedOn, seen);
    };
    const out = {};
    for (const id of Object.keys(raw)) { const a = resolve(id); if (a) out[id] = a; }
    return out;
};

// Strips HTML tags, collapses whitespace, lowercases, and caps at 60 chars for map lookups.
const normText = (str) =>
    str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 60);

// Reads word/document.xml + styles.xml and returns Map<normalizedText, alignment>
// for all paragraphs that are non-left-aligned.
const buildAlignmentMap = (cleanedBuffer) => {
    try {
        const zip = new PizZip(cleanedBuffer);
        const styleAligns = buildStyleAlignments(zip);
        const docFile = zip.file('word/document.xml');
        if (!docFile) return new Map();
        const dxml = docFile.asText();
        const map = new Map();
        const pRe = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
        let pm;
        while ((pm = pRe.exec(dxml)) !== null) {
            const pXml = pm[1];
            const jc = /<w:jc\s+w:val="([^"]+)"/.exec(pXml);
            let align = jc ? jc[1] : null;
            if (!align) {
                const ps = /<w:pStyle\s+w:val="([^"]+)"/.exec(pXml);
                if (ps) align = styleAligns[ps[1]] || null;
            }
            if (!align || align === 'left') continue;
            const effectiveAlign = align === 'both' ? 'justify' : align;
            const texts = [];
            const tRe = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
            let tm;
            while ((tm = tRe.exec(pXml)) !== null) texts.push(tm[1]);
            const key = normText(texts.join(''));
            if (key && !map.has(key)) map.set(key, effectiveAlign);
        }
        return map;
    } catch (e) {
        console.error('[legalDoc] buildAlignmentMap error:', e.message);
        return new Map();
    }
};

// OOXML numFmt → CSS list-style-type
const NUM_FMT_TO_CSS = {
    decimal: 'decimal',
    lowerRoman: 'lower-roman',
    upperRoman: 'upper-roman',
    lowerLetter: 'lower-alpha',
    upperLetter: 'upper-alpha',
    lowerLatin: 'lower-alpha',
    upperLatin: 'upper-alpha',
    bullet: 'disc',
    none: 'none',
};

// Parses word/numbering.xml and returns Map<numId, { [ilvl]: cssFormat }>.
const buildNumberingMap = (zip) => {
    const file = zip.file('word/numbering.xml');
    if (!file) return new Map();
    const xml = file.asText();

    const abstractNums = {};
    const abRe = /<w:abstractNum\b[^>]*\bw:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g;
    let am;
    while ((am = abRe.exec(xml)) !== null) {
        const abstractId = am[1];
        const body = am[2];
        const levels = {};
        const lvlRe = /<w:lvl\b[^>]*\bw:ilvl="(\d+)"[^>]*>([\s\S]*?)<\/w:lvl>/g;
        let lm;
        while ((lm = lvlRe.exec(body)) !== null) {
            const ilvl = parseInt(lm[1], 10);
            const fmtMatch = /<w:numFmt\s+w:val="([^"]+)"/.exec(lm[2]);
            if (fmtMatch) levels[ilvl] = NUM_FMT_TO_CSS[fmtMatch[1]] || 'decimal';
        }
        abstractNums[abstractId] = levels;
    }

    const numMap = new Map();
    const numRe = /<w:num\b[^>]*\bw:numId="(\d+)"[^>]*>([\s\S]*?)<\/w:num>/g;
    let nm;
    while ((nm = numRe.exec(xml)) !== null) {
        const numId = nm[1];
        const body = nm[2];
        const abMatch = /<w:abstractNumId\s+w:val="(\d+)"/.exec(body);
        if (!abMatch) continue;
        const levels = { ...abstractNums[abMatch[1]] || {} };
        const ovRe = /<w:lvlOverride\b[^>]*\bw:ilvl="(\d+)"[^>]*>([\s\S]*?)<\/w:lvlOverride>/g;
        let om;
        while ((om = ovRe.exec(body)) !== null) {
            const ilvl = parseInt(om[1], 10);
            const fmtMatch = /<w:numFmt\s+w:val="([^"]+)"/.exec(om[2]);
            if (fmtMatch) levels[ilvl] = NUM_FMT_TO_CSS[fmtMatch[1]] || 'decimal';
        }
        numMap.set(numId, levels);
    }
    return numMap;
};

// Reads document.xml and returns an ordered array of { numId, ilvl, cssFormat }
// matching each numbered paragraph in document order.
const buildListOrderFromDoc = (zip, numberingMap) => {
    if (!numberingMap.size) return [];
    const docFile = zip.file('word/document.xml');
    if (!docFile) return [];
    const dxml = docFile.asText();

    const entries = [];
    const pRe = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
    let pm;
    while ((pm = pRe.exec(dxml)) !== null) {
        const pXml = pm[1];
        const numIdM = /<w:numId\s+w:val="(\d+)"/.exec(pXml);
        const ilvlM = /<w:ilvl\s+w:val="(\d+)"/.exec(pXml);
        if (!numIdM || !ilvlM) continue;
        const numId = numIdM[1];
        const ilvl = parseInt(ilvlM[1], 10);
        if (numId === '0') continue;
        const levels = numberingMap.get(numId);
        const cssFormat = levels ? (levels[ilvl] || 'decimal') : 'decimal';
        entries.push({ numId, ilvl, cssFormat });
    }
    return entries;
};

// Walks all <ol>/<ul>/<li> tags in html and returns items in document order.
// Each item has directContent = the text/HTML before any nested <ol>/<ul>.
const flattenListItems = (html) => {
    const items = [];
    const tagRe = /<\/?(?:ol|ul|li)(?:\s[^>]*)?>/gi;
    let olDepth = 0;
    const liStack = [];
    let m;
    while ((m = tagRe.exec(html)) !== null) {
        const tag = m[0];
        const isClose = tag[1] === '/';
        const name = (tag.match(/^<\/?([a-z]+)/i) || [])[1];
        if (!name) continue;
        const n = name.toLowerCase();
        if (!isClose) {
            if (n === 'ol' || n === 'ul') {
                if (liStack.length > 0) {
                    const top = liStack[liStack.length - 1];
                    if (top.directContentEnd === null) top.directContentEnd = m.index;
                }
                olDepth++;
            } else if (n === 'li') {
                liStack.push({ contentStart: m.index + tag.length, olDepthAtStart: olDepth, directContentEnd: null });
            }
        } else {
            if (n === 'ol' || n === 'ul') {
                olDepth = Math.max(0, olDepth - 1);
            } else if (n === 'li' && liStack.length > 0) {
                const frame = liStack.pop();
                const end = frame.directContentEnd !== null ? frame.directContentEnd : m.index;
                items.push({ directContent: html.slice(frame.contentStart, end), _sortKey: frame.contentStart });
            }
        }
    }
    items.sort((a, b) => a._sortKey - b._sortKey);
    items.forEach(item => { delete item._sortKey; });
    return items;
};

// Reconstructs a single <ol> block with correct ilvl-based nesting and list-style-type.
// startCount: number of ilvl=0 items already rendered (for CSS counter continuation).
// levelCounts: items rendered per ilvl since last parent reset (for mid-sub-list continuation).
const rebuildOlBlock = (items, entries, startCount = 0, levelCounts = {}) => {
    if (items.length !== entries.length) return null;

    const mainNumId = entries.find(e => e.ilvl === 0)?.numId;
    const numIdOffsets = {};
    if (mainNumId !== undefined) numIdOffsets[mainNumId] = 0;

    let result = '';
    let depth = -1;
    let outerOlOpened = false;
    // hasLi[d] = true if a <li> was opened at depth d (so close loop knows to emit </li>).
    const hasLi = {};
    // Only apply levelCounts sub-continuation before the first ilvl=0 item.
    let seenZeroInBlock = false;

    for (let i = 0; i < items.length; i++) {
        const { directContent } = items[i];
        const { numId, ilvl: rawIlvl, cssFormat } = entries[i];

        if (numIdOffsets[numId] === undefined) {
            // Align secondary numIds to the current depth; skip remapping if no ilvl=0 anchor.
            numIdOffsets[numId] = mainNumId !== undefined
                ? Math.max(0, depth + 1) - rawIlvl
                : 0;
        }
        const ilvl = rawIlvl + numIdOffsets[numId];

        if (ilvl === 0) seenZeroInBlock = true;

        if (ilvl > depth) {
            while (depth < ilvl) {
                const isOutermost = !outerOlOpened;
                const targetDepth = depth + 1;
                const applyFmt = cssFormat && cssFormat !== 'decimal' && targetDepth === ilvl;
                let olTag;
                if (isOutermost && startCount > 0) {
                    const resetPart = `counter-reset:doc-list ${startCount}`;
                    olTag = applyFmt
                        ? `<ol style="${resetPart};list-style-type:${cssFormat}">`
                        : `<ol style="${resetPart}">`;
                } else {
                    const subCount = !seenZeroInBlock ? (levelCounts[targetDepth] || 0) : 0;
                    const resetPart = subCount > 0 ? `counter-reset:doc-list ${subCount}` : null;
                    olTag = resetPart
                        ? (applyFmt ? `<ol style="${resetPart};list-style-type:${cssFormat}">` : `<ol style="${resetPart}">`)
                        : (applyFmt ? `<ol style="list-style-type:${cssFormat}">` : '<ol>');
                }
                result += olTag;
                outerOlOpened = true;
                depth++;
                // Insert invisible placeholder <li> when opening intermediate levels without content.
                // Keeps HTML valid (<ol> must only contain <li>). .no-count-li hides counter/label.
                if (depth < ilvl) {
                    result += '<li class="no-count-li">';
                    hasLi[depth] = true;
                }
            }
        } else if (ilvl < depth) {
            while (depth > ilvl) {
                result += hasLi[depth] ? '</li></ol>' : '</ol>';
                hasLi[depth] = false;
                depth--;
            }
            if (hasLi[depth]) result += '</li>';
        } else {
            if (depth >= 0 && hasLi[depth]) result += '</li>';
        }
        result += `<li>${directContent}`;
        hasLi[depth] = true;
    }
    while (depth >= 0) {
        result += hasLi[depth] ? '</li></ol>' : '</ol>';
        hasLi[depth] = false;
        depth--;
    }
    return result;
};

// Rewrites mammoth's <ol>/<ul> blocks using the DOCX numbering data so nesting,
// counters, and list-style-type all match the original document.
const applyListStyles = (html, zip) => {
    try {
        const numberingMap = buildNumberingMap(zip);
        if (!numberingMap.size) return html;
        const docEntries = buildListOrderFromDoc(zip, numberingMap);
        if (!docEntries.length) return html;

        // Collect top-level <ol>/<ul> block positions.
        const blocks = [];
        let depth = 0;
        let blockStart = -1;
        let blockTag = null;
        const olRe = /<\/?(ol|ul)\b[^>]*>/gi;
        let m;
        while ((m = olRe.exec(html)) !== null) {
            const isClose = m[0][1] === '/';
            const tag = (m[1] || '').toLowerCase();
            if (!isClose) {
                if (depth === 0) { blockStart = m.index; blockTag = tag; }
                depth++;
            } else {
                depth--;
                if (depth === 0 && blockStart !== -1) {
                    blocks.push({ start: blockStart, end: m.index + m[0].length, type: blockTag });
                    blockStart = -1; blockTag = null;
                }
            }
        }
        if (!blocks.length) return html;

        // numId of the first ilvl=0 item — the main section numbering sequence.
        const mainSectionNumId = docEntries.find(e => e.ilvl === 0)?.numId;

        // Precompute item counts per block and suffix OL totals for <ul> lookahead decisions.
        // <ul> blocks: filter to non-empty directContent only — mammoth sometimes wraps items as
        // <ul><li><ol><li>content</li></ol></li></ul> where the outer <li> is an empty wrapper.
        const blockItemCounts = blocks.map(b => {
            const allItems = flattenListItems(html.slice(b.start, b.end));
            if (b.type === 'ul') {
                return allItems.filter(it => it.directContent.replace(/<[^>]+>/g, '').trim() !== '').length;
            }
            return allItems.length;
        });
        const suffixOlCounts = new Array(blocks.length + 1).fill(0);
        for (let i = blocks.length - 1; i >= 0; i--) {
            suffixOlCounts[i] = suffixOlCounts[i + 1] + (blocks[i].type === 'ol' ? blockItemCounts[i] : 0);
        }

        let result = '';
        let lastEnd = 0;
        let docIdx = 0;
        let topLevelCount = 0; // ilvl=0 items rendered so far, for CSS counter continuation

        // Tracks items rendered per ilvl since the last parent-level reset,
        // so sub-level counters continue correctly across separate <ol> blocks.
        const levelCounts = {};
        const updateLevelCounts = (entries) => {
            for (const entry of entries) {
                const ilvl = entry.ilvl;
                if (ilvl === 0) {
                    Object.keys(levelCounts).forEach(d => { if (parseInt(d) > 0) delete levelCounts[d]; });
                    levelCounts[0] = (levelCounts[0] || 0) + 1;
                } else {
                    levelCounts[ilvl] = (levelCounts[ilvl] || 0) + 1;
                    Object.keys(levelCounts).forEach(d => { if (parseInt(d) > ilvl) delete levelCounts[d]; });
                }
            }
        };

        for (let bi = 0; bi < blocks.length; bi++) {
            const block = blocks[bi];
            result += html.slice(lastEnd, block.start);
            const blockHtml = html.slice(block.start, block.end);

            // <ul> blocks may contain numbered DOCX items mammoth rendered as bullets.
            // Check whether consuming their entries is safe (enough entries remain for future <ol>s),
            // then either inject them into the preceding <ol>'s close sequence (when all are sub-items)
            // or rebuild them as a proper <ol>.
            if (block.type === 'ul') {
                const ulItems = flattenListItems(blockHtml);
                const realItems = ulItems.filter(it => it.directContent.replace(/<[^>]+>/g, '').trim() !== '');
                const itemCount = realItems.length;

                if (itemCount > 0) {
                    const futureTotalOl = suffixOlCounts[bi + 1];
                    const remainingEntries = docEntries.length - docIdx;
                    const consumeValid = (remainingEntries - itemCount) >= futureTotalOl;
                    const noConsumeValid = remainingEntries >= futureTotalOl;

                    const shouldConsume = consumeValid && (
                        !noConsumeValid ||
                        docEntries.slice(docIdx, docIdx + itemCount).some(e => e.cssFormat !== 'disc' && e.cssFormat !== 'none')
                    );

                    if (shouldConsume) {
                        const ulEntries = docEntries.slice(docIdx, docIdx + itemCount);
                        const hasNumberedFormat = ulEntries.some(e => e.cssFormat !== 'disc' && e.cssFormat !== 'none');
                        if (hasNumberedFormat) {
                            const allSubItems = ulEntries.every(e => e.ilvl > 0);
                            if (allSubItems) {
                                // All items are sub-level. Inject into the preceding <ol>'s close
                                // sequence instead of opening a new <ol> — a bare <ol><ol> is invalid
                                // HTML and causes browsers to insert a phantom <li> (ghost counter).
                                // Close sequence is (</li></ol>)^N from innermost to outermost.
                                // To inject at ilvl d: insert after </li> of pair (N-1-d).
                                const PAIR = '</li></ol>';
                                const closeMatch = /((?:<\/li><\/ol>)+)$/.exec(result);
                                if (closeMatch) {
                                    const closeSeq = closeMatch[0];
                                    const N = closeSeq.length / PAIR.length;
                                    for (let k = realItems.length - 1; k >= 0; k--) {
                                        const ilvl = ulEntries[k].ilvl;
                                        const pairIdx = N - 1 - ilvl;
                                        if (pairIdx >= 0 && pairIdx < N) {
                                            const posInClose = pairIdx * PAIR.length + 5;
                                            const newLi = `<li>${realItems[k].directContent}</li>`;
                                            const insertAt = result.length - closeSeq.length + posInClose;
                                            result = result.slice(0, insertAt) + newLi + result.slice(insertAt);
                                        }
                                    }
                                } else {
                                    const rebuilt = rebuildOlBlock(realItems, ulEntries, topLevelCount, levelCounts);
                                    result += rebuilt !== null ? rebuilt : blockHtml;
                                }
                            } else {
                                const rebuilt = rebuildOlBlock(realItems, ulEntries, topLevelCount, levelCounts);
                                result += rebuilt !== null ? rebuilt : blockHtml;
                            }
                            topLevelCount += ulEntries.filter(e => e.ilvl === 0 && e.numId === mainSectionNumId).length;
                            updateLevelCounts(ulEntries);
                        } else {
                            result += blockHtml;
                        }
                        docIdx += itemCount;
                    } else {
                        result += blockHtml;
                    }
                } else {
                    result += blockHtml;
                }
                lastEnd = block.end;
                continue;
            }

            // For <ol> blocks, check the gap between this block and the next.
            // If the gap contains only <p> tags and belongs to the same numbering sequence, inject it:
            //   - Short gap (≤3 paras) or next block continues the section → inside the last <li>.
            //   - Longer gap → as a no-count-li sibling, visually aligned at the sub-item level.
            // Gaps that use a different numId (e.g. DRAFTING NOTES, signature blocks) are left as-is.
            let trailingContent = '';
            let trailingEnd = block.end;
            let subItemGapLi = '';
            if (bi + 1 < blocks.length) {
                const nextBlock = blocks[bi + 1];
                const gapHtml = html.slice(block.end, nextBlock.start);
                const leftover = gapHtml.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, '').replace(/\s+/g, '');
                if (leftover === '' && gapHtml.trim()) {
                    const nextEntryIdx = docIdx + blockItemCounts[bi];
                    const nextFirstEntry = nextEntryIdx < docEntries.length ? docEntries[nextEntryIdx] : null;
                    const nextUsesMainFormat = nextFirstEntry && nextFirstEntry.numId === mainSectionNumId;
                    const nextContinuesSection = nextFirstEntry && nextFirstEntry.ilvl > 0;
                    const paraCount = (gapHtml.match(/<p\b[^>]*>/gi) || []).length;
                    if (nextUsesMainFormat && (nextContinuesSection || paraCount <= 3)) {
                        trailingContent = gapHtml.trim();
                        trailingEnd = nextBlock.start;
                    } else if (nextUsesMainFormat && paraCount > 3) {
                        subItemGapLi = gapHtml.trim();
                        trailingEnd = nextBlock.start;
                    }
                }
            }

            const items = flattenListItems(blockHtml);
            const blockEntries = docEntries.slice(docIdx, docIdx + items.length);
            let rebuilt = null;
            if (blockEntries.length === items.length) {
                rebuilt = rebuildOlBlock(items, blockEntries, topLevelCount, levelCounts);
            }
            if (rebuilt !== null) {
                if (trailingContent) {
                    const closeSeqMatch = /((?:<\/li><\/ol>)+)$/.exec(rebuilt);
                    if (closeSeqMatch) {
                        const insertAt = rebuilt.length - closeSeqMatch[0].length;
                        rebuilt = rebuilt.slice(0, insertAt) + trailingContent + rebuilt.slice(insertAt);
                    }
                }
                result += rebuilt;
                topLevelCount += blockEntries.filter(e => e.ilvl === 0 && e.numId === mainSectionNumId).length;
                updateLevelCounts(blockEntries);
                if (subItemGapLi) {
                    const PAIR = '</li></ol>';
                    const closeMatch = /((?:<\/li><\/ol>)+)$/.exec(result);
                    if (closeMatch && closeMatch[0].length >= 2 * PAIR.length) {
                        const posInClose = 5;
                        const newLi = `<li class="no-count-li">${subItemGapLi}</li>`;
                        const insertAt = result.length - closeMatch[0].length + posInClose;
                        result = result.slice(0, insertAt) + newLi + result.slice(insertAt);
                    }
                }
            } else {
                result += blockHtml;
            }
            docIdx += items.length;
            lastEnd = trailingEnd;
        }
        result += html.slice(lastEnd);
        return result;
    } catch (e) {
        console.error('[legalDoc] fixListNesting error:', e.message);
        return html;
    }
};

// Applies alignment classes to HTML paragraphs by matching normalized text against the alignment map.
const applyAlignmentsByContent = (html, alignmentMap) => {
    if (!alignmentMap.size) return html;
    return html.replace(/<(p|h[1-6])(\s[^>]*)?>[\s\S]*?<\/(p|h[1-6])>/gi, (match, openTag, attrs) => {
        const key = normText(match);
        if (!key) return match;
        const align = alignmentMap.get(key);
        if (!align) return match;
        return match.replace(new RegExp(`^<${openTag}(\\s[^>]*)?>`), `<${openTag}${attrs || ''} style="text-align:${align};">`);
    });
};

exports.generatePdf = async (documentUrl, editorHtml = null) => {
    let html;
    if (editorHtml) {
        html = editorHtml;
    } else {
        const docBuffer = await exports.fetchBuffer(documentUrl);
        const cleanedBuffer = exports.fillDocxBuffer(docBuffer);
        const alignmentMap = buildAlignmentMap(cleanedBuffer);
        const zip = new PizZip(cleanedBuffer);
        ({ value: html } = await mammoth.convertToHtml({ buffer: cleanedBuffer }, { transformDocument: convertTabs, styleMap: ALIGN_STYLE_MAP }));
        html = applyListStyles(html, zip);
        html = applyAlignmentsByContent(html, alignmentMap);
    }
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 60px; line-height: 1.6; color: #000; }
        p { margin: 0 0 8pt 0; }
        h1, h2, h3 { margin: 12pt 0 6pt 0; }
        .align-center { text-align: center; }
        .align-right { text-align: right; }
        .align-justify { text-align: justify; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ccc; padding: 6px; }
        ul { list-style-type: disc; padding-left: 1.5em; }
        ul li { margin: 2px 0; }
        /* Multi-level decimal numbering: 1. / 1.1 / 1.1.1 */
        ol { list-style: none; counter-reset: doc-list; padding-left: 4em; margin: 0; }
        ol > li { display: block; position: relative; margin: 2px 0; counter-increment: doc-list; }
        ol > li::before { content: counters(doc-list, ".") ". "; position: absolute; left: -4em; width: 3.5em; text-align: right; padding-right: 0.5em; white-space: nowrap; box-sizing: border-box; }
        ol > li > p { margin: 0; }
        /* Invisible placeholder <li> — no counter increment, no label */
        ol > li.no-count-li { counter-increment: none; list-style: none; padding: 0; margin: 0; }
        ol > li.no-count-li::before { content: none; }
        /* Roman numeral level */
        ol[style*="lower-roman"] { counter-reset: roman-list; }
        ol[style*="lower-roman"] > li { counter-increment: roman-list; }
        ol[style*="lower-roman"] > li::before { content: counter(roman-list, lower-roman) ". "; }
        /* Alpha level (a, b, c) */
        ol[style*="lower-alpha"] { counter-reset: alpha-list; }
        ol[style*="lower-alpha"] > li { counter-increment: alpha-list; }
        ol[style*="lower-alpha"] > li::before { content: counter(alpha-list, lower-alpha) ". "; }
        @media print { .page-break { break-before: page; } }
    </style></head><body>${html}</body></html>`;
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
        return await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' } });
    } finally {
        await browser.close();
    }
};

exports.fetchHtmlFromDocx = async (url) => {
    const docBuffer = await exports.fetchBuffer(url);
    const cleanedBuffer = exports.fillDocxBuffer(docBuffer);
    const alignmentMap = buildAlignmentMap(cleanedBuffer);
    const zip = new PizZip(cleanedBuffer);
    const { value: rawHtml } = await mammoth.convertToHtml({ buffer: cleanedBuffer }, { transformDocument: convertTabs, styleMap: ALIGN_STYLE_MAP });
    const withLists = applyListStyles(rawHtml, zip);
    return applyAlignmentsByContent(withLists, alignmentMap);
};
