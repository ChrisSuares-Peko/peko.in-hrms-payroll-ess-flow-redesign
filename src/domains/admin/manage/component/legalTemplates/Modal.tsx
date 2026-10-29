import { useRef } from 'react';

import { FormikProps } from 'formik';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useLegalTemplatesUpdate from '../../hooks/useLegalTemplatesUpdate';
import { legalTemplatesSchema } from '../../schema/legalTemplates';
import { LegalTemplatesBody, LegalTemplatesFormValues } from '../../types/legalTemplates';
import LegalTemplatesForm from '../forms/LegalTemplatesForm';

type Props = {
    open: boolean;
    handleCancel: () => void;
    data?: LegalTemplatesBody;
    handleRefresh: () => void;
};

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: Props) => {
    const formRef = useRef<FormikProps<LegalTemplatesFormValues>>(null);
    const { isLoading, handleCreation, updateDetails } = useLegalTemplatesUpdate();

    return (
        <CustomModalWithForm
            modalTitle="Legal Template Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const result = values.id
                    ? await updateDetails(values)
                    : await handleCreation(values);
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            initialValues={{
                id: data?.id ?? '',
                title: data?.title ?? '',
                category: data?.category ?? '',
                description: data?.description ?? '',
                timeEstimate: data?.timeEstimate ?? '',
                iconKey: data?.iconKey ?? '',
                documentFile: '',
                documentFormat: '',
                documentUrl: data?.documentUrl ?? '',
            }}
            validationSchema={legalTemplatesSchema}
            formRefName={formRef}
            reinitialise
            validateOnChange
        >
            {() => <LegalTemplatesForm />}
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
