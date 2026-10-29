import React from 'react';

import { Form } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useWccPayment from '../../hooks/useWccPayment';
import { Project } from '../../types/types';

interface BuyCreditModalProps {
    isVisible: boolean;
    project: Project | null;
    handleCancel: () => void;
}

const BuyCreditModal: React.FC<BuyCreditModalProps> = ({ isVisible, project, handleCancel }) => {
    const { handleSubmission } = useWccPayment();

    const handleSubmit = async (values: { amount: string }) => {
        if (project) {
            await handleSubmission(values.amount, project.id);
        }
    };

    const validationSchema = Yup.object().shape({
        amount: Yup.number().min(1, 'Amount must be at least 1').required('Amount is required'),
    });

    return (
        <CustomModalWithForm
            open={isVisible}
            handleCancel={handleCancel}
            initialValues={{ amount: '' }}
            modalTitle={`Buy WCC Credit for ${project?.name}`}
            handleFormSubmit={handleSubmit}
            validationSchema={validationSchema}
            isLoading={false}
        >
            <Form layout="vertical">
                <TextInput
                    name="amount"
                    label="Amount in ₹"
                    type="string"
                    placeholder="Enter amount"
                    isRequired
                    classes="rounded-sm"
                />
            </Form>
        </CustomModalWithForm>
    );
};

export default BuyCreditModal;
