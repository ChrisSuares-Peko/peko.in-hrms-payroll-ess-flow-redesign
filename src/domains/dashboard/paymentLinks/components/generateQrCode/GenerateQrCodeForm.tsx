import { Button, Flex, Form, Typography } from 'antd';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { GenerateQrFormValues } from './GenerateQrCodeModal.types';
import { generateQrCodeSchema } from '../../schema/paymentLinkSchema';
import { EXPIRY_OPTIONS } from '../../utils/data';

interface GenerateQrCodeFormProps {
    loading: boolean;
    onCancel: () => void;
    onSubmit: (values: GenerateQrFormValues) => void;
}

const EXPIRY_SELECT_OPTIONS = EXPIRY_OPTIONS.map(option => ({
    label: option.label,
    value: option.minutes,
}));

const INITIAL_VALUES = {
    amount: '',
    purpose_message: '',
    expiry_time: 1440,
};

const GenerateQrCodeForm = ({ loading, onCancel, onSubmit }: GenerateQrCodeFormProps) => (
    <>
        <Flex vertical gap={4}>
            <Typography.Title
                level={4}
                className="!mb-0 !text-[20px] !font-semibold !leading-[1.25] !text-[#1F2A44]"
            >
                Generate QR Code
            </Typography.Title>
            <Typography.Text className="text-[13px] leading-[1.45] text-[#667085]">
                Enter details to create a dynamic payment QR
            </Typography.Text>
        </Flex>

        <Formik
            initialValues={INITIAL_VALUES}
            validationSchema={generateQrCodeSchema}
            onSubmit={values =>
                onSubmit({
                    amount: Number(values.amount),
                    purpose_message: values.purpose_message,
                    expiry_time: values.expiry_time,
                })
            }
        >
            {({ handleSubmit }) => (
                <Form layout="vertical">
                    <TextInput
                        name="amount"
                        type="number"
                        size="large"
                        isRequired
                        label="Amount"
                        placeholder="Enter amount"
                        maxValue={100000}
                        allowTwoDecimalsOnly
                        inputMode="decimal"
                    />

                    <TextInput
                        name="purpose_message"
                        type="text"
                        size="large"
                        isRequired
                        label="Payment Purpose"
                        placeholder="e.g. Invoice payment"
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />

                    <SelectInput
                        name="expiry_time"
                        label="QR Expiry"
                        placeholder="Select expiry"
                        options={EXPIRY_SELECT_OPTIONS}
                        size="large"
                        isRequired
                    />

                    <Flex gap={12} className="mt-3">
                        <Button size="large" block onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            danger
                            size="large"
                            block
                            loading={loading}
                            onClick={() => handleSubmit()}
                        >
                            Generate QR
                        </Button>
                    </Flex>
                </Form>
            )}
        </Formik>
    </>
);

export default GenerateQrCodeForm;
