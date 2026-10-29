import { useState } from 'react';

import { Flex, Form } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import DocumentUploadInput from './DocumentUploadInput';
import attestationSchema from '../../schema/attestation';
import { DocumentEdit, docAttestation } from '../../types/attestation';
import { statusData } from '../../utils/data';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: docAttestation;
    updateDocumentAttestation: (payload: DocumentEdit) => Promise<boolean>;
};

const EditModal = ({ open, handleCancel, data, updateDocumentAttestation }: ModalProps) => {
    const [, setFile] = useState<any>('');
    const dispatch = useAppDispatch();

    function findSubmissionCountry(submissionCountry: string | undefined) {
        return submissionCountry === 'UAE' ? 'United Arab Emirates' : submissionCountry;
    }
    return (
        <CustomModalWithForm
            modalTitle="Attestation Management"
            open={open}
            validationSchema={attestationSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const res: boolean = await updateDocumentAttestation({
                    id: values.id,
                    address: values.address,
                    poBox: values.poBox,
                    contactPersonPhone: values.contactPersonPhone,
                    remarks: values.remarks,
                    base64String: values.base64String,
                    documentFormat: values.documentFormat,
                    status: values.status,
                    email: values.email,
                });

                if (res === true) {
                    dispatch(
                        showToast({
                            description: `Document attestation updated successfully`,
                            variant: 'success',
                        })
                    );
                }
                if (res === false) {
                    dispatch(
                        showToast({
                            description: `Something went wrong ,please try again later`,
                            variant: 'error',
                        })
                    );
                }
                handleCancel();
            }}
            initialValues={{
                id: data?.id || '',
                address: data?.address || '',
                poBox: data?.poBox || '',
                contactPersonPhone: data?.contactPersonPhone || '',
                remarks: data?.remarks || '',
                base64String: '',
                documentFormat: '',
                status: data?.status,
                email: data?.email,
                issuedCountry: data?.issuedCountry,
                documentType: data?.documentType,
                submissionCountry: findSubmissionCountry(data?.submissionCountry),
            }}
        >
            <Flex vertical className=" w-full">
                <Form layout="vertical">
                    <TextInput
                        name="issuedCountry"
                        label="Document Issued Country"
                        type="text"
                        placeholder="Document Issued Country"
                        classes=" rounded-sm"
                        isDisabled
                    />
                    <TextInput
                        name="documentType"
                        label="Type of Document"
                        type="text"
                        placeholder="Type of Document"
                        classes=" rounded-sm"
                        isDisabled
                    />
                    <TextInput
                        name="submissionCountry"
                        label="Submission Country"
                        type="text"
                        placeholder="Submission Country"
                        classes=" rounded-sm"
                        isDisabled
                    />
                    <TextInput
                        name="email"
                        label="Email ID"
                        type="text"
                        placeholder="Enter Email ID"
                        classes=" rounded-sm"
                        isRequired
                    />
                    <TextInput
                        name="contactPersonPhone"
                        label="Mobile Number"
                        type="text"
                        placeholder="Please enter Mobile number"
                        classes=" rounded-sm"
                        maxLength={10}
                        allowNumbersOnly
                        isRequired
                    />
                    <TextAreaInput
                        name="address"
                        label="Address"
                        placeholder="House no, Building name, Area, Colony"
                        isRequired
                    />
                    <DocumentUploadInput
                        uploadedFile={data?.passportDoc}
                        isrequired={!data}
                        label="Passport Document"
                        name="base64String"
                        setFile={setFile}
                        format="documentFormat"
                        showNotification
                        showFileName
                    />
                    <SelectInput
                        isRequired
                        name="status"
                        options={statusData}
                        placeholder="Please update status"
                        label="KYC status"
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default EditModal;
