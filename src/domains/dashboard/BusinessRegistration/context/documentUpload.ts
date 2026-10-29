import { createContext, useContext } from 'react';

// Uploads a single KYC/service document to the filing partner on the go (as soon
// as it's picked) instead of batching every file on the Documents-step Next.
// Provided by RegistrationForm (it holds the applicationId + field→vendor
// mapping); `ok:false` carries a friendly, already-mapped error for the toast.
export type UploadDocFn = (
    fieldPath: string,
    file: { name: string; base64: string }
) => Promise<{ ok: boolean; error?: string; skipped?: boolean }>;

export const DocumentUploadContext = createContext<UploadDocFn | null>(null);

export const useDocumentUpload = () => useContext(DocumentUploadContext);
