import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Col, Flex, Form, Row, Select } from 'antd';
import { useFormikContext } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import TypographyText from '@components/atomic/typography/typographyText';
import { DropDown } from '@customtypes/general';

import useGstinLookup from '../../hooks/useGstinLookup';
import { CustomerOption } from '../../types/createInvoice';
import { BuyerFormValues } from '../../types/generateIrn';
import { mapGstinToIrnFields } from '../../utils/gstinLookupMapper';

interface Props {
    stateOptions: DropDown;
    isLoadingStates: boolean;
    customers: CustomerOption[];
    isLoadingCustomers: boolean;
}

const BuyerForm: React.FC<Props> = ({
    stateOptions,
    isLoadingStates,
    customers,
    isLoadingCustomers,
}) => {
    const { values, setFieldValue, setFieldTouched } = useFormikContext<BuyerFormValues>();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
    const { isSearching, search } = useGstinLookup();

    const handleFetchDetails = async () => {
        const data = await search(values.buyerGstin);
        if (!data) return;
        const fields = mapGstinToIrnFields(data);
        if (fields.legalName) setFieldValue('legalName', fields.legalName);
        if (fields.tradeName) setFieldValue('tradeName', fields.tradeName);
        if (fields.address1) setFieldValue('address1', fields.address1);
        if (fields.location) setFieldValue('location', fields.location);
        if (fields.pinCode) setFieldValue('pinCode', fields.pinCode);
        if (fields.state) {
            setFieldValue('state', fields.state);
            setFieldValue('placeOfSupply', fields.state);
        }
    };

    const customerOptions = customers.map(c => ({ value: String(c.id), label: c.name }));

    const hasAutoSelected = useRef(false);
    useEffect(() => {
        if (!hasAutoSelected.current && values.customerId && customers.length > 0) {
            setSelectedCustomerId(String(values.customerId));
            hasAutoSelected.current = true;
        }
    }, [values.customerId, customers]);

    const handleCustomerSelect = useCallback(
        (value: string) => {
            setSelectedCustomerId(value);
            const c = customers.find(o => String(o.id) === value);
            if (!c) return;
            setFieldValue('buyerGstin', c.gstin || '');
            setFieldValue('legalName', c.name || '');
            setFieldValue('tradeName', c.name || '');
            setFieldValue('phoneNumber', c.phoneNumber || '');
            setFieldValue('address1', c.primaryAddress || '');
            setFieldValue('location', c.primaryCity || '');
            setFieldValue('pinCode', c.primaryPincode || '');
            setFieldValue('state', c.primaryState || '');
            setFieldValue('placeOfSupply', c.primaryState || '');
            ['buyerGstin', 'legalName', 'tradeName', 'phoneNumber', 'address1', 'location', 'pinCode', 'state', 'placeOfSupply'].forEach(f =>
                setFieldTouched(f, false)
            );
        },
        [customers, setFieldValue, setFieldTouched]
    );

    const handleCustomerClear = useCallback(() => {
        setSelectedCustomerId(undefined);
        setFieldValue('buyerGstin', '');
        setFieldValue('legalName', '');
        setFieldValue('tradeName', '');
        setFieldValue('phoneNumber', '');
        setFieldValue('address1', '');
        setFieldValue('location', '');
        setFieldValue('pinCode', '');
        setFieldValue('state', '');
        setFieldValue('placeOfSupply', '');
    }, [setFieldValue]);

    return (
        <Form layout="vertical" className="w-full [&_.ant-form-item]:mb-0">
            <Row gutter={[56, 20]}>
                <Col xs={24} md={12}>
                    <Form.Item label={<TypographyText className="text-sm font-medium text-[#374151]">Select Customer</TypographyText>}>
                        <Select
                            value={selectedCustomerId}
                            options={customerOptions}
                            onChange={handleCustomerSelect}
                            onClear={handleCustomerClear}
                            placeholder="Search and select a saved customer"
                            loading={isLoadingCustomers}
                            disabled={isLoadingCustomers}
                            showSearch
                            allowClear
                            filterOption={(input, option) =>
                                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            className="w-full"
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Flex gap={8} align="flex-end">
                        <TextInput
                            name="buyerGstin"
                            label="Buyer GSTIN"
                            placeholder="Enter 15-digit GSTIN"
                            type="text"
                            maxLength={15}
                            convertToUppercase
                            isRequired
                            classes="w-full"
                            formItemClass="flex-1 min-w-0 [&_.ant-form-item-explain]:absolute"
                        />
                        <Button
                            className="flex-shrink-0"
                            loading={isSearching}
                            onClick={handleFetchDetails}
                        >
                            Fetch Details
                        </Button>
                    </Flex>
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="legalName"
                        label="Legal Name"
                        placeholder="Enter Legal Name"
                        type="text"
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="tradeName"
                        label="Trade Name"
                        placeholder="Enter Trade Name"
                        type="text"
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="phoneNumber"
                        label="Phone Number"
                        placeholder="Enter 10-digit mobile number"
                        type="text"
                        maxLength={10}
                        allowNumbersOnly
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="address1"
                        label="Address"
                        placeholder="Enter Address"
                        type="text"
                        allowAddressFormat
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="location"
                        label="Location / City"
                        placeholder="Enter Location"
                        type="text"
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="pinCode"
                        label="PIN Code"
                        placeholder="Enter 6-digit PIN"
                        type="text"
                        maxLength={6}
                        allowNumbersOnly
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInputWithSearch
                        name="state"
                        label="State"
                        placeholder="Select State"
                        options={stateOptions}
                        isDisabled={isLoadingStates}
                        loading={isLoadingStates}
                        isRequired
                        handleChange={val => setFieldValue('placeOfSupply', val)}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInputWithSearch
                        name="placeOfSupply"
                        label="Place of Supply (POS)"
                        placeholder="Select Place of Supply"
                        options={stateOptions}
                        isDisabled={isLoadingStates}
                        loading={isLoadingStates}
                        isRequired
                    />
                </Col>
            </Row>
        </Form>
    );
};

export default BuyerForm;
