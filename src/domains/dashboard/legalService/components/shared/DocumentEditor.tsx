import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';

import {
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    AlignLeftOutlined,
    AlignCenterOutlined,
    AlignRightOutlined,
    UnorderedListOutlined,
    MinusOutlined,
    PlusOutlined,
    CloseOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import Highlight from '@tiptap/extension-highlight';
import { OrderedList } from '@tiptap/extension-ordered-list';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { useEditor, EditorContent, Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, DatePicker, Divider, Flex, Input, Modal, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

// OrderedList extended to preserve list-style-type and counter-reset from DOCX numbering
const CustomOrderedList = OrderedList.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            listStyleType: {
                default: null,
                parseHTML: (element: HTMLElement) => element.style.listStyleType || null,
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.listStyleType) return {};
                    return { style: `list-style-type:${attributes.listStyleType}` };
                },
            },
            counterStart: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    const style = element.getAttribute('style') || '';
                    const m = /counter-reset\s*:\s*doc-list\s+(\d+)/.exec(style);
                    return m ? parseInt(m[1], 10) : null;
                },
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (attributes.counterStart == null) return {};
                    return { style: `counter-reset:doc-list ${attributes.counterStart}` };
                },
            },
        };
    },
});

// Yellow atom node for unfilled {{placeholder}}
const PlaceholderNode = Node.create({
    name: 'placeholderTag',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    addAttributes() {
        return { label: { default: '' } };
    },
    parseHTML() {
        return [
            {
                tag: 'span[data-ph="true"]',
                getAttrs: el => ({ label: (el as HTMLElement).textContent }),
            },
        ];
    },
    renderHTML({ node }) {
        return [
            'span',
            mergeAttributes({
                'data-ph': 'true',
                contenteditable: 'false',
                style: 'background:#FEF3C7;padding:2px 6px;border-radius:4px;font-weight:600;color:#92400E;cursor:pointer;user-select:none;',
            }),
            node.attrs.label,
        ];
    },
    addKeyboardShortcuts() {
        const block = () => {
            const { state } = this.editor;
            const { selection } = state;
            if ((selection as any).node?.type.name === 'placeholderTag') return true;
            if (selection.$from.nodeBefore?.type.name === 'placeholderTag') return true;
            if (selection.$from.nodeAfter?.type.name === 'placeholderTag') return true;
            if (selection.from !== selection.to) {
                let found = false;
                state.doc.nodesBetween(selection.from, selection.to, node => {
                    if (node.type.name === 'placeholderTag') {
                        found = true;
                        return false;
                    }
                    return true;
                });
                if (found) return true;
            }
            return false;
        };
        return { Backspace: block, Delete: block };
    },
});

// Green atom node for filled placeholder values — clickable to edit again
const FilledPlaceholderNode = Node.create({
    name: 'filledPlaceholderTag',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    addAttributes() {
        return {
            value: { default: '' },
            inputType: { default: 'text' },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span[data-ph-filled="true"]',
                getAttrs: el => ({
                    value: (el as HTMLElement).textContent,
                    inputType: (el as HTMLElement).getAttribute('data-input-type') ?? 'text',
                }),
            },
        ];
    },
    renderHTML({ node }) {
        return [
            'span',
            mergeAttributes({
                'data-ph-filled': 'true',
                'data-input-type': node.attrs.inputType,
                contenteditable: 'false',
                style: 'background:#D1FAE5;padding:2px 6px;border-radius:4px;font-weight:500;color:#065F46;cursor:pointer;user-select:none;',
            }),
            node.attrs.value,
        ];
    },
    addKeyboardShortcuts() {
        const block = () => {
            const { state } = this.editor;
            const { selection } = state;
            if ((selection as any).node?.type.name === 'filledPlaceholderTag') return true;
            if (selection.$from.nodeBefore?.type.name === 'filledPlaceholderTag') return true;
            if (selection.$from.nodeAfter?.type.name === 'filledPlaceholderTag') return true;
            if (selection.from !== selection.to) {
                let found = false;
                state.doc.nodesBetween(selection.from, selection.to, node => {
                    if (node.type.name === 'filledPlaceholderTag') {
                        found = true;
                        return false;
                    }
                    return true;
                });
                if (found) return true;
            }
            return false;
        };
        return { Backspace: block, Delete: block };
    },
});

