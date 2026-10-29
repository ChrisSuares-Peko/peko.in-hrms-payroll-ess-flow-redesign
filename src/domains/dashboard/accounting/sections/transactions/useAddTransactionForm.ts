import { useMemo, useRef, useState } from 'react';

import type { Dayjs } from 'dayjs';
import * as Yup from 'yup';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { buildCategory, fileExtension, validateReceiptFile } from './addTransaction.helpers';
import { createTransaction, uploadTransactionDocument } from '../../api/transactions';
import { addTransactionSchema } from '../../schema/AddTransactionSchema';
import fileToBase64 from '../../utils/fileToBase64';
import { transactionSubcategoryOptions } from '../../utils/transactionsData';

export type TransactionKind = 'Expense' | 'Income';

interface UseAddTransactionFormArgs {
    onClose: () => void;
    onCreated?: () => void;
}

export const useAddTransactionForm = ({ onClose, onCreated }: UseAddTransactionFormArgs) => {
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptName, setReceiptName] = useState<string | null>(null);
    const [kind, setKind] = useState<TransactionKind>('Expense');
    const [amount, setAmountState] = useState('');
    const [date, setDateState] = useState<Dayjs | null>(null);
    const [category, setCategory] = useState<string | undefined>(undefined);
    const [subcategory, setSubcategory] = useState<string | undefined>(undefined);
    const [description, setDescriptionState] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearError = (field: string) =>
        setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev));

    const setAmount = (value: string) => {
        setAmountState(value);
        clearError('amount');
    };
    const setDate = (value: Dayjs | null) => {
        setDateState(value);
        clearError('date');
    };
    const setDescription = (value: string) => {
        setDescriptionState(value);
        clearError('description');
    };

    const subcategoryOptions = useMemo(
        () => (category ? (transactionSubcategoryOptions[category] ?? []) : []),
        [category]
    );

    const reset = () => {
        setReceiptFile(null);
        setReceiptName(null);
        setKind('Expense');
        setAmount('');
        setDate(null);
        setCategory(undefined);
        setSubcategory(undefined);
        setDescription('');
        setSubmitting(false);
        setErrors({});
    };

    const handleFiles = (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        const error = validateReceiptFile(file);
        if (error) {
            dispatch(showToast({ variant: 'error', description: error }));
            return;
        }
        setReceiptFile(file);
        setReceiptName(file.name);
    };

    const handleCategoryChange = (value: string) => {
        setCategory(value);

        setSubcategory(undefined);
    };

    const handleSubmit = async () => {
        try {
            addTransactionSchema.validateSync({ amount, date, description }, { abortEarly: false });
            setErrors({});
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const nextErrors: Record<string, string> = {};
                err.inner.forEach(fieldError => {
                    if (fieldError.path && !nextErrors[fieldError.path]) {
                        nextErrors[fieldError.path] = fieldError.message;
                    }
                });
                setErrors(nextErrors);
            }
            return;
        }
        if (!date) return;

        const amt = Number(amount);
        setSubmitting(true);
        try {
            const created = await createTransaction({
                userId,
                userType,
                txnDate: date.format('YYYY-MM-DD'),
                description: description.trim(),
                amount: amt,
                type: kind,
                account: 'Manual',
                category: buildCategory(category, subcategory),
            });

            if (!created) return;

            if (receiptFile) {
                const documentBase64 = await fileToBase64(receiptFile);
                await uploadTransactionDocument({
                    userId,
                    userType,
                    transactionId: created.id,
                    documentBase64,
                    fileName: receiptFile.name,
                    format: fileExtension(receiptFile.name),
                    mimeType: receiptFile.type,
                });
            }

            dispatch(
                showToast({ variant: 'success', description: 'Transaction added successfully' })
            );
            onCreated?.();
            onClose();
        } catch {
            dispatch(
                showToast({ variant: 'error', description: 'Could not add the transaction.' })
            );
        } finally {
            setSubmitting(false);
        }
    };

    return {
        fileInputRef,
        receiptName,
        kind,
        setKind,
        amount,
        setAmount,
        date,
        setDate,
        category,
        subcategory,
        setSubcategory,
        subcategoryOptions,
        description,
        setDescription,
        submitting,
        errors,
        reset,
        handleFiles,
        handleCategoryChange,
        handleSubmit,
    };
};
