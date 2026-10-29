import React from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Row } from 'antd';
import { useFormikContext } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { DropDown } from '@customtypes/general';

import useGstinLookup from '../../hooks/useGstinLookup';
import { SellerFormValues } from '../../types/generateIrn';
import { mapGstinToIrnFields } from '../../utils/gstinLookupMapper';

interface Props {
    stateOptions: DropDown;
    isLoadingStates: boolean;
    isSellerDefaultsLoading: boolean;
}

const SellerForm: React.FC<Props> = ({ stateOptions, isLoadingStates, isSellerDefaultsLoading }) => {
    const { values, setFieldValue } = useFormikContext<SellerFormValues>();
    const { isSearching, search } = useGstinLookup();

    const loadingSuffix = isSellerDefaultsLoading
        ? <LoadingOutlined className="text-[#9CA3AF]" />
        : undefined;

    const handleFetchDetails = async () => {
        const data = await search(values.sellerGstin);
        if (!data) return;
        const fields = mapGstinToIrnFields(data);
        if (fields.legalName) setFieldValue('legalName', fields.legalName);
        if (fields.tradeName) setFieldValue('tradeName', fields.tradeName);
        if (fields.address1) setFieldValue('address1', fields.address1);
        if (fields.location) setFieldValue('location', fields.location);
        if (fields.pinCode) setFieldValue('pinCode', fields.pinCode);
        if (fields.state) setFieldValue('state', fields.state);
    };

    return (
        <Form layout="vertical" className="w-full [&_.ant-form-item]:mb-0">
            <Row gutter={[56, 20]}>
                <Col xs={24} md={12}>
                    <Flex gap={8} align="flex-end">
                        <TextInput
                            name="sellerGstin"
                            label="Seller GSTIN"
                            placeholder="Enter 15-digit GSTIN"
                            type="text"
                            maxLength={15}
                            convertToUppercase
                            isRequired
                            classes="w-full"
                            formItemClass="flex-1 min-w-0 [&_.ant-form-item-explain]:absolute"
                            isDisabled
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
                        isDisabled={isSellerDefaultsLoading}
                        suffix={loadingSuffix}
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
                        name="address1"
                        label="Address"
                        placeholder="Enter Address"
                        type="text"
                        allowAddressFormat
                        isRequired
                        isDisabled={isSellerDefaultsLoading}
                        suffix={loadingSuffix}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="location"
                        label="Location / City"
                        placeholder="Enter Location"
                        type="text"
                        isRequired
                        isDisabled={isSellerDefaultsLoading}
                        suffix={loadingSuffix}
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
                        isDisabled={isSellerDefaultsLoading}
                        suffix={loadingSuffix}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <SelectInputWithSearch
                        name="state"
                        label="State"
                        placeholder="Select State"
                        options={stateOptions}
                        isDisabled={isLoadingStates || isSellerDefaultsLoading}
                        loading={isLoadingStates || isSellerDefaultsLoading}
                        isRequired
                    />
                </Col>
            </Row>
        </Form>
    );
};

export default SellerForm;