const wrapPlaceholders = (html: string) =>
    html.replace(/\{\{((?:[^}]|<[^>]+>)*?)\}\}/g, (_, content) => {
        const text = content.replace(/<[^>]+>/g, '').trim();
        if (!text || text.toLowerCase() === 'insert') return `{{${text}}}`;
        return `<span data-ph="true">{{${text}}}</span>`;
    });

// Strip both placeholder spans and filled spans before saving.
// Filled spans keep data-ph-filled + data-input-type so parseHTML can recreate the node on re-edit.
const unwrapAll = (html: string) =>
    html
        .replace(/<span[^>]*data-ph="true"[^>]*>([\s\S]*?)<\/span>/g, '$1')
        .replace(
            /<span([^>]*)data-ph-filled="true"([^>]*)>([\s\S]*?)<\/span>/g,
            (_, before, after, content) => {
                const m = /data-input-type="([^"]*)"/.exec(before + after);
                const inputType = m ? ` data-input-type="${m[1]}"` : '';
                return `<span data-ph-filled="true"${inputType} style="font-weight:bold">${content}</span>`;
            }
        );

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const DEFAULT_SIZE = 12;

// A4 dimensions in pixels at 96dpi
const A4_W_PX = 794;
const A4_H_PX = 1122;
const THUMB_SCALE = 120 / A4_W_PX; // ~0.151
const THUMB_W = Math.round(A4_W_PX * THUMB_SCALE); // 120
const THUMB_H = Math.round(A4_H_PX * THUMB_SCALE); // ~169

export interface DocumentEditorHandle {
    getHtml: () => string;
    hasUnfilledPlaceholders: () => boolean;
}

type InputType = 'text' | 'date' | 'email';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const detectInputType = (label: string): InputType => {
    const trimmed = label.trim();
    // Multi-sentence or long blocks are malformed/merged placeholder content, not real form fields — skip detection.
    if (trimmed.length > 60 || /[.!?]\s+\S/.test(trimmed)) return 'text';
    if (/date/i.test(trimmed)) return 'date';
    if (/email/i.test(trimmed)) return 'email';
    return 'text';
};

const DATE_FORMAT = 'DD/MM/YY';

interface PopoverState {
    open: boolean;
    inputValue: string;
    inputType: InputType;
    dateValue: Dayjs | null;
    from: number;
    to: number;
    x: number;
    y: number;
}

interface Props {
    initialHtml: string;
    readOnly?: boolean;
    onChange?: (html: string) => void;
}

