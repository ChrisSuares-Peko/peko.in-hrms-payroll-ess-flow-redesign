type BufferLike = { type: 'Buffer'; data: number[] } | Record<string, number>;

export function triggerPdfDownload(
    pdfFile: BufferLike | string,
    pdfName: string
) {
    let bytes: Uint8Array;
    if (typeof pdfFile === 'string') {
        const binary = atob(pdfFile);
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    } else if ('type' in pdfFile && pdfFile.type === 'Buffer' && Array.isArray((pdfFile as { type: string; data: number[] }).data)) {
        bytes = new Uint8Array((pdfFile as { type: string; data: number[] }).data);
    } else {
        const keys = Object.keys(pdfFile).length;
        bytes = new Uint8Array(keys);
        for (let i = 0; i < keys; i += 1) bytes[i] = (pdfFile as Record<string, number>)[i];
    }
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfName.endsWith('.pdf') ? pdfName : `${pdfName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}
