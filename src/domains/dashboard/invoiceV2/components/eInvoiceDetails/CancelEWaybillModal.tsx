import React from 'react';

import { Button, Flex, Modal } from 'antd';
import { Form, Formik } from 'formik';

import TypographyText from '@components/atomic/typography/typographyText';

import CancelEWaybillForm from '../../forms/eInvoiceDetails/CancelEWaybillForm';
import { cancelEWaybillSchema } from '../../schema/eInvoiceDetails/cancelEWaybillSchema';
import { CancelEWaybillValues } from '../../types/eInvoiceDetails';
import AlertCard from '../shared/AlertCard';

interface CancelEWaybillModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (values: CancelEWaybillValues) => void;
}

const CancelEWaybillModal: React.FC<CancelEWaybillModalProps> = ({ open, onClose, onConfirm }) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title={
            <TypographyText className="text-base font-semibold">Cancel E-Waybill</TypographyText>
        }
        centered
        width={480}
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:overflow-hidden"
        destroyOnHidden
    >
        <Formik
            initialValues={{ cancelReason: '' }}
            validationSchema={cancelEWaybillSchema}
            onSubmit={onConfirm}
        >
            {({ handleSubmit, isSubmitting }) => (
                <Form>
                    <Flex vertical gap={16}>
                        <AlertCard
                            variant="warning"
                            description="E-Waybill can be cancelled only within 24 hours of generation and only if the goods movement has not started."
                        />

                        <CancelEWaybillForm />

                        <Flex gap={12} className="mt-2">
                            <Button className="flex-1 h-10 text-sm" onClick={onClose}>
                                Keep E-Waybill
                            </Button>
                            <Button
                                danger
                                type="primary"
                                className="flex-1 h-10 text-sm"
                                onClick={() => handleSubmit()}
                                loading={isSubmitting}
                            >
                                Cancel E-Waybill
                            </Button>
                        </Flex>
                    </Flex>
                </Form>
            )}
        </Formik>
    </Modal>
);

export default CancelEWaybillModal;
