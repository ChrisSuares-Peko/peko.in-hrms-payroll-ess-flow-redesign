import type { FC } from 'react';

import { Button, Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import iconBasicInfo from '../assets/icon-basic-info.svg';
import iconDirectors from '../assets/icon-directors.svg';
import iconRegisteredOffice from '../assets/icon-registered-office.svg';
import iconShareCapital from '../assets/icon-share-capital.svg';
import iconTickCircleWhite from '../assets/icon-tick-circle-white.svg';

const { Title, Text } = Typography;

interface Director {
    designation?: string;
    name?: string;
    din?: string;
}

interface LocationState {
    cinData: Record<string, any>;
    cin: string;
}

interface SectionCardProps {
    icon: string;
    title: string;
    children: React.ReactNode;
}

const SectionCard: FC<SectionCardProps> = ({ icon, title, children }) => (
    <div className="bg-white border-[0.37px] border-[#e1e1e1] rounded-[22px] px-6 pt-4 pb-6 w-full">
        <Flex align="center" gap={14} className="pb-4">
            <Flex
                align="center"
                justify="center"
                className="bg-[#fff4f4] shrink-0"
                style={{ width: 37, height: 37, borderRadius: 9.99 }}
            >
                <img src={icon} alt="" style={{ width: 24, height: 24 }} />
            </Flex>
            <Text className="!text-black !font-medium !text-sm">{title}</Text>
        </Flex>
        <hr className="border-0 border-t border-[#e8e8e8] -mx-6 my-0" />
        <div className="mt-8">{children}</div>
    </div>
);

const InfoField: FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="bg-[#fafafa] rounded-[14px] pl-4 py-3.5 flex flex-col gap-1.5 justify-center" style={{ height: 72.25 }}>
        <Text className="!text-[#99a1af] !text-sm !leading-[22px]">{label}</Text>
        <Text className="!text-[#101828] !font-semibold !text-base !leading-6">
            {value || '—'}
        </Text>
    </div>
);

