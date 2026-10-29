import React, { useState } from 'react';

import { Alert, Button, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import VerificationAddonHistoryCard from '../components/VerificationAddonHistoryCard';
import VerificationCountTag from '../components/VerificationCountTag';
import VerificationLimitBar from '../components/VerificationLimitBar';
import VerificationPlanCard from '../components/VerificationPlanCard';
import useGetVerificationAddOnHistory from '../hooks/useGetVerificationAddOnHistory';
import useGetVerificationAddOns from '../hooks/useGetVerificationAddOns';
import useGetVerificationCount from '../hooks/useGetVerificationCount';
import useVerificationPayment from '../hooks/useVerificationPayment';

const denominations = [5, 10, 30];

const SettingsPage = () => {
    const { countData, loading } = useGetVerificationCount();
    const { addOnsData, loading: addOnsLoading } = useGetVerificationAddOns();
    const { addOnHistoryData } = useGetVerificationAddOnHistory();
    const activeAddons = (addOnHistoryData?.records || []).filter(
        (record: any) => record.status === 'Active'
    );
    const [selectedCount, setSelectedCount] = useState<number | null>(null);
    const [error, setError] = useState<string>('');

    const totalAmount = selectedCount ? selectedCount * (addOnsData?.unitPrice || 0) : 0;
    const { handleSubmission, loading: paymentLoading } = useVerificationPayment(
        selectedCount || 0
    );

    const handleSelect = (count: number) => {
        setError('');
        setSelectedCount(count);
    };

    const handleUpgrade = () => {
        if (!selectedCount) {
            setError('Please select number of additional verifications.');
            return;
        }
        handleSubmission();
    };

    return (
        <Content>
            <Typography.Text className="text-lg font-medium sm:text-xl">Settings</Typography.Text>

            <VerificationPlanCard />

            {activeAddons.map((record: any) => (
                <VerificationAddonHistoryCard key={record.corporateTxnId} record={record} />
            ))}

            <Flex vertical className="w-full mt-6 xl:w-2/3">
                <VerificationLimitBar
                    countData={countData}
                    maxLimit={addOnsData?.maxLimit}
                    loading={loading || addOnsLoading}
                    showUpgradeButton={false}
                    showLastVerificationDate
                />

                <Typography.Text className="font-medium mt-7" style={{ fontSize: '0.9rem' }}>
                    Manage Additional Verifications
                </Typography.Text>

                <Flex vertical>
                    <Flex align="center" wrap="wrap">
                        <Flex className="overflow-hidden overflow-x-auto xs:flex-wrap">
                            {denominations.map(count => (
                                <VerificationCountTag
                                    key={count}
                                    count={count}
                                    onClick={() => handleSelect(count)}
                                    selected={selectedCount === count}
                                />
                            ))}
                        </Flex>
                        {selectedCount ? (
                            <Typography.Text className="pb-5 mt-2 md:px-4 md:pb-0 sm:whitespace-nowrap text-black/70">
                                Total additional amount{' '}
                                <span className="font-medium text-black">
                                    ₹ {formatNumberWithLocalString(totalAmount)} for {selectedCount}{' '}
                                    Verifications
                                </span>
                            </Typography.Text>
                        ) : (
                            ''
                        )}
                    </Flex>
                    <Flex className="w-full mt-4">
                        <Alert
                            message="Note: Additional verifications purchased will expire in one month. Please ensure they are utilized before the expiration date."
                            type="warning"
                            showIcon
                        />
                    </Flex>
                    <Typography.Text className="pt-1 text-red-600">{error}</Typography.Text>
                    <Button
                        className="px-6 mt-4 w-fit"
                        type="primary"
                        onClick={handleUpgrade}
                        loading={paymentLoading}
                        danger
                    >
                        Upgrade
                    </Button>
                </Flex>
            </Flex>
        </Content>
    );
};

export default SettingsPage;
