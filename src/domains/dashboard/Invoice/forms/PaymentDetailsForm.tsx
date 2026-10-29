import React from 'react';

import { Flex, Form } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';

const PaymentDetailsForm = () => (
    // const {
    //     collectorKyb: { kybStatus },
    // } = useAppSelector(state => state.reducer.invoices);

    <Flex vertical gap={16} className="w-full">
        <Form layout="vertical">
            <Flex vertical className="mb-0">
                <SelectInput
                    options={[
                        {
                            value: 'cash',
                            label: 'Cash',
                        },
                        {
                            value: 'bank',
                            label: 'Bank',
                        },
                        {
                            value: 'cheque',
                            label: 'Cheque',
                        },
                        // kybStatus === 'APPROVED' && {
                        //     value: 'payment link',
                        //     label: 'Payment Link',
                        // },
                        {
                            value: 'others',
                            label: 'Others',
                        },
                    ].filter(Boolean)}
                    name="paymentMode"
                    label="Payment Method"
                    placeholder="Payment Method"
                    classes="mb-0"
                    isRequired
                />
            </Flex>
        </Form>
    </Flex>
);
export default PaymentDetailsForm;
