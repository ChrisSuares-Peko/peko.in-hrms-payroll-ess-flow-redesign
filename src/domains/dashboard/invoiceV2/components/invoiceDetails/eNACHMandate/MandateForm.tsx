import { Button, Card, Flex } from 'antd';
import { Formik } from 'formik';

import {
    CustomerDetailsForm,
    MandateConfigForm,
    PurposeForm,
} from '../../../forms/invoiceDetails/ENACHMandateForms';
import { useFormAutoFocus } from '../../../hooks/useFormAutoFocus';
import { eNACHMandateSchema } from '../../../schema/invoiceDetails/eNACHMandateSchema';
import { ENACHMandateFormValues } from '../../../types/invoiceDetails';
import LeftHeader from '../../shared/LeftHeader';

type Props = {
    initialValues: Partial<ENACHMandateFormValues['customer']>;
    onBack: () => void;
    onSubmit: (values: ENACHMandateFormValues) => Promise<void>;
};

const INITIAL_VALUES: ENACHMandateFormValues = {
    customer: { name: '', email: '', mobile: '' },
    mandate: {
        maxAmount: '',
        frequency: 'monthly',
        startDate: null,
        endDate: null,
        untilCancelled: false,
    },
    purpose: { description: '' },
};

const MandateForm = ({ initialValues, onBack, onSubmit }: Props) => {
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({
        schema: eNACHMandateSchema,
    });

    return (
    <Formik
        enableReinitialize
        initialValues={{
            ...INITIAL_VALUES,
            customer: {
                ...INITIAL_VALUES.customer,
                name: initialValues.name ?? '',
                email: initialValues.email ?? '',
                mobile: initialValues.mobile ?? '',
            },
        }}
        validationSchema={eNACHMandateSchema}
        onSubmit={async (values, { setSubmitting }) => {
            await onSubmit(values);
            setSubmitting(false);
        }}
    >
        {({ handleSubmit, isSubmitting, setFieldTouched, values }) => (
            <Flex vertical gap={16}>
                <LeftHeader
                    title="Create eNACH Mandate"
                    description="Set up a recurring payment mandate for your customer"
                />

                <Card className="rounded-2xl [&_.ant-card-body]:flex [&_.ant-card-body]:gap-3">
                    <Flex vertical gap={4}>
                        <LeftHeader title="Customer Details" titleClass="text-sm" />
                        <CustomerDetailsForm />
                    </Flex>
                </Card>

                <Card className="rounded-2xl">
                    <Flex vertical gap={4}>
                        <LeftHeader title="Mandate Configuration" titleClass="text-sm" />
                        <MandateConfigForm />
                    </Flex>
                </Card>

                <Card className="rounded-2xl">
                    <Flex vertical gap={4}>
                        <LeftHeader title="Purpose" titleClass="text-sm" />
                        <PurposeForm />
                    </Flex>
                </Card>

                <Flex gap={12}>
                    <Button block className="h-10 text-[#475569]" onClick={onBack}>
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
                        Proceed to Customer Authorisation
                    </Button>
                </Flex>
            </Flex>
        )}
    </Formik>
    );
};

export default MandateForm;
