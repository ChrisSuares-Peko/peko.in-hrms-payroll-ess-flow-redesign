import { useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { submitLinkedInvoices, submitUploadedDocument } from './linkDocumentSubmit';
import useLinkableInvoices from './useLinkableInvoices';
import validateUploadFile from './validateUploadFile';
import { LinkableInvoice } from '../../api/transactions';
import { LinkDocumentTabKey, linkDocumentTabs } from '../../utils/linkDocumentData';
import { Transaction } from '../../utils/transactionsData';

interface UseLinkDocumentModalParams {
    open: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onLinked?: () => void;
}

const useLinkDocumentModal = ({
    open,
    transaction,
    onClose,
    onLinked,
}: UseLinkDocumentModalParams) => {
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const [activeTab, setActiveTab] = useState<LinkDocumentTabKey>('invoice');
    const [search, setSearch] = useState('');

    const [selected, setSelected] = useState<Record<string, LinkableInvoice>>({});
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isUpload = activeTab === 'peko-hub';
    const isBills = activeTab === 'purchase-bills';
    const activeTabLabel = linkDocumentTabs.find(tab => tab.key === activeTab)?.label ?? '';

    const { invoices, loadingInvoices, setInvoices } = useLinkableInvoices({
        open,
        activeTab,
        search,
        userId,
        userType,
    });

    const linkedInvoiceIds = new Set(
        (transaction?.links ?? [])
            .filter(link => link.targetType === 'INVOICING')
            .map(link => String(link.targetId))
    );
    const attachedDocuments = transaction?.documents ?? [];

    const resetState = () => {
        setActiveTab('invoice');
        setSearch('');
        setInvoices([]);
        setSelected({});
        setUploadedFile(null);
    };

    const switchTab = (key: LinkDocumentTabKey) => {
        setActiveTab(key);
        setSearch('');
        setSelected({});
        setUploadedFile(null);
    };

    const toggleSelect = (invoice: LinkableInvoice) => {
        setSelected(prev => {
            const next = { ...prev };
            const key = String(invoice.id);
            if (next[key]) delete next[key];
            else next[key] = invoice;
            return next;
        });
    };

    const handleFiles = (files: FileList | null) => {
        const { file, error } = validateUploadFile(files);
        if (error) {
            dispatch(showToast({ variant: 'error', description: error }));
            return;
        }
        if (file) setUploadedFile(file);
    };

    const selectedCount = Object.keys(selected).length;
    const hasSelection = isUpload ? Boolean(uploadedFile) : !isBills && selectedCount > 0;

    const handleContinue = async () => {
        if (!transaction || submitting) return;
        if (isUpload && !uploadedFile) return;
        setSubmitting(true);
        try {
            const toast =
                isUpload && uploadedFile
                    ? await submitUploadedDocument({ userId, userType, transaction, uploadedFile })
                    : await submitLinkedInvoices({ userId, userType, transaction, selected });
            if (!toast) return;
            dispatch(showToast(toast));
            onLinked?.();
            onClose();
        } catch {
            dispatch(
                showToast({
                    variant: 'error',
                    description:
                        'Something went wrong. If the issue persists, please contact support at reach@peko.one',
                })
            );
        } finally {
            setSubmitting(false);
        }
    };

    return {
        activeTab,
        search,
        setSearch,
        invoices,
        loadingInvoices,
        selected,
        uploadedFile,
        submitting,
        inputRef,
        isUpload,
        isBills,
        activeTabLabel,
        linkedInvoiceIds,
        attachedDocuments,
        resetState,
        switchTab,
        toggleSelect,
        handleFiles,
        selectedCount,
        hasSelection,
        handleContinue,
    };
};

export default useLinkDocumentModal;
