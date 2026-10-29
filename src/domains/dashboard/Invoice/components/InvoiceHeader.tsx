import React, { useCallback, useMemo, useState } from 'react';

import { Col, Form, Row, Select } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';

import { useCustomerDropdown } from '../hooks/useCustomerDropdown';

interface customerprops {
    onCustomerSelect: any;
}

const InvoiceHeader = ({ onCustomerSelect }: customerprops) => {
    // Receive callback function as prop
    const [searchText, setSearchText] = useState('');
    const { tableData } = useCustomerDropdown(searchText);
    // const {
    //     collectorKyb: { kybStatus },
    // } = useAppSelector(state => state.reducer.invoices);

    const customerOptions = useMemo(
        () =>
            tableData?.map(customer => ({
                value: customer.value,
                label: customer.label,
                customer,
            })),
        [tableData] // Recalculate when tableData changes
    );

    const handleSearch = useCallback((value: any) => {
        setSearchText(value);
    }, []);

    const handleChange = useCallback(
        (value: any, option: any) => {
            onCustomerSelect(option.customer);
        },
        [onCustomerSelect]
    );

    return (
        <Form layout="vertical" className="w-full ">
            <Row gutter={[20, 20]}>
                <Col span={12}>
                    <Form.Item label="Saved Customer" name="customer">
                        <Select
                            showSearch
                            placeholder="Select Customer"
                            options={customerOptions}
                            onSearch={handleSearch}
                            filterOption={false}
                            onChange={handleChange}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
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
                        classes=""
                        isRequired
                    />
                </Col>
            </Row>
        </Form>
    );
};

export default InvoiceHeader;
