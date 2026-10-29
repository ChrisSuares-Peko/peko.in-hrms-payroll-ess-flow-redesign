import { Flex, Form, Select, Typography } from 'antd';
import { useField } from 'formik';

import TextInput from '@src/components/atomic/inputs/TextInput';

interface ExpiryOption {
    value: number;
    label: string;
}

interface UpiCollectFormFieldsProps {
    expiryOptions: ExpiryOption[];
}

const ExpirySelectField = ({ expiryOptions }: UpiCollectFormFieldsProps) => {
    const [field, meta, helpers] = useField<number>('expiry');

    return (
        <Form.Item
            label={<span>Request Expiry</span>}
            colon={false}
            validateStatus={meta.touched && meta.error ? 'error' : ''}
            help={
                meta.touched && meta.error
                    ? meta.error
                    : 'The payment request will expire if not approved within this time'
            }
        >
            <Select
                size="large"
                placeholder="Select Request Expiry"
                options={expiryOptions}
                className="w-full"
                value={field.value}
                onChange={val => helpers.setValue(val)}
                onBlur={() => helpers.setTouched(true)}
                status={meta.touched && meta.error ? 'error' : undefined}
            />
        </Form.Item>
    );
};

const UpiCollectFormFields = ({ expiryOptions }: UpiCollectFormFieldsProps) => (
    <Flex vertical gap={4}>
        <TextInput
            name="amount"
            label="Amount"
            placeholder="Enter amount"
            type="text"
            size="large"
            isRequired
            allowTwoDecimalsOnly
            inputMode="decimal"
        />

        <TextInput
            name="upiId"
            label="Customer UPI ID"
            placeholder="Customer UPI ID"
            type="text"
            size="large"
            isRequired
            allowAlphabetsNumberAndSpecialCharacters={['@', '.', '-', '_']}
        />
        <Typography.Text className="text-gray-400 text-xs -mt-4 mb-2">
            e.g. username@paytm, 9876543210@ybl
        </Typography.Text>

        <TextInput
            name="customerName"
            label="Customer Name"
            placeholder="Enter customer name"
            type="text"
            size="large"
            isRequired
            allowAlphabetsAndSpaceOnly
        />

        <TextInput
            name="email"
            label="Customer Email"
            placeholder="customer@email.com"
            type="email"
            size="large"
            isRequired
            allowEmailsOnly
        />

        <TextInput
            name="phone"
            label="Customer Phone"
            placeholder="10-digit mobile number"
            type="text"
            size="large"
            isRequired
            allowNumbersOnly
            maxLength={10}
            inputMode="numeric"
            prefix={
                <Flex align="center" gap={4}>
                    <span style={{ fontSize: 14 }}>🇮🇳</span>
                    <Typography.Text className="text-sm text-gray-500">+91</Typography.Text>
                </Flex>
            }
        />

        <ExpirySelectField expiryOptions={expiryOptions} />
    </Flex>
);

export default UpiCollectFormFields;
