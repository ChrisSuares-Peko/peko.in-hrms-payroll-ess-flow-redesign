import React from 'react';

import { Button, Flex, Modal } from 'antd';
import { Form, Formik } from 'formik';

import TypographyText from '@components/atomic/typography/typographyText';

import CancelIrnForm from '../../forms/eInvoiceDetails/CancelIrnForm';
import { cancelIrnSchema } from '../../schema/eInvoiceDetails/cancelIrnSchema';
import { CancelIrnValues } from '../../types/eInvoiceDetails';
import AlertCard from '../shared/AlertCard';

interface CancelIrnModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (values: CancelIrnValues) => void;
}

const CancelIrnModal: React.FC<CancelIrnModalProps> = ({ open, onClose, onConfirm }) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title={<TypographyText className="text-base font-semibold">Cancel IRN</TypographyText>}
        centered
        width={480}
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:overflow-hidden"
        destroyOnHidden
    >
        <Formik
            initialValues={{ cancelReason: '', remarks: '' }}
            validationSchema={cancelIrnSchema}
            onSubmit={onConfirm}
        >
            {({ handleSubmit, isSubmitting }) => (
                <Form>
                    <Flex vertical gap={16}>
                        <AlertCard
                            variant="warning"
                            title="IRN cancellation is irreversible"
                            description="The document will be permanently cancelled in the GST system. A new IRN must be generated if needed."
                        />

                        <CancelIrnForm />

                        <Flex gap={12} className="mt-2">
                            <Button className="flex-1 h-10 text-sm" onClick={onClose}>
                                Keep IRN
                            </Button>
                            <Button
                                danger
                                type="primary"
                                className="flex-1 h-10 text-sm"
                                onClick={() => handleSubmit()}
                                loading={isSubmitting}
                            >
                                Cancel IRN
                            </Button>
                        </Flex>
                    </Flex>
                </Form>
            )}
        </Formik>
    </Modal>
);

export default CancelIrnModal;
