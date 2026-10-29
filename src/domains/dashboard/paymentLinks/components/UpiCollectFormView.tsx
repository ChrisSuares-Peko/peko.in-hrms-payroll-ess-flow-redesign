import { Flex } from 'antd';
import { Formik, Form as FormikForm } from 'formik';

import UpiCollectFormActions from './upiCollectForm/UpiCollectFormActions';
import UpiCollectFormFields from './upiCollectForm/UpiCollectFormFields';
import UpiCollectFormHeader from './upiCollectForm/UpiCollectFormHeader';
import UpiCollectHowItWorks from './upiCollectForm/UpiCollectHowItWorks';
import { upiCollectValidationSchema } from '../schema/paymentLinkSchema';
import { UpiCollectFormViewProps, upiCollectInitialValues } from '../types/paymentLinkTypes';
import { expiryOptions, howItWorks } from '../utils/data';


const UpiCollectFormView = ({ onCancel, onSend, loading }: UpiCollectFormViewProps) => (
    <Formik
        initialValues={upiCollectInitialValues}
        validationSchema={upiCollectValidationSchema}
        onSubmit={onSend}
    >
        <FormikForm>
            <Flex vertical gap={24} className="pt-2">
                <UpiCollectFormHeader />
                <UpiCollectFormFields expiryOptions={expiryOptions} />
                <UpiCollectHowItWorks items={howItWorks} />
                <UpiCollectFormActions onCancel={onCancel} loading={loading} />
            </Flex>
        </FormikForm>
    </Formik>
);

export default UpiCollectFormView;
