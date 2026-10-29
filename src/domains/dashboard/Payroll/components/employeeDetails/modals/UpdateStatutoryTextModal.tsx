import React from 'react';

import { Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

interface UpdateStatutoryTextModalProps {
    open: boolean;
    title: string;
    label: string;
    fieldKey: string;
    initialValue: string | null;
    isLoading?: boolean;
    handleCancel: () => void;
    onSave: (fieldKey: string, value: string) => Promise<any>;
}

const UpdateStatutoryTextModal = ({
    open,
    title,
    label,
    fieldKey,
    initialValue,
    isLoading = false,
    handleCancel,
    onSave,
}: UpdateStatutoryTextModalProps) => {
    const handleFormSubmit = async (values: { value: string }) => {
        const result = await onSave(fieldKey, values.value.trim());
        if (result) handleCancel();
    };

    return (
        <CustomModalWithForm
            modalTitle={title}
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={{ value: initialValue || '' }}
            reinitialise
        >
            <Form layout="vertical">
                <TextInput
                    name="value"
                    type="text"
                    label={label}
                    placeholder={`Enter ${label}`}
                    isRequired
                    convertToUppercase
                    maxLength={30}
                />
            </Form>
        </CustomModalWithForm>
    );
};

export default UpdateStatutoryTextModal;
