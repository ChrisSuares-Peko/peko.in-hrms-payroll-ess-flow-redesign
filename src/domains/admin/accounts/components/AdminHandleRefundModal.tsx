import { useState } from 'react';

import { Flex, Form, Typography } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { formattedDateTime } from '@utils/dateFormat';

const { Text } = Typography;

type AdminHandleRefundModalProps = {
    open: boolean;
    handleCancel: () => void;
    isHandleRefund: (payloadData: any) => void;
    data: any;
};

const refundSchema = Yup.object().shape({
    cryptoWalletAddress: Yup.string()
        .required('Please enter the crypto wallet address')
        .test(
            'no-leading-whitespace',
            'Crypto Wallet Address cannot start with whitespace',
            value => !value || !/^\s/.test(value || '')
        )
        .min(25, 'Crypto Wallet Address cannot be shorter than 25 characters')
        .max(256, 'Crypto Wallet Address cannot be longer than 256 characters')
        .test(
            'not-only-whitespace',
            'Crypto Wallet Address cannot be only whitespace',
            value => !value || (value || '').trim() !== ''
        )
        .test(
            'no-multiple-whitespace',
            'Crypto Wallet Address cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test((value || '').trim())
        )
        .test('is-valid-wallet', 'Invalid Crypto Wallet Address', value =>
            /^[a-zA-Z0-9\-_./+=:]{25,64}$/.test((value || '').trim())
        ),
});

const AdminHandleRefundModal = ({
    open,
    handleCancel,
    isHandleRefund,
    data,
}: AdminHandleRefundModalProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (value: any) => {
        setIsLoading(true);
        try {
            await isHandleRefund(value);
        } finally {
            setIsLoading(false); // Set loading to false after completion
            handleCancel(); // close modal after completion
        }
    };

   
    return (
        <CustomModalWithForm
            modalTitle="Request Refund"
            open={open}
            handleCancel={handleCancel}
            validationSchema={refundSchema}
            handleFormSubmit={handleSubmit}
            initialValues={{
                cryptoWalletAddress: '',
                corporateTxnId: data?.corporateTxnId || '',
            }}
            isLoading={isLoading}
            firstBtnTxt="Request Refund"
        >
            <Flex vertical className="w-full">
                <Flex className="w-full mt-2 pr-8 gap-8">
                    <Flex gap={10} vertical className="w-1/2 text-start">
                        <Text className="text-gray-500">Name</Text>
                        <Text>{data?.credential.name}</Text>
                    </Flex>
                    <Flex gap={10} vertical className="w-1/2 text-start">
                        <Text className="text-gray-500">Date</Text>
                        <Text>{formattedDateTime(new Date(data?.transactionDate || ''))}</Text>
                    </Flex>
                </Flex>

                <Flex className="w-full mt-6 pr-8 gap-8">
                    <Flex gap={10} vertical className="w-1/2 text-start">
                        <Text className="text-gray-500">Transaction ID</Text>
                        <Text>{data?.corporateTxnId}</Text>
                    </Flex>
                    <Flex gap={10} vertical className="w-1/2 text-start">
                        <Text className="text-gray-500">Amount</Text>
                        <Text>{data?.order.amountInINR}</Text>
                    </Flex>
                </Flex>
                <Flex className="w-full mt-6 pr-8 gap-8">
                    <Flex gap={10} vertical className="w-1/2 text-start">
                        <Text className="text-gray-500">Payment Mode</Text>
                        <Text>{data?.order.paymentMode}</Text>
                    </Flex>
                    <Flex gap={10} vertical className="w-1/2 text-start">
                        <Text className="text-gray-500">Status</Text>
                        <Text className="text-green-500 first-letter:uppercase lowercase">
                            {data?.status}
                        </Text>
                    </Flex>
                </Flex>
                <Form layout="vertical" className="w-full mt-12 pr-8 text-start">
                    <TextInput
                        type="text"
                        name="cryptoWalletAddress"
                        label="Crypto Wallet Address"
                        placeholder="Enter Crypto Wallet Address"
                        maxLength={256}
                        minLength={25}
                        isRequired
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default AdminHandleRefundModal;
