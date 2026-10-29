import type { FC } from 'react';

import { Button, Col, Divider, Flex, Form, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { paths } from '@src/routes/paths';

import useIndianStates from '../hooks/useIndianStates';
import { companyDetailsSchema } from '../schema';

const { Title, Text } = Typography;

interface LocationState {
    cinData: Record<string, any>;
    cin: string;
}

const COMPANY_TYPE_OPTIONS = [
    'Private Limited Company',
    'Public Limited Company',
    'One Person Company',
    'Limited Liability Partnership',
    'Section 8 Company',
].map((t) => ({ label: t, value: t }));

const CompanyDetails: FC = () => {
    const navigate = useNavigate();
    const { state } = useLocation() as { state: LocationState | null };
    const { stateOptions, isLoading: statesLoading } = useIndianStates();

    const cinData = state?.cinData ?? {};
    const cin = state?.cin ?? '';

    const companyName = cinData?.company_name ?? cinData?.name ?? '';
    const incorporationDate = cinData?.date_of_incorporation ?? cinData?.incorporation_date ?? '';
    const companyType = cinData?.company_type ?? cinData?.category ?? '';
    const registeredState = cinData?.state_of_registration ?? cinData?.registered_state ?? '';
    const pan = cinData?.pan ?? '';
    const tan = cinData?.tan ?? '';
    const gst = cinData?.gstin ?? cinData?.gst ?? '';

    const initialValues = {
        cin,
        companyName,
        dateOfIncorporation: incorporationDate,
        companyType,
        registeredState,
        email: '',
        mobile: '',
        pan,
        tan,
        gst,
    };

    const handleConfirm = () => {
        navigate(`${paths.dashboard.compliance}/${paths.compliance.confirmCompanyDetails}`, {
            state: { cinData, cin },
        });
    };

    return (
        <Content>
            <Flex vertical gap={36} align="center" className="py-8 px-4 sm:px-6">
                {/* Card */}
                <div className="w-full max-w-[860px] bg-white rounded-[36px] border border-[#e6e3dd] shadow-[0px_1.56px_15.58px_4px_rgba(0,0,0,0.06)] p-8 sm:p-14">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={companyDetailsSchema}
                        onSubmit={handleConfirm}
                        enableReinitialize
                    >
                        {({ handleSubmit }) => (
                            <Form layout="vertical" onFinish={handleSubmit}>
                                <Flex vertical gap={40}>
                                    {/* Header */}
                                    <Flex vertical align="center" gap={5}>
                                        <Title
                                            level={3}
                                            className="!mb-0 !text-black !font-medium !text-center"
                                            style={{ fontSize: 24, lineHeight: 1.186 }}
                                        >
                                            Company Identification
                                        </Title>
                                        <Text
                                            className="!text-[#8b8b8b] !text-sm !text-center"
                                            style={{ lineHeight: '22px' }}
                                        >
                                            Review your company details fetched from MCA
                                        </Text>
                                    </Flex>

                                    {/* Form fields */}
                                    <div className="border border-[#c4c4c4] rounded-[22px] p-6">
                                        <Flex vertical gap={4}>
                                            {/* Row 1: CIN + Company Name */}
                                            <Row gutter={[20, 0]}>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        name="cin"
                                                        label="Corporate Identity Number (CIN)"
                                                        type="text"
                                                        placeholder="Enter CIN"
                                                        isDisabled
                                                        size="large"
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        name="companyName"
                                                        label="Company Name"
                                                        type="text"
                                                        placeholder="Enter Company Name"
                                                        isDisabled={!!companyName}
                                                        size="large"
                                                    />
                                                </Col>
                                            </Row>

                                            <Divider className="!my-2" />

                                            {/* Row 2: Date of Incorporation + Company Type */}
                                            <Row gutter={[20, 0]}>
                                                <Col xs={24} md={12}>
                                                    <DatePickerInput
                                                        name="dateOfIncorporation"
                                                        label="Date of Incorporation"
                                                        placeholder="Select Date of Incorporation"
                                                        isDisabled={!!incorporationDate}
                                                        size="large"
                                                        classes="w-full"
                                                        formItemClass="w-full"
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <SelectInputWithSearch
                                                        name="companyType"
                                                        label="Company Type"
                                                        placeholder="Select Company Type"
                                                        options={COMPANY_TYPE_OPTIONS}
                                                        isDisabled={!!companyType}
                                                        size="large"
                                                        classes="w-full"
                                                    />
                                                </Col>
                                            </Row>

                                            {/* Row 3: Registered State + Email */}
                                            <Row gutter={[20, 0]}>
                                                <Col xs={24} md={12}>
                                                    <SelectInputWithSearch
                                                        name="registeredState"
                                                        label="Registered State"
                                                        placeholder="Select State"
                                                        options={stateOptions}
                                                        isDisabled={!!registeredState}
                                                        loading={statesLoading}
                                                        size="large"
                                                        classes="w-full"
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        name="email"
                                                        label="Email for Compliance Alerts"
                                                        type="email"
                                                        placeholder="Enter Email"
                                                        isRequired
                                                        size="large"
                                                    />
                                                </Col>
                                            </Row>

                                            {/* Row 4: Mobile + PAN */}
                                            <Row gutter={[20, 0]}>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        name="mobile"
                                                        label="Mobile Number"
                                                        type="text"
                                                        placeholder="Enter Mobile Number"
                                                        addonBefore="+91"
                                                        allowNumbersOnly
                                                        maxLength={10}
                                                        isRequired
                                                        size="large"
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        name="pan"
                                                        label="PAN Number"
                                                        type="text"
                                                        placeholder="Enter PAN"
                                                        isDisabled={!!pan}
                                                        convertToUppercase
                                                        maxLength={10}
                                                        size="large"
                                                    />
                                                </Col>
                                            </Row>

                                            {/* Row 5: TAN + GST */}
                                            <Row gutter={[20, 0]}>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        name="tan"
                                                        label="TAN Number"
                                                        type="text"
                                                        placeholder="Enter TAN Number"
                                                        isDisabled={!!tan}
                                                        convertToUppercase
                                                        maxLength={10}
                                                        size="large"
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        name="gst"
                                                        label="GST Number"
                                                        type="text"
                                                        placeholder="Enter GST Number"
                                                        isDisabled={!!gst}
                                                        convertToUppercase
                                                        maxLength={15}
                                                        size="large"
                                                    />
                                                </Col>
                                            </Row>
                                        </Flex>
                                    </div>

                                    {/* Actions */}
                                    <Flex justify="flex-end" gap={18}>
                                        <Button
                                            size="large"
                                            className="!border-[#cbd5e1] !text-[#475569] !h-12 !px-[22px]"
                                            onClick={() =>
                                                navigate(
                                                    `${paths.dashboard.compliance}/${paths.compliance.companyIdentify}`
                                                )
                                            }
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="large"
                                            htmlType="submit"
                                            className="!bg-[#ff4f4f] !border-[#ff4f4f] hover:!bg-[#e03e3e] hover:!border-[#e03e3e] !h-12 !px-[22px]"
                                        >
                                            Confirm and Continue
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                </div>
            </Flex>
        </Content>
    );
};

export default CompanyDetails;
