import { MAX_FILE_BYTES, UPLOAD_FORMATS } from './LinkDocumentModal.constants';

interface ValidateUploadFileResult {
    file?: File;

    error?: string;
}

const validateUploadFile = (files: FileList | null): ValidateUploadFileResult => {
    const file = files?.[0];
    if (!file) return {};
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!UPLOAD_FORMATS.includes(ext)) {
        return { error: 'Unsupported file type.' };
    }
    if (file.size > MAX_FILE_BYTES) {
        return { error: 'File must be 10MB or smaller.' };
    }
    return { file };
};

export default validateUploadFile;
