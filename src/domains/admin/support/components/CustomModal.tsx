import React, { useState } from 'react';

import { Form } from 'antd';
import { FormikHelpers } from 'formik';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
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
    const { handleTicketCreation, isLoading, corporateList, initialVal, setCorporateList } =
        useTicketCreate();
    const [, setFile] = useState<any>('');
    const { moduleDetails, issueDetails } = useAppSelector(state => state.reducer.support);

    const handleFormSubmit = async (values: any, { resetForm }: FormikHelpers<any>) => {
        try {
            await handleTicketCreation(values);
            getTicketList();
            resetForm();
            closeModal();
        } catch (error) {
            // console.error('Error:', error);
        }
    };
    const handleClear = (setFieldValue: any) => {
        setCorporateList(initialVal);
        setFieldValue('corporateUserId', '');
    };
    const handleSearch = (searchText: string) => {
        if (searchText) {
            const results = initialVal.filter(item =>
                item.oName.toLowerCase().includes(searchText.toLowerCase())
            );
            setCorporateList(results);
        } else {
            setCorporateList(initialVal);
        }
    };
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
                screenshot: '',
                corporateUserId: '',
            }}
            validationSchema={ticketSchema}
        >
            <Form layout="vertical">
                <CustomSelectSearch
                    placeholder="Select User"
                    label="User"
                    name="corporateUserId"
                    options={corporateList}
                    showSearch
                    filterOption={false}
                    loading={isLoading}
                    onSearch={handleSearch}
                    onClear={handleClear}
                    isRequired
                />
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
                    maxLength={300}
                    isRequired
                />
                <FileUploadInput
                    label="File Upload"
                    name="screenshot"
                    setFile={setFile}
                    format="screenshotImageFormat"
                    showNotification
                    showFileName
                    maxFileSize={500}
                />
            </Form>
        </CustomModalWithForm>
    );
};

export default CustomModal;
