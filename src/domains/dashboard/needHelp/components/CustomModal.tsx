import React, { useCallback, useState } from 'react';

import { Form } from 'antd';
import { FormikHelpers } from 'formik';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppSelector } from '@src/hooks/store';

import useTicketCreate from '../hooks/useTicketCreate';
import { ticketSchema } from '../schema/index';

type Props = {
    open: boolean;
    closeModal: () => void;
    getTicketList: () => void;
};

const CustomModal = ({ open, closeModal, getTicketList }: Props) => {
    const { handleTicketCreation, isLoading } = useTicketCreate();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [file, setFile] = useState<any>('');
    const { moduleDetails, issueDetails } = useAppSelector(state => state.reducer.support);

    const handleFormSubmit = useCallback(
        async (values: any, { resetForm }: FormikHelpers<any>) => {
            try {
                await handleTicketCreation(values);
                getTicketList();
                resetForm();
                closeModal();
            } catch (error) {
                // console.error('Error:', error);
            }
        },
        [closeModal, getTicketList, handleTicketCreation]
    );

    return (
        <CustomModalWithForm
            modalTitle="Raise a Ticket"
            isLoading={isLoading}
            open={open}
            handleCancel={closeModal}
            handleFormSubmit={handleFormSubmit}
            initialValues={{
                issueType: '',
                module: '',
                description: '',
                screenshotImage: '',
            }}
            validationSchema={ticketSchema}
        >
            <Form layout="vertical">
                <SelectInput
                    name="issueType"
                    label="Issue Type"
                    options={issueDetails}
                    placeholder="Issue Type"
                    classes=" rounded-sm"
                    isRequired
                />
                <SelectInput
                    name="module"
                    label="Module"
                    options={moduleDetails}
                    placeholder="Module"
                    classes=" rounded-sm"
                    isRequired
                />
                <InputTextArea
                    name="description"
                    label="Description"
                    placeholder="Description"
                    size="large"
                    isRequired
                    maxLength={250}
                    showCount
                />
                <FileUploadInput
                    label="File Upload"
                    name="screenshot"
                    setFile={setFile}
                    subLabel="(Formats Supported: JPEG, JPG or PNG Max size: 500 KB)"
                    format="screenshotImageFormat"
                    // showNotification
                    allowFileDelete
                    showFileName
                    maxFileSize={500}
                />
            </Form>
        </CustomModalWithForm>
    );
};

export default CustomModal;
