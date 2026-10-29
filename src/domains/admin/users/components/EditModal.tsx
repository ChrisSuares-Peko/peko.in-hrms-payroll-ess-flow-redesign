import { useState } from 'react';

import { Form } from 'antd';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { Data, PendingSignupData } from '../types/corporateUserTypes';
import { statusData } from '../utils/data';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Data;
    updatePendingsignup: (payload: PendingSignupData) => Promise<boolean>;
};

const EditModal = ({ open, handleCancel, data, updatePendingsignup }: ModalProps) => {
    const dispatch = useAppDispatch();
    const [formValues, setFormValues] = useState<PendingSignupData>();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const onSubmitConfirmed = async () => {
        if (!formValues) return;
        setIsSubmitting(true);
        const res = await updatePendingsignup({
            id: data?.id || '',
            status: formValues.status,
            remarks: formValues.remarks,
        });

        dispatch(
            showToast({
                description: res
                    ? 'Status updated successfully'
                    : 'Something went wrong, please try again later',
                variant: res ? 'success' : 'error',
            })
        );

        setIsSubmitting(false);
        setShowConfirmModal(false);
        handleCancel();
    };

    return (
        <>
            <CustomModalWithForm
                modalTitle="Pending Sign-ups Management"
                open={open}
                handleCancel={handleCancel}
                handleFormSubmit={values => {
                    setFormValues(values);
                    setShowConfirmModal(true); // show confirmation before submitting
                }}
                initialValues={{
                    status: data?.status || '',
                    remarks: data?.remarks || '',
                }}
                isDisabled={data?.status === 'CLOSED'}
            >
                <Form layout="vertical">
                    <SelectInput
                        isRequired
                        name="status"
                        options={statusData}
                        placeholder="Select status"
                        label="Status"
                        isDisabled={data?.status === 'CLOSED'}
                    />
                    <InputTextArea
                        name="remarks"
                        label="Remarks"
                        placeholder="Enter remarks"
                        // isRequired
                        maxLength={2000}
                        autoSize={{ minRows: 3 }}
                        isDisabled={data?.status === 'CLOSED'}
                    />
                </Form>
            </CustomModalWithForm>

            <ConfirmationModal
                isOpen={showConfirmModal}
                title="Are you sure you want to update the status?"
                handleCancel={() => setShowConfirmModal(false)}
                handleSubmit={onSubmitConfirmed}
                isLoading={isSubmitting}
            />
        </>
    );
};

export default EditModal;
