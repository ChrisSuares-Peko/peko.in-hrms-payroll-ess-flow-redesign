import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CalendarOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import KycPageLayout from '../../components/kyc/KycPageLayout';
import useGstSetup from '../../hooks/useGstSetup';
import { completeKyc, setFinancialYear } from '../../slice/taxMoreSlice';
import { FINANCIAL_YEARS } from '../../utils/data';

const FinaliseSetupPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { selectedBusinessId, selectedFinancialYear, kycBusinesses } = useAppSelector(
        state => state.reducer.taxMore
    );

    const { create, isCreating } = useGstSetup();

    const business = kycBusinesses.find(b => b.gstin === selectedBusinessId) ?? null;

    const handleStartFiling = async () => {
        if (!selectedBusinessId || !selectedFinancialYear) return;
        const ok = await create({
            gstin: selectedBusinessId,
            financialYear: selectedFinancialYear,
        });
        if (ok) {
            dispatch(completeKyc());
            navigate(`${paths.dashboard.taxMore}/${paths.taxMore.gstFiling}`);
        }
    };

    return (
        <KycPageLayout currentStep={2}>
            <Flex vertical gap={26}>
                {business && (
                    <div
                        className="rounded-[18px] border border-[#cbd5e1]"
                        style={{ padding: '18.5px' }}
                    >
                        <Flex gap={18} align="flex-start">
                            <Flex
                                align="center"
                                justify="center"
                                className="rounded-[10px] flex-shrink-0"
                                style={{ width: 50, height: 50, backgroundColor: '#fef2f2' }}
                            >
                                <Typography.Text
                                    className="font-semibold text-xl text-brandColor"
                                    style={{ lineHeight: '28px' }}
                                >
                                    {(
                                        business.legalName ??
                                        business.tradeName ??
                                        business.gstin
                                    ).charAt(0)}
                                </Typography.Text>
                            </Flex>

                            <Flex vertical gap={6} className="flex-1 min-w-0">
                                <Flex gap={6} align="center" wrap="wrap">
                                    <Typography.Text
                                        className="font-semibold text-xl"
                                        style={{ color: '#1e293b', lineHeight: '28px' }}
                                    >
                                        {business.legalName ?? business.tradeName ?? business.gstin}
                                    </Typography.Text>
                                    <Tag
                                        className="text-[10px] font-semibold rounded-full border-0 m-0"
                                        style={{
                                            backgroundColor:
                                                business.status === 'Active'
                                                    ? '#ecfdf5'
                                                    : '#f1f5f9',
                                            color:
                                                business.status === 'Active'
                                                    ? '#43b75d'
                                                    : '#94a3b8',
                                            padding: '2px 8px',
                                        }}
                                    >
                                        {business.status}
                                    </Tag>
                                </Flex>

                                <Typography.Text
                                    style={{ color: '#475569', fontSize: 16, lineHeight: '24px' }}
                                >
                                    {business.gstin}
                                </Typography.Text>

                                <Flex gap={24} align="center" wrap="wrap">
                                    {business.state && (
                                        <Typography.Text
                                            className="text-sm"
                                            style={{ color: '#475569', lineHeight: '22px' }}
                                        >
                                            {business.state}
                                        </Typography.Text>
                                    )}
                                    {business.registrationDate && (
                                        <Flex gap={6} align="center">
                                            <CalendarOutlined
                                                style={{ fontSize: 14, color: '#475569' }}
                                            />
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#475569', lineHeight: '22px' }}
                                            >
                                                Reg: {business.registrationDate}
                                            </Typography.Text>
                                        </Flex>
                                    )}
                                </Flex>

                                {business.taxpayerType && (
                                    <Typography.Text
                                        style={{
                                            color: '#475569',
                                            fontSize: 12,
                                            lineHeight: '18px',
                                        }}
                                    >
                                        {business.taxpayerType}
                                    </Typography.Text>
                                )}
                            </Flex>
                        </Flex>
                    </div>
                )}

                <Flex vertical gap={16}>
                    <Flex vertical gap={4}>
                        <Flex gap={8} align="center">
                            <CalendarOutlined style={{ fontSize: 18, color: '#1e293b' }} />
                            <Typography.Text
                                className="font-normal text-base"
                                style={{ color: '#1e293b', lineHeight: '24px' }}
                            >
                                Financial Year
                            </Typography.Text>
                        </Flex>
                        <Typography.Text
                            className="text-xs"
                            style={{ color: '#475569', lineHeight: '18px' }}
                        >
                            Which year do you want to start filing for?
                        </Typography.Text>
                    </Flex>

                    <Flex gap={16} wrap="wrap">
                        {FINANCIAL_YEARS.map(fy => (
                            <button
                                key={fy}
                                type="button"
                                onClick={() => dispatch(setFinancialYear(fy))}
                                className={`rounded-lg text-sm font-medium transition-all border ${
                                    selectedFinancialYear === fy
                                        ? 'bg-brandColor text-white border-brandColor'
                                        : 'bg-white text-titleText border-[#cbd5e1] hover:border-[#94a3b8]'
                                }`}
                                style={{ height: 40, minWidth: 120, padding: '0 12px' }}
                            >
                                {fy}
                            </button>
                        ))}
                    </Flex>
                </Flex>

                <Flex
                    align="flex-start"
                    gap={8}
                    className="rounded-[14px] border border-[#cbd5e1] px-6 py-4"
                    style={{ backgroundColor: '#f8fafc' }}
                >
                    <InfoCircleOutlined
                        style={{ fontSize: 22, color: '#475569', marginTop: 2, flexShrink: 0 }}
                    />
                    <Typography.Text
                        className="text-sm"
                        style={{ color: '#1e293b', lineHeight: '22px' }}
                    >
                        After setup, you&apos;ll be taken to the GST Filing dashboard to start
                        uploading invoices.
                    </Typography.Text>
                </Flex>

                <Flex gap={26}>
                    <Button
                        size="large"
                        block
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        style={{
                            height: 56,
                            fontSize: 18,
                            borderColor: '#cbd5e1',
                            color: '#475569',
                        }}
                    >
                        Go Back
                    </Button>
                    <Button
                        type="primary"
                        danger
                        size="large"
                        block
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        disabled={!selectedFinancialYear || !selectedBusinessId}
                        loading={isCreating}
                        onClick={handleStartFiling}
                        style={{ height: 56, fontSize: 18 }}
                    >
                        Start Filing
                    </Button>
                </Flex>
            </Flex>
        </KycPageLayout>
    );
};

export default FinaliseSetupPage;
