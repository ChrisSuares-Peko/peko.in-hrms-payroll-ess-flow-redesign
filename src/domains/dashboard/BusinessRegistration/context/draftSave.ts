import { createContext, useContext } from 'react';

// Persists the current draft to the server on demand. Provided by RegistrationForm
// (it holds the applicationId / auth) and consumed by the per-person Save buttons
// on the long KYC step. Returns whether the save succeeded.
export type SaveDraftFn = (values: Record<string, unknown>) => Promise<boolean>;

export const DraftSaveContext = createContext<SaveDraftFn | null>(null);

export const useDraftSave = () => useContext(DraftSaveContext);
