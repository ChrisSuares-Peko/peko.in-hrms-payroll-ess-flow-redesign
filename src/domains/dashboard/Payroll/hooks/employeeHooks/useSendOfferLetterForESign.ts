import { useAppSelector } from '@src/hooks/store';

import { saveOfferLetterESignId, sendOfferLetterForESign } from '../../api/employeeApi';
import { SignerValues } from '../../components/NewHire/OfferLetterSignerCard';
import { SignatureField } from '../../components/NewHire/PDFViewer';

const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString() ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

// Sends a new hire's offer letter for e-signature, then saves the returned
// e-sign id back onto the employee record.
export const useSendOfferLetterForESign = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);

    const sendOfferLetter = async ({
        employeeId,
        docketTitle,
        file,
        signatureFields,
        signerValues,
    }: {
        employeeId: string;
        docketTitle: string;
        file: File;
        signatureFields: SignatureField[];
        signerValues: SignerValues;
    }) => {
        const documentBase64 = await readFileAsDataUrl(file);

        const signers_info = [
            {
                signer_name: signerValues.name,
                signer_email: signerValues.email,
                signer_mobile: signerValues.phone,
                sequence: 1,
                page_number: [...new Set(signatureFields.map(f => String(f.page)))],
                signer_position: signatureFields.map(f => ({
                    page: f.page,
                    page_height: f.pageHeight,
                    page_width: f.pageWidth,
                    x1: f.x1,
                    x2: f.x2,
                    y1: f.y1,
                    y2: f.y2,
                })),
            },
        ];

        const result = await sendOfferLetterForESign({
            userId: id,
            userType: role,
            offerLetterEmployeeId: employeeId,
            docket_title: docketTitle,
            documentBase64,
            initiator_email: user?.email || '',
            signers_info,
        });

        if (result.success && result.data?.data?.id) {
            await saveOfferLetterESignId({
                userId: id,
                userType: role,
                id: employeeId,
                eSignId: result.data.data.id,
            });
        }

        return result;
    };

    return { sendOfferLetter };
};
