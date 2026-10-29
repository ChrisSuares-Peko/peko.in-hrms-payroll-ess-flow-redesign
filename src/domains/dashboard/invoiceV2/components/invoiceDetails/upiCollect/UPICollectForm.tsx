import { BulbOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { Formik } from 'formik';

import SendUPICollectForm from '../../../forms/collectPayment/SendUPICollectForm';
import { useFormAutoFocus } from '../../../hooks/useFormAutoFocus';
import { sendUPICollectSchema } from '../../../schema/invoiceDetails/sendUPICollectSchema';
import { SendUPICollectFormValues } from '../../../types/invoiceDetails';
import InfoCard from '../../shared/InfoCard';
import LeftHeader from '../../shared/LeftHeader';

const INITIAL_VALUES: SendUPICollectFormValues = {
    amount: '',
    upiId: '',
    requestExpiry: null,
};

type Props = {
    initialAmount?: string;
    onSubmit: (values: SendUPICollectFormValues) => Promise<void>;
    onCancel: () => void;
};

const UPICollectForm = ({ initialAmount, onSubmit, onCancel }: Props) => {
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({
        schema: sendUPICollectSchema,
    });

    return (
    <Formik
        initialValues={{ ...INITIAL_VALUES, amount: initialAmount ?? '' }}
        validationSchema={sendUPICollectSchema}
        onSubmit={onSubmit}
        enableReinitialize
    >
        {({ handleSubmit, isSubmitting, setFieldTouched, values }) => (
            <Flex vertical gap={24}>
                <LeftHeader
                    title="Send UPI Collect"
                    description="Customer will receive a payment request in their UPI app"
                />
                <SendUPICollectForm />
                <InfoCard
                    titleIcon={<BulbOutlined className="text-lg text-[#1e293b]" />}
                    title="How UPI Collect works"
                    items={[
                        'Customer receives a notification in their UPI app',
                        'They can approve or decline the payment request',
                        "You'll be notified instantly when the payment is completed",
                    ]}
                />
                <Flex gap={12}>
                    <Button block className="h-10 text-[#475569]" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        danger
                        block
                        className="h-10"
                        loading={isSubmitting}
                        onClick={() => handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, values)}
                    >
                        Send UPI Request
                    </Button>
                </Flex>
            </Flex>
        )}
    </Formik>
    );
};

export default UPICollectForm;
