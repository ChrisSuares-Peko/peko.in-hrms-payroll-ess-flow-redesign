import { forwardRef, useImperativeHandle, useRef } from 'react';

import { Flex } from 'antd';
import dayjs from 'dayjs';
import { Formik, FormikProps } from 'formik';

import AgreementDetailsForm from '../../forms/createAgreement/AgreementDetailsForm';
import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';
import { agreementDetailsSchema } from '../../schema/createAgreement/agreementDetailsSchema';
import { AgreementDetailsFormValues } from '../../types/agreement';
import type { Step3Ref } from '../../types/createAgreement';

interface Props {
    onSubmit: (values: AgreementDetailsFormValues) => Promise<void>;
    initialValues?: Partial<AgreementDetailsFormValues>;
}

const DEFAULT_VALUES: AgreementDetailsFormValues = {
    title: '',
    contractType: '',
    paymentTerms: '',
    currency: 'INR',
    startDate: dayjs().format('YYYY-MM-DD'),
    description: '',
};

const Step3AgreementDetails = forwardRef<Step3Ref, Props>(({ onSubmit, initialValues }, ref) => {
    const formikRef = useRef<FormikProps<AgreementDetailsFormValues>>(null);
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({ schema: agreementDetailsSchema });

    useImperativeHandle(ref, () => ({
        submitForm: () => {
            const formik = formikRef.current;
            if (formik) {
                handleFormSubmitWithAutoFocus(formik.handleSubmit, formik.setFieldTouched, formik.values);
            }
        },
        getFormValues: () => formikRef.current?.values,
    }));

    return (
        <Flex vertical className="p-6">
            <Formik
                innerRef={formikRef}
                initialValues={{ ...DEFAULT_VALUES, ...initialValues }}
                validationSchema={agreementDetailsSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    await onSubmit(values);
                    setSubmitting(false);
                }}
            >
                <AgreementDetailsForm />
            </Formik>
        </Flex>
    );
});

Step3AgreementDetails.displayName = 'Step3AgreementDetails';

export default Step3AgreementDetails;