const DocumentEditor = forwardRef<DocumentEditorHandle, Props>(
    ({ initialHtml, readOnly = false, onChange }, ref) => {
        const [fontSize, setFontSize] = useState(DEFAULT_SIZE);
        const [emailError, setEmailError] = useState('');
        const [popover, setPopover] = useState<PopoverState>({
            open: false,
            inputValue: '',
            inputType: 'text',
            dateValue: null,
            from: 0,
            to: 0,
            x: 0,
            y: 0,
        });
        const [thumbHtml, setThumbHtml] = useState(wrapPlaceholders(initialHtml || '<p></p>'));
        const [pageCount, setPageCount] = useState(1);
        const inputRef = useRef<any>(null);
        const isMountedRef = useRef(false);
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const paperRef = useRef<HTMLDivElement>(null);

        const editor = useEditor({
            extensions: [
                StarterKit.configure({ orderedList: false }),
                CustomOrderedList,
                Underline,
                TextStyle,
                FontSize,
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                Highlight.configure({ multicolor: true }),
                PlaceholderNode,
                FilledPlaceholderNode,
            ],
            content: wrapPlaceholders(initialHtml || '<p></p>'),
            editable: !readOnly,
            onCreate: ({ editor: e }) => {
                setThumbHtml(e.getHTML());
            },
            onUpdate: ({ editor: e }) => {
                if (!isMountedRef.current) {
                    isMountedRef.current = true;
                    return;
                }
                onChange?.(unwrapAll(e.getHTML()));
                setThumbHtml(e.getHTML());
            },
            onSelectionUpdate: ({ editor: e }) => {
                const attrs = e.getAttributes('textStyle');
                if (attrs.fontSize) {
                    const parsed = parseInt(attrs.fontSize, 10);
                    if (!Number.isNaN(parsed)) setFontSize(parsed);
                }
            },
        });

        useImperativeHandle(ref, () => ({
            getHtml: () => (editor ? unwrapAll(editor.getHTML()) : ''),
            hasUnfilledPlaceholders: () => {
                if (!editor) return false;
                let found = false;
                editor.state.doc.descendants(node => {
                    if (node.type.name === 'placeholderTag') {
                        found = true;
                        return false;
                    }
                    return true;
                });
                return found;
            },
        }));

        useEffect(() => {
            const el = paperRef.current;
            if (!el) return undefined;
            const ro = new ResizeObserver(entries => {
                const h = entries[0]?.contentRect.height ?? 0;
                setPageCount(Math.max(1, Math.ceil(h / A4_H_PX)));
            });
            ro.observe(el);
            return () => {
                ro.disconnect();
            };
        }, []);

        const scrollToPage = (pageIndex: number) => {
            if (!scrollContainerRef.current) return;
            scrollContainerRef.current.scrollTop = 32 + pageIndex * A4_H_PX;
        };

        const handleEditorClick = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                if (readOnly || !editor) return;
                const target = e.target as HTMLElement;

                const isUnfilled = !!target.getAttribute('data-ph');
                const isFilled = !!target.getAttribute('data-ph-filled');
                if (!isUnfilled && !isFilled) return;

                const { view } = editor;
                const pos = view.posAtDOM(target, 0);
                const { nodeAfter } = view.state.doc.resolve(pos);
                const nodeSize = nodeAfter?.nodeSize ?? target.textContent?.length ?? 0;
                const rect = target.getBoundingClientRect();

                const label = target.textContent ?? '';
                const currentValue = isFilled ? label : '';
                // For unfilled: detect from label. For filled: read stored inputType from DOM attribute.
                const inputType: InputType = isFilled
                    ? ((target.getAttribute('data-input-type') as InputType) ?? 'text')
                    : detectInputType(label);
                const dateValue =
                    inputType === 'date' && currentValue ? dayjs(currentValue, DATE_FORMAT) : null;
                setPopover({
                    open: true,
                    inputValue: currentValue,
                    inputType,
                    dateValue,
                    from: pos,
                    to: pos + nodeSize,
                    x: rect.left,
                    y: rect.bottom + 8,
                });
                setTimeout(() => inputRef.current?.focus(), 50);
            },
            [editor, readOnly]
        );

        const confirmReplacement = useCallback(() => {
            if (!editor || !popover.inputValue.trim()) {
                setPopover(p => ({ ...p, open: false }));
                return;
            }
            const value = popover.inputValue.trim();
            const { inputType } = popover;

            if (inputType === 'email' && !emailRegex.test(value)) {
                setEmailError('Please enter a valid email ID');
                return;
            }
            setEmailError('');

            // If filling an unfilled placeholder: auto-fill all unfilled instances with the same label.
            // If editing an already-filled placeholder: only update that specific instance.
            const clickedNode = editor.state.doc.nodeAt(popover.from);
            const isUnfilled = clickedNode?.type.name === 'placeholderTag';
            const matches: { from: number; to: number }[] = [];
            if (isUnfilled) {
                const label = (clickedNode?.attrs.label ?? '').toLowerCase();
                editor.state.doc.descendants((node, pos) => {
                    if (
                        node.type.name === 'placeholderTag' &&
                        node.attrs.label.toLowerCase() === label
                    ) {
                        matches.push({ from: pos, to: pos + node.nodeSize });
                    }
                    return true;
                });
            } else {
                matches.push({ from: popover.from, to: popover.to });
            }

            // Replace right-to-left so positions don't shift
            const sorted = matches.sort((a, b) => b.from - a.from);
            let chain = editor.chain().focus();
            sorted.forEach(({ from, to }) => {
                chain = chain
                    .setTextSelection({ from, to })
                    .deleteSelection()
                    .insertContentAt(from, {
                        type: 'filledPlaceholderTag',
                        attrs: { value, inputType },
                    });
            });
            chain.run();
            setPopover({
                open: false,
                inputValue: '',
                inputType: 'text',
                dateValue: null,
                from: 0,
                to: 0,
                x: 0,
                y: 0,
            });
        }, [editor, popover]);

        if (!editor) return null;

        const applySize = (size: number) => {
            const s = Math.max(8, Math.min(72, size));
            setFontSize(s);
            editor.chain().focus().setFontSize(`${s}pt`).run();
        };

        const decrement = () => {
            const idx = FONT_SIZES.indexOf(fontSize);
            applySize(idx > 0 ? FONT_SIZES[idx - 1] : Math.max(8, fontSize - 1));
        };

        const increment = () => {
            const idx = FONT_SIZES.indexOf(fontSize);
            applySize(
                idx !== -1 && idx < FONT_SIZES.length - 1
                    ? FONT_SIZES[idx + 1]
                    : Math.min(72, fontSize + 1)
            );
        };

        const btn = (active: boolean) =>
            `!h-9 !w-9 !p-0 !flex !items-center !justify-center !rounded !text-base ${
                active
                    ? '!bg-red-50 !border-[#FF3A3A] !text-black'
                    : '!border-stone-200 !text-black hover:!border-[#FF3A3A] hover:!text-black'
            }`;

        return (
            <Flex
                vertical
                className="rounded-xl outline outline-1 outline-stone-200"
                style={{ height: 'calc(100vh - 160px)' }}
            >
                <style>{`
                .doc-editor-content ul, .doc-thumb-content ul { list-style-type: disc; padding-left: 1.5em; }
                .doc-editor-content ul li, .doc-thumb-content ul li { margin: 2px 0; }
                .doc-editor-content ol, .doc-thumb-content ol { list-style: none; counter-reset: doc-list; padding-left: 4em; margin: 0; }
                .doc-editor-content ol > li, .doc-thumb-content ol > li { display: block; position: relative; margin: 2px 0; counter-increment: doc-list; }
                .doc-editor-content ol > li::before, .doc-thumb-content ol > li::before { content: counters(doc-list, ".") ". "; position: absolute; left: -4em; width: 3.5em; text-align: right; padding-right: 0.5em; white-space: nowrap; box-sizing: border-box; }
                .doc-editor-content ol > li > p, .doc-thumb-content ol > li > p { margin: 0; }
                .doc-editor-content ol[style*="lower-roman"], .doc-thumb-content ol[style*="lower-roman"] { counter-reset: roman-list; }
                .doc-editor-content ol[style*="lower-roman"] > li, .doc-thumb-content ol[style*="lower-roman"] > li { counter-increment: roman-list; }
                .doc-editor-content ol[style*="lower-roman"] > li::before, .doc-thumb-content ol[style*="lower-roman"] > li::before { content: counter(roman-list, lower-roman) ". "; }
                .doc-editor-content ol[style*="lower-alpha"], .doc-thumb-content ol[style*="lower-alpha"] { counter-reset: alpha-list; }
                .doc-editor-content ol[style*="lower-alpha"] > li, .doc-thumb-content ol[style*="lower-alpha"] > li { counter-increment: alpha-list; }
                .doc-editor-content ol[style*="lower-alpha"] > li::before, .doc-thumb-content ol[style*="lower-alpha"] > li::before { content: counter(alpha-list, lower-alpha) ". "; }
                .doc-editor-content ol > li.no-count-li, .doc-thumb-content ol > li.no-count-li { counter-increment: none; list-style: none; padding: 0; margin: 0; }
                .doc-editor-content ol > li.no-count-li::before, .doc-thumb-content ol > li.no-count-li::before { content: none; }
                .doc-editor-content p, .doc-thumb-content p { margin: 0 0 8pt 0; }
                .doc-editor-content .page-break, .doc-thumb-content .page-break {
                    border-top: 2px dashed #d1d5db;
                    margin: 24px 0;
                    position: relative;
                }
                .doc-editor-content .page-break::after, .doc-thumb-content .page-break::after {
                    content: 'Page Break';
                    position: absolute;
                    top: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #f9fafb;
                    padding: 0 8px;
                    font-size: 11px;
                    color: #9ca3af;
                    font-family: sans-serif;
                }
                .doc-editor-content .ProseMirror { outline: none; }
            `}</style>

                {!readOnly && (
                    <Flex
                        wrap
                        align="center"
                        gap={4}
                        className="px-3 py-2 border-b border-stone-200 bg-white rounded-t-xl flex-shrink-0"
                    >
                        <div className="flex items-center border border-stone-200 rounded-[64px] overflow-hidden h-8">
                            <button
                                type="button"
                                onClick={decrement}
                                className="w-7 h-full flex items-center justify-center text-black hover:bg-stone-100 transition-colors text-sm select-none"
                            >
                                <MinusOutlined style={{ fontSize: 10 }} />
                            </button>
                            <input
                                type="number"
                                value={fontSize}
                                min={8}
                                max={72}
                                onChange={e => applySize(Number(e.target.value))}
                                className="w-14 h-full text-center text-sm border-x border-stone-200 outline-none focus:bg-red-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 bg-white text-gray-700"
                            />
                            <button
                                type="button"
                                onClick={increment}
                                className="w-7 h-full flex items-center justify-center text-black hover:bg-stone-100 transition-colors text-sm select-none"
                            >
                                <PlusOutlined style={{ fontSize: 10 }} />
                            </button>
                        </div>

                        <Divider type="vertical" className="!h-5 !mx-1 !border-stone-200" />
                        <Button
                            size="small"
                            className={btn(editor.isActive('bold'))}
                            icon={<BoldOutlined />}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                        />
                        <Button
                            size="small"
                            className={btn(editor.isActive('italic'))}
                            icon={<ItalicOutlined />}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                        />
                        <Button
                            size="small"
                            className={btn(editor.isActive('underline'))}
                            icon={<UnderlineOutlined />}
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                        />

                        <Divider type="vertical" className="!h-5 !mx-1 !border-stone-200" />
                        <Button
                            size="small"
                            className={btn(editor.isActive({ textAlign: 'left' }))}
                            icon={<AlignLeftOutlined />}
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        />
                        <Button
                            size="small"
                            className={btn(editor.isActive({ textAlign: 'center' }))}
                            icon={<AlignCenterOutlined />}
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        />
                        <Button
                            size="small"
                            className={btn(editor.isActive({ textAlign: 'right' }))}
                            icon={<AlignRightOutlined />}
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        />

                        <Divider type="vertical" className="!h-5 !mx-1 !border-stone-200" />
                        <Button
                            size="small"
                            className={btn(editor.isActive('bulletList'))}
                            icon={<UnorderedListOutlined />}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                        />
                    </Flex>
                )}

                {/* Row: page thumbnail sidebar + document body */}
                <Flex className="flex-1 overflow-hidden rounded-b-xl">
                    {/* Left sidebar — page thumbnails */}
                    <div
                        className="overflow-y-auto bg-white border-r border-stone-200 flex-shrink-0 py-4"
                        style={{ width: 152 }}
                    >
                        {Array.from({ length: pageCount }, (_, i) => (
                            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                            <div
                                key={i}
                                onClick={() => scrollToPage(i)}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <div
                                    style={{
                                        width: THUMB_W,
                                        height: THUMB_H,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        outline: '1.5px solid #e5e7eb',
                                        borderRadius: 2,
                                        background: '#fff',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                    }}
                                >
                                    <div
                                        className="doc-thumb-content"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            transformOrigin: '0 0',
                                            transform: `scale(${THUMB_SCALE}) translateY(-${i * A4_H_PX}px)`,
                                            width: A4_W_PX,
                                            fontFamily: '"Times New Roman", serif',
                                            fontSize: '12pt',
                                            lineHeight: 1.6,
                                            color: '#111',
                                            padding: '20mm 25mm',
                                            pointerEvents: 'none',
                                        }}
                                        // eslint-disable-next-line react/no-danger
                                        dangerouslySetInnerHTML={{ __html: thumbHtml }}
                                    />
                                </div>
                                <Typography.Text
                                    style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}
                                >
                                    Page {i + 1}
                                </Typography.Text>
                            </div>
                        ))}
                    </div>

                    {/* Document body — gray bg, centered A4 paper, scrollable */}
                    <div
                        ref={scrollContainerRef}
                        className="bg-gray-100 py-8 px-4 overflow-auto flex-1"
                        onScroll={() => setPopover(p => (p.open ? { ...p, open: false } : p))}
                    >
                        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                        <div
                            ref={paperRef}
                            onClick={handleEditorClick}
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                background: '#fff',
                                boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
                                borderRadius: 4,
                                padding: '20mm 25mm',
                                margin: '0 auto',
                            }}
                        >
                            <EditorContent
                                editor={editor}
                                className="doc-editor-content"
                                style={{
                                    fontFamily: '"Times New Roman", serif',
                                    fontSize: '12pt',
                                    lineHeight: 1.6,
                                    color: '#111',
                                    minHeight: '257mm',
                                }}
                            />
                        </div>
                    </div>
                </Flex>

                {/* Floating replacement bubble — fixed at the clicked placeholder's position */}
                {popover.open && (
                    <Flex
                        vertical
                        gap={10}
                        style={{
                            position: 'fixed',
                            top: popover.y,
                            left: popover.x,
                            zIndex: 1000,
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,58,58,0.15)',
                            borderRadius: 16,
                            padding: '14px 16px 12px',
                            boxShadow:
                                '0 8px 32px rgba(255,58,58,0.10), 0 2px 8px rgba(0,0,0,0.08)',
                            minWidth: 260,
                        }}
                    >
                        {/* Header row */}
                        <Flex justify="space-between" align="center">
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#FF3A3A',
                                    letterSpacing: '0.04em',
                                    fontFamily: 'Roboto, sans-serif',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Fill Placeholder
                            </span>
                            <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined style={{ fontSize: 10 }} />}
                                onClick={() => {
                                    setEmailError('');
                                    setPopover(p => ({ ...p, open: false }));
                                }}
                                style={{
                                    width: 22,
                                    height: 22,
                                    minWidth: 22,
                                    borderRadius: 50,
                                    color: '#9ca3af',
                                    padding: 0,
                                }}
                                className="hover:!bg-red-50 hover:!text-[#FF3A3A]"
                            />
                        </Flex>

                        {/* Input — DatePicker for date fields, text Input otherwise */}
                        {popover.inputType === 'date' ? (
                            <DatePicker
                                value={popover.dateValue}
                                style={{
                                    borderRadius: 10,
                                    fontSize: 13,
                                    borderColor: 'rgba(255,58,58,0.25)',
                                    width: '100%',
                                }}
                                className="focus:!border-[#FF3A3A] hover:!border-[#FF3A3A]"
                                format={DATE_FORMAT}
                                onChange={(date: Dayjs | null) => {
                                    setPopover(p => ({
                                        ...p,
                                        dateValue: date,
                                        inputValue: date ? date.format(DATE_FORMAT) : '',
                                    }));
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Escape')
                                        setPopover(p => ({ ...p, open: false }));
                                }}
                            />
                        ) : (
                            <Flex vertical gap={4}>
                                <Input
                                    ref={inputRef}
                                    placeholder={
                                        popover.inputType === 'email'
                                            ? 'Enter email address…'
                                            : 'Enter value…'
                                    }
                                    value={popover.inputValue}
                                    onChange={e => {
                                        setEmailError('');
                                        setPopover(p => ({ ...p, inputValue: e.target.value }));
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            confirmReplacement();
                                        }
                                        if (e.key === 'Escape')
                                            setPopover(p => ({ ...p, open: false }));
                                    }}
                                    status={emailError ? 'error' : undefined}
                                    style={{
                                        borderRadius: 10,
                                        fontSize: 13,
                                        borderColor: emailError
                                            ? undefined
                                            : 'rgba(255,58,58,0.25)',
                                    }}
                                    className="!text-gray-800 focus:!border-[#FF3A3A] hover:!border-[#FF3A3A]"
                                />
                                {emailError && (
                                    <span style={{ fontSize: 11, color: '#ff4d4f' }}>
                                        {emailError}
                                    </span>
                                )}
                            </Flex>
                        )}

                        {/* Action row */}
                        <Flex justify="space-between" align="center">
                            <Button
                                size="small"
                                danger
                                onClick={() => {
                                    const { from, to } = popover;
                                    setPopover({
                                        open: false,
                                        inputValue: '',
                                        inputType: 'text',
                                        dateValue: null,
                                        from: 0,
                                        to: 0,
                                        x: 0,
                                        y: 0,
                                    });
                                    Modal.confirm({
                                        title: 'Delete placeholder?',
                                        content:
                                            'This will permanently remove this placeholder from the document.',
                                        okText: 'Remove',
                                        okButtonProps: { danger: true },
                                        cancelText: 'Cancel',
                                        onOk: () =>
                                            editor.chain().focus().deleteRange({ from, to }).run(),
                                    });
                                }}
                                style={{
                                    borderRadius: 20,
                                    fontSize: 12,
                                    height: 28,
                                    paddingInline: 14,
                                }}
                            >
                                Remove
                            </Button>
                            <Button
                                size="small"
                                icon={<CheckOutlined style={{ fontSize: 10 }} />}
                                onClick={confirmReplacement}
                                style={{
                                    borderRadius: 20,
                                    fontSize: 12,
                                    height: 28,
                                    paddingInline: 14,
                                    background: '#FF3A3A',
                                    borderColor: '#FF3A3A',
                                    color: '#fff',
                                }}
                                className="hover:!bg-[#e02020] hover:!border-[#e02020]"
                            >
                                Replace
                            </Button>
                        </Flex>
                    </Flex>
                )}
            </Flex>
        );
    }
);

DocumentEditor.displayName = 'DocumentEditor';
export default DocumentEditor;
