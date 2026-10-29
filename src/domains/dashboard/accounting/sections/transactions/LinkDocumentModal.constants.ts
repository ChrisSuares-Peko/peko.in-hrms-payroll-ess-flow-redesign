import { Transaction } from '../../utils/transactionsData';

export const SCROLL_AREA =
    'max-h-[90vh] overflow-y-auto [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5';

export const UPLOAD_FORMATS = ['pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export interface LinkDocumentModalProps {
    open: boolean;

    transaction: Transaction | null;
    onClose: () => void;

    onLinked?: () => void;
}
