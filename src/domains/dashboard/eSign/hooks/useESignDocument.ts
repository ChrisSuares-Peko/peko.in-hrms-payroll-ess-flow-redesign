import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    OrderDetailsApi,
    downloadESignDocumentApi,
    resendInvitationApi,
    signRequestApi,
} from '../api';
import { setESignDocData } from '../slices/eSignDocSlice';
import {
    OrderDetailsApiResponse,
    resendInvitationApiResponse,
    signRequestApiPayload,
    signRequestApiResponse,
} from '../types';
import { getFutureDate } from '../utils';

export function useESignDocument() {
    const eSignDetails = useAppSelector(state => state.reducer.eSignDoc.signerCo);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { id: docId, signers_info } = useAppSelector(state => state.reducer.eSignDoc);

    const [isLoading, setIsLoading] = useState(false);
    const eSignDocument = async ({
        expiry_date,
        isTouchDevice,
        ...params
    }: signRequestApiPayload & { isTouchDevice: boolean }) => {
        const updatedExpiry = expiry_date === '' ? getFutureDate(90) : expiry_date;
        const lastUnassignedSigner = [...params.signers_info].find(signer => {
            const matchingSigners = eSignDetails[signer.signer_index!] || [];
            return matchingSigners.length === 0;
        });

        if (lastUnassignedSigner) {
            const message = isTouchDevice
                ? `Please assign a position for Signer ${Number(lastUnassignedSigner.signer_index!) + 1} by double tapping the document.`
                : `Please assign a position for Signer ${Number(lastUnassignedSigner.signer_index!) + 1} by dragging and dropping onto the document.`;

            dispatch(
                showToast({
                    description: message,
                    variant: 'error',
                })
            );

            return false;
        }

        // Enrich signers' info with assigned positions
        const enrichedSignersInfo = params.signers_info.map(signer => {
            const matchingSigners = eSignDetails[signer.signer_index!] || [];
            return {
                ...signer,
                signer_index: undefined,
                signer_position: matchingSigners.map(matchingSigner => ({
                    id: matchingSigner.id,
                    x1: matchingSigner.x1,
                    x2: matchingSigner.x2,
                    y1: matchingSigner.y1,
                    y2: matchingSigner.y2,
                    page_height: matchingSigner.pageHeight,
                    page_width: matchingSigner.pageWidth,
                    page: matchingSigner.page,
                })),
                page_number: matchingSigners.map(matchingSigner => String(matchingSigner.page)),
            };
        });

        const updatedParams = {
            ...params,
            signers_info: enrichedSignersInfo.map(({ signer_index, ...rest }) => rest),
        };

        setIsLoading(true);

        const data: signRequestApiResponse | false = await signRequestApi({
            userId: id,
            userType: role,
            expiry_date: updatedExpiry,
            ...updatedParams,
        });

        setIsLoading(false);

        if (!data || (data as any).status === false) {
            dispatch(
                showToast({
                    description: 'Something went wrong, Please try again later.',
                    variant: 'error',
                })
            );
            return false;
        }

        return true;
    };

    const resendInvitation = async (index: number, name: string, email: string) => {
        setIsLoading(true);
        const data: resendInvitationApiResponse | false = await resendInvitationApi({
            userId: id,
            userType: role,
            id: docId!,
            signer_id: signers_info[index].signer_id!,
            name,
            email,
        });
        if (data) {
            dispatch(
                showToast({ description: 'Invitation resent successfully.', variant: 'success' })
            );
        }
        setIsLoading(false);
    };

    const getOrderDetails = async (docId2: number) => {
        setIsLoading(true);
        const data: OrderDetailsApiResponse | false = await OrderDetailsApi({
            userId: id,
            userType: role,
            id: docId2,
        });
        if (data) {
            data.documentBase64 = `data:application/pdf;base64,${data.documentBase64}`;
            dispatch(setESignDocData({ ...data, isDisabled: true }));
            setIsLoading(false);
            return true;
        }
        setIsLoading(false);
        navigate(`${paths.dashboard.eSign}/${paths.eSign.historyPage}`);
        return false;
    };

    const downloadDocument = async (
        documentId: number,
        docType: string = 'Flat',
        documentName?: string
    ) => {
        setIsLoading(true);
        const blob = await downloadESignDocumentApi({
            userType: role,
            userId: id,
            id: documentId,
            docType,
        });
        setIsLoading(false);
        if (blob) {
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            // Strip characters not allowed in file names and any trailing .pdf from the title
            const baseName =
                documentName
                    ?.replace(/[\\/:*?"<>|]+/g, '')
                    .replace(/\.pdf$/i, '')
                    .trim() || `document-${documentId}`;
            const suffix = docType === 'ephotocopy' ? '_certificate' : '';
            a.download = `${baseName}${suffix}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } else {
            dispatch(
                showToast({
                    description: 'Failed to download. Please try again.',
                    variant: 'error',
                })
            );
        }
    };

    return { isLoading, eSignDocument, resendInvitation, getOrderDetails, downloadDocument };
}
