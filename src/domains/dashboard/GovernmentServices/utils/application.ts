const MIME_SUBTYPE_MAP: Record<string, string> = {
    pdf: 'pdf',
    jpeg: 'jpg',
    jpg: 'jpg',
    png: 'png',
    msword: 'doc',
    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export const normalizeDocumentFormat = (mimeSubtype: string, fileName: string): string => {
    if (MIME_SUBTYPE_MAP[mimeSubtype]) return MIME_SUBTYPE_MAP[mimeSubtype];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ?? mimeSubtype;
};
