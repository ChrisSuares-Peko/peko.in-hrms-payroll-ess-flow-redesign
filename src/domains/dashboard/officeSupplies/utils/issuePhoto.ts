import { message } from 'antd';

/** Evidence photo for an ONDC issue — raw base64 (no data-URL prefix) + format.
 *  The backend uploads these to a public Firebase URL and forwards them to the
 *  seller; the browser never talks to a hosting endpoint directly. */
export interface IssuePhoto {
    base64: string;
    format: 'png' | 'jpeg' | 'jpg' | 'pdf';
    name?: string;
}

/** Matches the backend guard (utils/apiValidation.js: fileSizeValidation(2048)). */
export const MAX_ISSUE_PHOTO_KB = 2048;
export const MAX_ISSUE_PHOTOS = 5;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

/**
 * Read a picked File into `{base64, format}`, guarding type and size the same
 * way the backend does. Returns null (and toasts why) on a rejected file, so
 * callers can simply filter nulls. Same FileReader.readAsDataURL technique as
 * components/atomic/inputs/FileUploadInput.tsx, minus the Formik coupling.
 */
export const readIssuePhoto = (file: File): Promise<IssuePhoto | null> =>
    new Promise(resolve => {
        if (!ALLOWED_MIME.includes(file.type)) {
            message.error('Only PNG, JPG images, or PDF documents are allowed.');
            resolve(null);
            return;
        }
        if (file.size / 1024 > MAX_ISSUE_PHOTO_KB) {
            message.error(`Each file must be under ${MAX_ISSUE_PHOTO_KB / 1024} MB.`);
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const isPdf = file.type === 'application/pdf';
                resolve({
                    base64: reader.result.split(',')[1], // strip the data:…;base64, prefix
                    format: isPdf ? 'pdf' : (file.type.split('/')[1] as IssuePhoto['format']) || 'png',
                    name: file.name,
                });
            } else {
                resolve(null);
            }
        };
        reader.onerror = () => {
            message.error("Couldn't read that file — please try another.");
            resolve(null);
        };
        reader.readAsDataURL(file);
    });
