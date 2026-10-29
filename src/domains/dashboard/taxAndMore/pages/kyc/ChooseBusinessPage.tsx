import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CalendarOutlined,
    CheckCircleFilled,
    SearchOutlined,
} from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import KycPageLayout from '../../components/kyc/KycPageLayout';
import { setSelectedBusiness } from '../../slice/taxMoreSlice';
import { KycBusiness } from '../../types';

const BusinessCard = ({
    biz,
    isSelected,
    onSelect,
}: {
    biz: KycBusiness;
    isSelected: boolean;
    onSelect: () => void;
}) => (
    <button
        type="button"
        className={`w-full text-left cursor-pointer rounded-[18px] border transition-all ${
            isSelected
                ? 'border-brandColor bg-[#fff5f5]'
                : 'border-[#cbd5e1] bg-white hover:border-[#94a3b8]'
        }`}
        style={{ padding: '18.5px' }}
        onClick={onSelect}
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
                    {(biz.legalName ?? biz.tradeName ?? biz.gstin).charAt(0)}
                </Typography.Text>
            </Flex>

            <Flex vertical gap={6} className="flex-1 min-w-0">
                <Flex gap={6} align="center" wrap="wrap">
                    <Typography.Text
                        className="font-semibold text-xl"
                        style={{ color: '#1e293b', lineHeight: '28px' }}
                    >
                        {biz.legalName ?? biz.tradeName ?? biz.gstin}
                    </Typography.Text>
                    <Tag
                        className="text-[10px] font-semibold rounded-full border-0 m-0"
                        style={{
                            backgroundColor: biz.status === 'Active' ? '#ecfdf5' : '#f1f5f9',
                            color: biz.status === 'Active' ? '#43b75d' : '#94a3b8',
                            padding: '2px 8px',
                        }}
                    >
                        {biz.status}
                    </Tag>
                </Flex>

                <Typography.Text style={{ color: '#475569', fontSize: 16, lineHeight: '24px' }}>
                    {biz.gstin}
                </Typography.Text>

                <Flex gap={24} align="center" wrap="wrap">
                    {biz.state && (
                        <Typography.Text
                            className="text-sm"
                            style={{ color: '#475569', lineHeight: '22px' }}
                        >
                            {biz.state}
                        </Typography.Text>
                    )}
                    {biz.registrationDate && (
                        <Flex gap={6} align="center">
                            <CalendarOutlined style={{ fontSize: 14, color: '#475569' }} />
                            <Typography.Text
                                className="text-sm"
                                style={{ color: '#475569', lineHeight: '22px' }}
                            >
                                Reg: {biz.registrationDate}
                            </Typography.Text>
                        </Flex>
                    )}
                </Flex>

                {biz.taxpayerType && (
                    <Typography.Text
                        className="text-xs"
                        style={{ color: '#475569', lineHeight: '18px' }}
                    >
                        {biz.taxpayerType}
                    </Typography.Text>
                )}
            </Flex>

            {isSelected && (
                <CheckCircleFilled className="text-brandColor text-xl flex-shrink-0 mt-1" />
            )}
        </Flex>
    </button>
);

const ChooseBusinessPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { selectedBusinessId, kycBusinesses } = useAppSelector(state => state.reducer.taxMore);

    return (
        <KycPageLayout currentStep={1}>
            <Flex vertical gap={26}>
                <Flex vertical gap={4}>
                    <Typography.Title
                        level={4}
                        className="!mb-0 !font-semibold"
                        style={{ color: '#1e293b', fontSize: 20, lineHeight: '28px' }}
                    >
                        Choose your business
                    </Typography.Title>
                    <Typography.Text style={{ color: '#475569', fontSize: 16, lineHeight: '24px' }}>
                        Select the GSTIN you want to file taxes for.
                    </Typography.Text>
                </Flex>

                {kycBusinesses.length === 0 ? (
                    <Flex vertical align="center" gap={12} className="py-10">
                        <Flex
                            align="center"
                            justify="center"
                            className="rounded-full"
                            style={{ width: 64, height: 64, backgroundColor: '#f1f5f9' }}
                        >
                            <SearchOutlined style={{ fontSize: 28, color: '#94a3b8' }} />
                        </Flex>
                        <Flex vertical align="center" gap={4}>
                            <Typography.Text
                                className="font-medium"
                                style={{ fontSize: 15, color: '#1e293b' }}
                            >
                                No businesses found
                            </Typography.Text>
                            <Typography.Text
                                className="text-sm text-center"
                                style={{ color: '#94a3b8', maxWidth: 280 }}
                            >
                                No GST registrations were found linked to your PAN. Please go back
                                and verify again.
                            </Typography.Text>
                        </Flex>
                        <Button danger onClick={() => navigate(-1)}>
                            Go Back & Re-verify
                        </Button>
                    </Flex>
                ) : (
                    <Flex vertical gap={12}>
                        {kycBusinesses.map(biz => (
                            <BusinessCard
                                key={biz.gstin}
                                biz={biz}
                                isSelected={selectedBusinessId === biz.gstin}
                                onSelect={() => dispatch(setSelectedBusiness(biz.gstin))}
                            />
                        ))}
                    </Flex>
                )}

                <Button
                    size="large"
                    block
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ height: 56, fontSize: 18 }}
                >
                    Go back
                </Button>
                <Button
                    type="primary"
                    danger
                    size="large"
                    block
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    disabled={!selectedBusinessId}
                    onClick={() =>
                        navigate(`${paths.dashboard.taxMore}/${paths.taxMore.kycFinalise}`)
                    }
                    style={{ height: 56, fontSize: 18 }}
                >
                    Use this GSTIN
                </Button>
            </Flex>
        </KycPageLayout>
    );
};

export default ChooseBusinessPage;
