import { useCallback, useEffect, useRef, useState } from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';

import TypographyText from '@components/atomic/typography/typographyText';

GlobalWorkerOptions.workerSrc = '/javascript/pdf.worker.min.js';

const SIG_W = 130;
const SIG_H = 44;

export interface SignatureField {
    id: string;
    signerIndex: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    page: number;
    pageWidth: number;
    pageHeight: number;
}

interface Props {
    file?: File | null;
    documentUrl?: string | null;
    signatureFields?: SignatureField[];
    showPageSelector?: boolean;
    showFileName?: boolean;
    fileName?: string;
    editable?: boolean;
    onFileRemove?: () => void;
    onSignatureFieldsChange?: (fields: SignatureField[]) => void;
    getSignerName?: (signerIndex: number) => string;
    getSignerColor?: (signerIndex: number) => { bg: string; border: string; text: string };
}

const PDFViewer = ({
    file,
    documentUrl,
    signatureFields = [],
    showPageSelector = true,
    showFileName = true,
    fileName,
    editable = false,
    onFileRemove,
    onSignatureFieldsChange,
    getSignerName,
    getSignerColor,
}: Props) => {
    const [pages, setPages] = useState<string[]>([]);
    const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPage, setSelectedPage] = useState(1);
    const [loadedFile, setLoadedFile] = useState<File | null>(null);
    const [draggingPos, setDraggingPos] = useState<{ x: number; y: number; page: number } | null>(
        null
    );

    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const loadPdf = useCallback(async (pdfFile: File) => {
        setLoading(true);
        try {
            const buffer = await pdfFile.arrayBuffer();
            const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
            const { numPages } = pdf;
            const renderedPages: string[] = [];
            const dims: { width: number; height: number }[] = [];

            const renderPromises = [];
            for (let i = 1; i <= numPages; i += 1) {
                renderPromises.push(
                    (async () => {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 1.0 });
                        dims[i - 1] = { width: viewport.width, height: viewport.height };

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            const rv = page.getViewport({ scale: 1.5 });
                            canvas.width = rv.width;
                            canvas.height = rv.height;
                            await page.render({ canvasContext: ctx, viewport: rv }).promise;
                            renderedPages[i - 1] = canvas.toDataURL('image/png');
                        }
                    })()
                );
            }

            await Promise.all(renderPromises);
            setPages(renderedPages);
            setPageDimensions(dims);
        } catch (err) {
            console.error('PDF load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (file) {
            setLoadedFile(file);
            loadPdf(file);
        }
    }, [file, loadPdf]);

    useEffect(() => {
        if (documentUrl && !file) {
            fetch(documentUrl)
                .then(res => res.blob())
                .then(blob => {
                    const f = new File([blob], 'document.pdf', { type: 'application/pdf' });
                    setLoadedFile(f);
                    loadPdf(f);
                })
                .catch(err => console.error('Failed to load document from URL:', err));
        }
    }, [documentUrl, file, loadPdf]);

    useEffect(() => {
        if (!pages.length || !showPageSelector) return undefined;
        const container = scrollContainerRef.current;
        if (!container) return undefined;

        const observer = new IntersectionObserver(
            entries => {
                let best: { page: number; ratio: number } | null = null;
                entries.forEach(entry => {
                    const idx = pageRefs.current.indexOf(entry.target as HTMLDivElement);
                    if (idx === -1) return;
                    if (!best || entry.intersectionRatio > best.ratio) {
                        best = { page: idx + 1, ratio: entry.intersectionRatio };
                    }
                });
                if (best !== null) setSelectedPage((best as { page: number; ratio: number }).page);
            },
            { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        pageRefs.current.forEach(el => {
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [pages, showPageSelector]);

    const scrollToPage = (pageNum: number) => {
        setSelectedPage(pageNum);
        pageRefs.current[pageNum - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handlePageDrop = (e: React.DragEvent<HTMLDivElement>, pageIndex: number) => {
        if (!editable) return;
        e.preventDefault();
        e.stopPropagation();
        setDraggingPos(null);
        const raw = e.dataTransfer.getData('signerField');
        if (!raw) return;

        const data = JSON.parse(raw) as { type: string; signerIndex: number; fieldId?: string };

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const { width: pw, height: ph } = pageDimensions[pageIndex - 1];

        let x1 = offsetX - SIG_W / 2;
        let y1 = offsetY - SIG_H / 2;
        let x2 = x1 + SIG_W;
        let y2 = y1 + SIG_H;

        if (x2 > pw) {
            x1 = pw - SIG_W;
            x2 = pw;
        }
        if (y2 > ph) {
            y1 = ph - SIG_H;
            y2 = ph;
        }
        x1 = Math.max(0, x1);
        y1 = Math.max(0, y1);

        if (data.type === 'existing' && data.fieldId) {
            onSignatureFieldsChange?.(
                signatureFields.map(f =>
                    f.id === data.fieldId
                        ? { ...f, x1, y1, x2, y2, page: pageIndex, pageWidth: pw, pageHeight: ph }
                        : f
                )
            );
        } else {
            const overlap = signatureFields.some(
                sf =>
                    sf.page === pageIndex &&
                    Math.max(sf.x1, x1) < Math.min(sf.x2, x2) &&
                    Math.max(sf.y1, y1) < Math.min(sf.y2, y2)
            );
            if (!overlap) {
                onSignatureFieldsChange?.([
                    ...signatureFields,
                    {
                        id: uuidv4(),
                        signerIndex: data.signerIndex,
                        x1,
                        y1,
                        x2,
                        y2,
                        page: pageIndex,
                        pageWidth: pw,
                        pageHeight: ph,
                    },
                ]);
            }
        }
    };

    const handlePageDragOver = (e: React.DragEvent<HTMLDivElement>, pageIndex: number) => {
        if (!editable) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setDraggingPos({
            x: Math.floor(e.clientX - rect.left),
            y: Math.floor(e.clientY - rect.top),
            page: pageIndex,
        });
    };

    if (!file && !documentUrl) {
        return null;
    }

    return (
        <Flex
            className="rounded-xl border border-[#E5E7EB] overflow-hidden h-[400px] md:h-[680px]"
        >
            {showPageSelector && (
                <Flex
                    vertical
                    className="hidden md:flex bg-white border-r border-[#E5E7EB] shrink-0 py-3 px-2"
                    style={{ width: 160, gap: 12, overflowY: 'auto', overflowX: 'hidden' }}
                >
                    {loading
                        ? Array.from({ length: 3 }, (_, i) => (
                              <Flex
                                  key={i}
                                  className="w-32 rounded bg-[#F3F4F6] animate-pulse"
                                  style={{ height: 170 }}
                              />
                          ))
                        : pages.map((img, i) => {
                              const pg = i + 1;
                              const sel = selectedPage === pg;
                              return (
                                  <Flex
                                      key={pg}
                                      vertical
                                      align="center"
                                      gap={4}
                                      className="cursor-pointer"
                                      onClick={() => scrollToPage(pg)}
                                  >
                                      <Flex
                                          className="rounded overflow-hidden"
                                          style={{
                                              width: 128,
                                              border: sel
                                                  ? '1.5px solid #FF4F4F'
                                                  : '1.5px solid #E5E7EB',
                                          }}
                                      >
                                          <img
                                              src={img}
                                              alt={`Page ${pg}`}
                                              style={{ width: '100%', display: 'block' }}
                                          />
                                      </Flex>
                                      <div style={{ color: sel ? '#FF4F4F' : '#6B7280' }}>
                                          <TypographyText className="text-xs font-medium">
                                              Page {pg}
                                          </TypographyText>
                                      </div>
                                  </Flex>
                              );
                          })}
                </Flex>
            )}

            <Flex vertical className="flex-1 min-w-0">
                {(fileName || showFileName) && (
                    <Flex
                        align="center"
                        justify="space-between"
                        className="px-4 py-2 border-b border-[#E5E7EB] bg-white shrink-0"
                    >
                        <TypographyText className="text-xs font-medium text-[#374151]">
                            {fileName ?? loadedFile?.name ?? 'Document'}
                        </TypographyText>
                        {onFileRemove && (
                            <CloseCircleOutlined
                                className="text-[#EF4444] cursor-pointer text-sm"
                                onClick={onFileRemove}
                            />
                        )}
                    </Flex>
                )}

                <Flex
                    vertical
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'auto',
                        backgroundColor: '#F9FAFB',
                    }}
                    ref={scrollContainerRef}
                >
                    {loading ? (
                        <Flex
                            justify="center"
                            align="center"
                            style={{ height: '100%', minHeight: 400 }}
                        >
                            <TypographyText className="text-sm text-[#6B7280]">
                                Loading document…
                            </TypographyText>
                        </Flex>
                    ) : (
                        <Flex vertical gap={16} className="p-4" style={{ minWidth: 'max-content' }}>
                            {pages.map((img, i) => {
                                const pi = i + 1;
                                const { width, height } = pageDimensions[i];
                                return (
                                    <Flex
                                        key={pi}
                                        ref={el => {
                                            pageRefs.current[i] = el as HTMLDivElement | null;
                                        }}
                                        className="relative shadow-sm"
                                        style={{ width, height, marginLeft: 'auto', marginRight: 'auto' }}
                                        onDrop={e => handlePageDrop(e as React.DragEvent<HTMLDivElement>, pi)}
                                        onDragOver={e => handlePageDragOver(e as React.DragEvent<HTMLDivElement>, pi)}
                                        onDragLeave={e => {
                                            if (
                                                !e.currentTarget.contains(e.relatedTarget as Node)
                                            ) {
                                                setDraggingPos(null);
                                            }
                                        }}
                                    >
                                        <img
                                            src={img}
                                            alt={`Page ${pi}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'block',
                                            }}
                                        />

                                        {editable && draggingPos?.page === pi && (
                                            <Flex
                                                style={{
                                                    position: 'absolute',
                                                    top: draggingPos.y,
                                                    left: draggingPos.x,
                                                    width: SIG_W,
                                                    height: SIG_H,
                                                    backgroundColor: '#D9EECC',
                                                    border: '2px solid #05BE63',
                                                    borderRadius: 4,
                                                    pointerEvents: 'none',
                                                    opacity: 0.7,
                                                }}
                                            />
                                        )}

                                        {signatureFields
                                            .filter(f => f.page === pi)
                                            .map(field => {
                                                const color = getSignerColor?.(
                                                    field.signerIndex
                                                ) || {
                                                    bg: '#D9EECC',
                                                    border: '#05BE63',
                                                    text: '#15803D',
                                                };
                                                const name =
                                                    getSignerName?.(field.signerIndex) ||
                                                    `Signer ${field.signerIndex + 1}`;
                                                return (
                                                    <div
                                                        key={field.id}
                                                        draggable={editable}
                                                        onDragStart={e => {
                                                            if (!editable) return;
                                                            const dragImage =
                                                                e.currentTarget.cloneNode(
                                                                    true
                                                                ) as HTMLElement;
                                                            dragImage.style.position = 'absolute';
                                                            dragImage.style.top = '-9999px';
                                                            dragImage.style.width = '130px';
                                                            dragImage.style.height = '44px';
                                                            document.body.appendChild(dragImage);
                                                            e.dataTransfer.setDragImage(
                                                                dragImage,
                                                                65,
                                                                22
                                                            );
                                                            e.dataTransfer.setData(
                                                                'signerField',
                                                                JSON.stringify({
                                                                    type: 'existing',
                                                                    fieldId: field.id,
                                                                    signerIndex: field.signerIndex,
                                                                })
                                                            );
                                                            setTimeout(
                                                                () =>
                                                                    document.body.removeChild(
                                                                        dragImage
                                                                    ),
                                                                0
                                                            );
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: field.y1,
                                                            left: field.x1,
                                                            width: SIG_W,
                                                            height: SIG_H,
                                                            backgroundColor: color.bg,
                                                            border: `1.5px solid ${color.border}`,
                                                            borderRadius: 2,
                                                            cursor: editable ? 'grab' : 'default',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <Typography.Text
                                                            style={{
                                                                color: color.text,
                                                                fontSize: 10,
                                                                fontWeight: 500,
                                                                lineHeight: 1.3,
                                                            }}
                                                        >
                                                            {name}
                                                        </Typography.Text>
                                                        <Typography.Text
                                                            style={{
                                                                color: '#9CA3AF',
                                                                fontSize: 8,
                                                            }}
                                                        >
                                                            (Sign here)
                                                        </Typography.Text>
                                                        {editable && (
                                                            <CloseCircleOutlined
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 2,
                                                                    right: 2,
                                                                    fontSize: 11,
                                                                    color: '#EF4444',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    onSignatureFieldsChange?.(
                                                                        signatureFields.filter(
                                                                            f => f.id !== field.id
                                                                        )
                                                                    );
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </Flex>
                                );
                            })}
                        </Flex>
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
};

export default PDFViewer;
