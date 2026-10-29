import { useState, useEffect, useCallback } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteDocumentApi, getAllDocuments, updateDocumentStatus } from '../../api/documents';
import { DocumentRow, DocumentType, GetAllDocuments, GetAllDocumentsPayload } from '../../types/documents';

const useDocumentList = (filters: GetAllDocumentsPayload, documentType: DocumentType) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [list, setList] = useState<GetAllDocuments>();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);
    const [refresh, setRefresh] = useState(false);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllDocuments({
            userId: id,
            userType: role,
            ...filters,
            documentType,
        });
        if (!data) {
            dispatch(
                showToast({
                    description: 'Something went wrong while fetching documents.',
                    variant: 'error',
                })
            );
        } else {
            setList({
                DocumentData: data.invoiceData.map(row => ({
                    id: row.id,
                    prefix: row.prefix,
                    documentNumber: row.invoiceNumber,
                    name: row.name,
                    phoneNumber: row.phoneNumber,
                    createdAt: row.createdAt,
                    totalAmount: row.totalAmount,
                    currency: row.currency,
                    transactionType: row.invoiceType,
                    documentType: row.documentType,
                    status: row.status,
                    documentDate: row.invoiceDate,
                    dueDate: row.dueDate,
                    amountDue: row.amountDue,
                })),
                recordsTotal: data.recordsTotal,
            });
        }
        setRefresh(false);
        setIsLoading(false);
    }, [dispatch, id, role, filters, documentType]);

    const deleteDocument = useCallback(
        async (documentId: string) => {
            setIsDeleting(true);
            const resp = await deleteDocumentApi({ userId: id, userType: role, documentId });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Document deleted successfully', variant: 'success' })
                );
                setRefresh(true);
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsDeleting(false);
        },
        [dispatch, id, role]
    );

    const markAsPaid = useCallback(
        async (documentId: string) => {
            setIsMarkingPaid(true);
            const resp = await updateDocumentStatus({
                userId: id,
                userType: role,
                documentId,
                status: 'PAID',
            });
            if (resp && resp.status) {
                dispatch(showToast({ description: 'Document marked as paid', variant: 'success' }));
                setList(prev =>
                    prev
                        ? {
                              ...prev,
                              DocumentData: prev.DocumentData.map((doc: DocumentRow) =>
                                  doc.id === documentId
                                      ? { ...doc, status: 'PAID' as DocumentRow['status'] }
                                      : doc
                              ),
                          }
                        : prev
                );
            } else {
                dispatch(
                    showToast({
                        description: (resp && resp.message) || 'Failed to mark document as paid',
                        variant: 'error',
                    })
                );
            }
            setIsMarkingPaid(false);
        },
        [dispatch, id, role]
    );

    useEffect(() => {
        fetchList();
    }, [fetchList, refresh]);

    return { list, isLoading, isDeleting, isMarkingPaid, setRefresh, deleteDocument, markAsPaid };
};

export default useDocumentList;
