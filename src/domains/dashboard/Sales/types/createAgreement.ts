import type { AgreementDetailsFormValues } from './agreement';
import type { SignatureField } from '../components/shared/PDFViewer';

export interface Recipient {
    id: number;
    name: string;
    email: string;
    phone: string;
    expanded: boolean;
    hasError: boolean;
}

export interface Step3Ref {
    submitForm: () => void;
    getFormValues: () => Partial<AgreementDetailsFormValues> | undefined;
}

export interface Step4Ref {
    validate: () => boolean;
    getFile: () => File | null;
    getSignatureFields: () => SignatureField[];
    setFile: (f: File | null) => void;
    setSignatureFields: (fields: SignatureField[]) => void;
    canContinue: () => boolean;
}

export interface Step5Ref {
    getInitiatorInfo: () => { email: string; name: string };
}
