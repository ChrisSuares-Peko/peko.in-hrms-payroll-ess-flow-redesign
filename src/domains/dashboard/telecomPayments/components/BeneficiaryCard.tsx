import React, { useCallback } from 'react';

import { Button, Card, Flex, Image, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

import airtelIcon from '../assets/icons/airtel.png';
import bsnlIcon from '../assets/icons/bsnl.png';
import jioIcon from '../assets/icons/jio.png';
import viIcon from '../assets/icons/vi.png';
import PostpaidIcon from '../assets/iconsNew/Postpaid.svg';
import PrepaidIcon from '../assets/iconsNew/Prepaid.svg';
import useFetchBillApi from '../hooks/usePayment';
import { Beneficiary } from '../types/index';
import { formatServiceProvider, telecomPayments } from '../utils/data';

const { Text } = Typography;

interface BeneficiaryCardProps {
    beneficiary: Beneficiary;
    handleEdit?: () => void;
}

const getServiceImage = (serviceProvider: string) => {
    if (serviceProvider.includes('airtel')) return airtelIcon;
    if (serviceProvider.includes('bsnl')) return bsnlIcon;
    if (serviceProvider.includes('jio')) return jioIcon;
    if (
        serviceProvider.includes('vi') ||
        serviceProvider.includes('vodafone') ||
        serviceProvider.includes('idea')
    ) {
        return viIcon;
    }
    return null;
};

// Local service icon (Prepaid / Postpaid) for the beneficiary
const getLocalServiceIcon = (beneficiary: Beneficiary) => {
    const matched = telecomPayments.find(s => s.accessKey === beneficiary?.accessKey)?.icon;
    if (matched) return matched;
    const title = (beneficiary?.serviceOperator?.serviceProvider || '').toLowerCase();
    return title.includes('prepaid') ? PrepaidIcon : PostpaidIcon;
};

const BeneficiaryCard = ({ beneficiary, handleEdit }: BeneficiaryCardProps) => {
    const { handleBeneficiaryPay, isLoading } = useFetchBillApi();
    const normalizedServiceProvider = (
        beneficiary?.serviceProvider ||
        beneficiary?.serviceOperator?.serviceProvider ||
        ''
    )
        .toLowerCase()
        .trim();
    const matchedServiceImage = getServiceImage(normalizedServiceProvider);
    const serviceImage = matchedServiceImage || getLocalServiceIcon(beneficiary);
    const location = useLocation();
    const { xs } = useScreenSize();
    const handlePayNow = useCallback(() => {
        handleBeneficiaryPay(beneficiary, location.pathname);
    }, [beneficiary, handleBeneficiaryPay, location.pathname]);

    return (
        <Card
            size="small"
            className="sm:rounded-xl"
            title={
                <Text className="text-sm font-normal text-cardHTitleText">
                    {beneficiary?.serviceOperator?.serviceProvider}
                </Text>
            }
            extra={
                <Text onClick={handleEdit} className="px-3 cursor-pointer text-bgOrange2">
                    Edit
                </Text>
            }
        >
            <Flex className="w-full px-2 " align="center" justify="space-between">
                <Flex align="center" gap={12} className="w-full">
                    <div>
                        {/* Fixed square box so operator logos and service icons render at the same size */}
                        <Image
                            src={serviceImage}
                            loading="lazy"
                            preview={false}
                            width={40}
                            height={40}
                            className="object-contain"
                        />
                    </div>
                    <Flex vertical gap={4}>
                        <Text className="text-xs font-normal">{beneficiary?.name}</Text>
                        <Text
                            className={`${xs ? 'text-[10px]' : 'text-xs'} font-normal text-black/45`}
                        >
                            {beneficiary.phoneNo || beneficiary?.customerParams?.[0]?.value}
                            {'  '}({formatServiceProvider(beneficiary?.serviceProvider)})
                        </Text>
                    </Flex>
                </Flex>
                <Button
                    type="primary"
                    className="!rounded-lg text-xs sm:text-sm"
                    danger
                    size={xs ? 'small' : 'middle'}
                    onClick={handlePayNow}
                    loading={isLoading}
                >
                    Pay Now
                </Button>
            </Flex>
        </Card>
    );
};

export default React.memo(BeneficiaryCard);