const ConfirmCompanyDetails: FC = () => {
    const navigate = useNavigate();
    const { state } = useLocation() as { state: LocationState | null };

    const cinData = state?.cinData ?? {};
    const cin = state?.cin ?? 'U74999MH2024PTC308765';

    const companyName       = cinData?.company_name ?? cinData?.name ?? 'Sigma D1 Logistics Pvt. Ltd.';
    const incorporationDate = cinData?.date_of_incorporation ?? cinData?.incorporation_date ?? '15/03/2024';
    const companyType       = cinData?.company_type ?? cinData?.category ?? 'Private Limited Company';
    const address           = cinData?.registered_address ?? cinData?.registered_office ?? '123, Brigade Road, Mumbai, Maharashtra - 400001';
    const shareCapitalRaw   = cinData?.authorized_capital ?? cinData?.share_capital ?? '10,00,000';
    const shareCapitalNum   = parseFloat(String(shareCapitalRaw).replace(/[^0-9.]/g, ''));
    const shareCapital      = Number.isNaN(shareCapitalNum) ? String(shareCapitalRaw) : `₹${shareCapitalNum.toFixed(2)}`;
    const directors: Director[] = cinData?.directors ?? [
        { designation: 'Managing Director', name: 'Rajesh Kumar', din: 'DIN12345678' },
        { designation: 'Director', name: 'Priya Sharma', din: 'DIN87654321' },
    ];

    const handleConfirm = () => {
        navigate(`${paths.dashboard.compliance}/${paths.compliance.dashboard}`, { replace: true });
    };


    return (
        <Content>
            <Flex vertical gap={36} align="center" className="py-8 px-4 sm:px-6">
                <div className="w-full max-w-[900px] bg-white rounded-[36px] border border-[#e6e3dd] shadow-[0px_1.56px_15.58px_4px_rgba(0,0,0,0.06)] px-6 sm:px-[52px] py-[42px]">
                    <Flex vertical gap={40}>

                        {/* Header */}
                        <Flex vertical align="center" gap={5}>
                            <Title
                                level={3}
                                className="!mb-0 !text-black !font-medium !text-center"
                                style={{ fontSize: 24, lineHeight: 1.186 }}
                            >
                                Confirm Company Details
                            </Title>
                            <Text
                                className="!text-[#8b8b8b] !text-sm !text-center"
                                style={{ lineHeight: '22px' }}
                            >
                                Please verify that all information is correct
                            </Text>
                        </Flex>

                        <Flex vertical gap={24}>
                            {/* Pre-filled banner */}
                            {/* <Flex
                                align="center"
                                gap={12}
                                className="bg-[#ecfdf5] border border-[#e2f3e6] rounded-[70px] px-3 py-3"
                            >
                                <img src={iconTickCircleGreen} alt="" className="shrink-0" style={{ width: 24, height: 24 }} />
                                <Text className="!text-[#43b75d] !text-sm">
                                    We&apos;ve pre-filled your details from your Peko incorporation
                                </Text>
                            </Flex> */}

                            {/* Basic Information */}
                            <SectionCard icon={iconBasicInfo} title="Basic Information">
                                <Flex vertical gap={16}>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <InfoField label="CIN" value={cin} />
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <InfoField label="Company Name" value={companyName} />
                                        </Col>
                                    </Row>
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <InfoField label="Incorporation Date" value={incorporationDate} />
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <InfoField label="Company Type" value={companyType} />
                                        </Col>
                                    </Row>
                                </Flex>
                            </SectionCard>

                            {/* Registered Office */}
                            <SectionCard icon={iconRegisteredOffice} title="Registered Office">
                                <InfoField label="Registered Address" value={address} />
                            </SectionCard>

                            {/* Directors */}
                            <SectionCard icon={iconDirectors} title="Directors">
                                <Flex vertical gap={16} className="bg-[#fafafa] rounded-[14px] px-4 py-3.5">
                                    {directors.length > 0 ? (
                                        directors.map((director, index) => (
                                            <div key={index}>
                                                <Flex justify="space-between" align="start" gap={12} className="flex-col sm:flex-row sm:items-center">
                                                    <Flex vertical gap={6}>
                                                        <Text className="!text-[#99a1af] !text-sm !leading-[22px]">
                                                            {director.designation ?? 'Director'}
                                                        </Text>
                                                        <Text className="!text-[#101828] !font-semibold !text-base !leading-6">
                                                            {director.name ?? '—'}
                                                        </Text>
                                                    </Flex>
                                                    <Text className="!text-[#101828] !font-normal !text-base !leading-6 whitespace-nowrap">
                                                        {director.din ?? ''}
                                                    </Text>
                                                </Flex>
                                                {index < directors.length - 1 && (
                                                    <Divider className="!my-0 !mt-4" />
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <Text className="!text-[#99a1af] !text-sm">
                                            No director information available
                                        </Text>
                                    )}
                                </Flex>
                            </SectionCard>

                            {/* Authorized Share Capital */}
                            <SectionCard icon={iconShareCapital} title="Authorized Share Capital">
                                <InfoField label="Share Capital" value={shareCapital} />
                            </SectionCard>
                        </Flex>

                        {/* Actions */}
                        <Flex justify="end" gap={18} className="flex-col sm:flex-row w-full">
                            <Button
                                size="large"
                                onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.companyIdentify}`, { state: { cin } })}
                                className="!h-12 !px-[22px] !border-[#cbd5e1] !text-[#475569] hover:!border-[#94a3b8] hover:!text-[#475569] w-full sm:w-auto"
                            >
                                Back
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<img src={iconTickCircleWhite} alt="" style={{ width: 24, height: 24 }} />}
                                onClick={handleConfirm}
                                className="!bg-[#ff4f4f] !border-[#ff4f4f] hover:!bg-[#e03e3e] hover:!border-[#e03e3e] !h-12 !px-[22px] !flex !items-center justify-center w-full sm:w-auto"
                            >
                                Confirm and continue
                            </Button>
                        </Flex>
                    </Flex>
                </div>
            </Flex>
        </Content>
    );
};

export default ConfirmCompanyDetails;
