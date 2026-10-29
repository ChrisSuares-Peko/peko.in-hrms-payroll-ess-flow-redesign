import { useCallback, useMemo } from 'react';

import { Flex, Typography } from 'antd';
import { Formik } from 'formik';

import { CUSTOMER_SIGN_COLOR } from '../../constants/style';
import RecipientForm, { RecipientFormValues } from '../../forms/createAgreement/RecipientForm';
import { recipientSchema } from '../../schema/createAgreement/recipientSchema';
import type { Recipient } from '../../types/createAgreement';

interface RecipientCardProps {
    recipient: Recipient;
    fieldsCount: number;
    onUpdate: (values: RecipientFormValues) => void;
}

const RecipientCard = ({ recipient, fieldsCount, onUpdate }: RecipientCardProps) => {
    const initialValues: RecipientFormValues = useMemo(
        () => ({
            name: recipient.name,
            email: recipient.email,
            phone: recipient.phone,
        }),
        [recipient.name, recipient.email, recipient.phone]
    );

    const handleUpdate = useCallback(
        (values: RecipientFormValues) => {
            onUpdate(values);
        },
        [onUpdate]
    );

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={recipientSchema}
            onSubmit={handleUpdate}
            enableReinitialize
        >
            {() => (
                <Flex
                    vertical
                    gap={4}
                    className="rounded-[5px] border border-[#E4E4E7] bg-white px-5 py-5"
                >
                    <Typography.Text className="text-sm font-semibold text-slate-700 mb-2">
                        Customer Signature
                    </Typography.Text>

                    <RecipientForm onValuesChange={handleUpdate} />

                    <div
                        draggable
                        onDragStart={e => {
                            const dragImage = document.createElement('div');
                            dragImage.style.cssText = `
                                width: 130px;
                                height: 44px;
                                background-color: ${CUSTOMER_SIGN_COLOR.bg};
                                border: 1.5px solid ${CUSTOMER_SIGN_COLOR.border};
                                border-radius: 2px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                position: absolute;
                                top: -9999px;
                            `;
                            dragImage.innerHTML = `
                                <span style="color: ${CUSTOMER_SIGN_COLOR.text}; font-size: 10px; font-weight: 500; line-height: 1.3;">Customer Signature</span>
                                <span style="color: #9CA3AF; font-size: 8px;">(Sign here)</span>
                            `;
                            document.body.appendChild(dragImage);
                            e.dataTransfer.setDragImage(dragImage, 65, 22);
                            e.dataTransfer.setData(
                                'signerField',
                                JSON.stringify({ type: 'new', signerIndex: 0 })
                            );
                            setTimeout(() => document.body.removeChild(dragImage), 0);
                        }}
                        className="flex flex-col items-center justify-center rounded py-3 select-none mt-1"
                        style={{
                            backgroundColor: CUSTOMER_SIGN_COLOR.bg,
                            border: `1.5px solid ${CUSTOMER_SIGN_COLOR.border}`,
                            minHeight: 52,
                            cursor: 'grab',
                        }}
                    >
                        <Typography.Text
                            className="text-xs font-medium text-center block"
                            style={{ color: CUSTOMER_SIGN_COLOR.text }}
                        >
                            Customer Signature
                        </Typography.Text>
                        <Typography.Text
                            className="text-center block"
                            style={{ color: '#9CA3AF', fontSize: 9 }}
                        >
                            {fieldsCount > 0
                                ? `(${fieldsCount} placed — drag to add more)`
                                : '(Drag & drop to position)'}
                        </Typography.Text>
                    </div>
                </Flex>
            )}
        </Formik>
    );
};

export default RecipientCard;
