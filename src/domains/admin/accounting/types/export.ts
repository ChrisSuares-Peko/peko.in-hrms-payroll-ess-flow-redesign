export type ExportFormat = 'excel' | 'pdf';

export const EXPORT_EXTENSIONS: Record<ExportFormat, string> = {
    excel: 'xlsx',
    pdf: 'pdf',
};
