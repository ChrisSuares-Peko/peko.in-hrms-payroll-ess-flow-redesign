// Single source of truth for dynamic-form upload rules (ported from the
// vendor's uploadConstraints, adapted to Peko's accepted formats): which
// extensions each upload field type accepts, the default size cap, and the
// hint text shown on upload inputs. NOTE: Peko `file` fields deliberately
// accept images too (KYC-style proofs are uploaded on `file` fields), so the
// allowed set mirrors what the inputs already advertised — not the vendor's
// documents-only list.
export const FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export const FILE_ACCEPT = FILE_EXTENSIONS.join(',');
export const IMAGE_ACCEPT = IMAGE_EXTENSIONS.join(',');

export const DEFAULT_MAX_FILE_MB = 10;

const listLabel = (extensions: string[]) =>
    extensions.map(e => e.replace(/^\./, '').toUpperCase()).join(', ');

// Tooltip hint for an upload field: allowed formats + effective size cap.
export const getUploadHint = (type: 'file' | 'image', maxMb?: number): string => {
    const cap = maxMb && maxMb > 0 ? maxMb : DEFAULT_MAX_FILE_MB;
    const formats = type === 'image' ? IMAGE_EXTENSIONS : FILE_EXTENSIONS;
    return `Allowed formats: ${listLabel(formats)}\nMax size: ${cap}MB`;
};
