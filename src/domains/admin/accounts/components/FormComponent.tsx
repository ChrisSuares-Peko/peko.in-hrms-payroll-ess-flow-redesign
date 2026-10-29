import React from 'react';

import { Button, Col, Row, Skeleton } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { DropDown } from '@customtypes/general';

interface formProps {
    corporateData: DropDown | undefined;
    operatorData: DropDown | undefined;
    isLoading: boolean;
    setSearchOperator: (val: string) => void;
    setSearchCorporate: (val: string) => void;
    accessPermission: any;
}
const FormComponent = ({
    corporateData,
    operatorData,
    isLoading,
    setSearchOperator,
    setSearchCorporate,
    accessPermission
}: formProps) => (
    <Row gutter={[20, 10]}>
        <Col xs={24} md={12}>
            {corporateData ? (
                <SelectInput
                    isRequired
                    name="corporateId"
                    options={corporateData}
                    placeholder="Please select a corporate user"
                    label="Select Corporate"
                    allowClear
                    filterOption={false}
                    showSearch
                    onSearch={setSearchCorporate}
                />
            ) : (
                <Skeleton.Input active block />
            )}
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                name="rechargeAmount"
                label="Recharge Amount"
                type="text"
                placeholder="Please enter recharge amount "
                isRequired
                classes=" rounded-sm"
                allowTwoDecimalsOnly
                maxLength={10}
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                name="merchantCommission"
                label="Merchant Commission"
                type="text"
                placeholder="Please enter merchant commission "
                isRequired
                classes=" rounded-sm"
                allowTwoDecimalsOnly
                maxLength={10}
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                name="adminCommission"
                label="Admin Commission"
                type="text"
                placeholder="Please enter admin commission "
                isRequired
                classes=" rounded-sm"
                allowTwoDecimalsOnly
                maxLength={10}
            />
        </Col>
        <Col xs={24} md={12}>
            {operatorData ? (
                <SelectInput
                    isRequired
                    name="serviceOperatorId"
                    options={operatorData}
                    placeholder="Please select a service provider"
                    label="Service Provider"
                    allowClear
                    filterOption={false}
                    showSearch
                    onSearch={setSearchOperator}
                />
            ) : (
                <Skeleton.Input active block />
            )}
        </Col>

        <Col xs={24} md={12}>
            <SelectInput
                isRequired
                name="serviceType"
                options={[
                    { value: 1, label: 'Bill Payment' },
                    { value: 2, label: 'Topup' },
                ]}
                placeholder="Please select a service type"
                label="Service Type"
            />
        </Col>

        <Col xs={24} md={12}>
            <TextInput
                name="transactionId"
                label="Transaction ID"
                type="text"
                placeholder="Please enter transaction ID "
                isRequired
                classes=" rounded-sm"
                allowNumbersOnly
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                name="orderId"
                label="Order ID"
                type="text"
                placeholder="Please enter order ID "
                isRequired
                classes=" rounded-sm"
                allowNumbersOnly
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                name="providerId"
                label="Provider ID"
                type="text"
                placeholder="Please enter provider ID "
                isRequired
                classes=" rounded-sm"
                allowNumbersOnly
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                name="accountNo"
                label="Account/ Phone No"
                type="text"
                placeholder="Please enter Account/ Phone No "
                isRequired
                classes=" rounded-sm"
                allowNumbersOnly
                maxLength={10}
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                name="surcharge"
                label="Surcharge"
                type="text"
                placeholder="Please enter surcharge "
                isRequired
                classes=" rounded-sm"
                allowTwoDecimalsOnly
                maxLength={10}
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                name="remarks"
                label="Remarks"
                type="text"
                placeholder="Please enter remarks "
                classes=" rounded-sm"
            />
        </Col>
        {accessPermission && accessPermission.update && (
        <Button htmlType="submit" type="primary" danger className="mt-5 " loading={isLoading}>
            Submit
        </Button>
        )}
    </Row>
);

export default FormComponent;
