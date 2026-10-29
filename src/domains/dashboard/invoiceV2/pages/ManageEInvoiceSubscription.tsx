import React, { useState } from 'react';

import { Alert, Button, Col, Flex, Progress, Row, Skeleton, Tag, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { SubscriptionHistory } from '@customtypes/general';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formattedDateOnly } from '@utils/dateFormat';
import { packageAccessKeys } from '@utils/packageAccessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useEInvoiceUsage from '../hooks/eInvoiceDashboard/useEInvoiceUsage';

// Selectable pack-size pill. Mirrors eSign's SignTag.
const EInvoiceTag: React.FC<{ count: number; onClick: () => void; selected: boolean }> = ({
    count,
    onClick,
    selected,
}) => (
    <Tag
        onClick={onClick}
        style={{ borderRadius: '0.4rem', backgroundColor: 'white' }}
        className={`h-fit text-center p-2 text-sm items-center cursor-pointer xs:mt-1 md:mt-2 ${
            selected ? 'border border-red-500 bg-stone-50 text-red-500' : 'text-zinc-400'
        }`}
    >
        {`${count} e-invoices`}
    </Tag>
);

// Single info cell inside the plan summary card. Mirrors eSign / Turbo TextCard.
const SummaryCell: React.FC<{ label: string; value: string; valueColor?: string }> = ({
    label,
    value,
    valueColor,
}) => (
    <Col span={12} sm={8} md={6} lg={4}>
        <Flex vertical gap={6}>
            <Typography.Text className="text-[#9CA3AF] text-sm">{label}</Typography.Text>
            <Typography.Text
                className="text-sm font-medium"
                style={valueColor ? { color: valueColor } : undefined}
            >
                {value}
            </Typography.Text>
        </Flex>
    </Col>
);

// Plan summary card — same six-column layout used by Turbo/eSign PlanDetails. Title varies
// depending on whether the row is the parent GROUP plan or the e-invoice add-on row.
const EInvoicePlanCard: React.FC<{
    purchaseData: SubscriptionHistory & { isCustom?: number | boolean };
    isGroupSubscription?: boolean;
    totalEInvoices: number;
}> = ({ purchaseData, isGroupSubscription = false, totalEInvoices }) => {
    const {
        billingType,
        subscriptionAmountPaid,
        status,
        subscriptionStartDate,
        subscriptionEndDate,
        package: pkg,
    } = purchaseData;
    // Peko Free has no billing cycle — hide Cycle / Plan Started / Valid Until (they're not meaningful).
    const isFreePlan = !purchaseData.isCustom && !billingType;

    let title: string;
    if (purchaseData.isCustom) {
        title = `${pkg.packageName} - Add on`;
    } else if (isGroupSubscription) {
        title = `E-Invoice (${pkg.packageName})`;
    } else {
        title = `${pkg.packageName} - ${capitalize(billingType) || 'Monthly'}`;
    }

    // Add-ons are one-time, units-based purchases with no recurring billing cycle — they
    // expire on the billing end date. Only the plan row has a real Monthly/Annually cycle.
    let cycleValue = 'Monthly';
    if (purchaseData.isCustom) {
        cycleValue = 'One-time';
    } else if (billingType) {
        cycleValue = capitalize(String(billingType).toLowerCase());
    }

    return (
        <Flex
            vertical
            className="mt-5 p-6 sm:p-8 border border-[#E4E4E7] border-solid rounded-2xl bg-white"
            gap={20}
        >
            <Typography.Text className="text-base font-medium">{title}</Typography.Text>
            <Row gutter={[20, 20]} className="w-full">
                <SummaryCell
                    label="Total Amount"
                    value={`₹ ${formatNumberWithLocalString(Number(subscriptionAmountPaid) || 0)}`}
                />
                <SummaryCell label="Total e-invoices" value={String(totalEInvoices)} />
                <SummaryCell
                    label="Status"
                    value={status ? capitalize(String(status).toLowerCase()) : '—'}
                    valueColor="#05BE63"
                />
                {!isFreePlan && (
                    <>
                        <SummaryCell label="Cycle" value={cycleValue} valueColor="#05BE63" />
                        <SummaryCell
                            label="Plan Started"
                            value={
                                subscriptionStartDate
                                    ? formattedDateOnly(new Date(subscriptionStartDate))
                                    : '—'
                            }
                        />
                        <SummaryCell
                            label="Valid Until"
                            value={
                                subscriptionEndDate
                                    ? formattedDateOnly(new Date(subscriptionEndDate))
                                    : 'N/A'
                            }
                        />
                    </>
                )}
            </Row>
        </Flex>
    );
};

const ManageEInvoiceSubscription: React.FC = () => {
    const navigate = useNavigate();

    const { usage, isLoading: isUsageLoading } = useEInvoiceUsage();
    const {
        addonData,
        purchaseData,
        isLoading: isAddonLoading,
    } = useGetAddonDetails(accessKeys.eInvoice, packageAccessKeys.eInvoice);
    const canPurchaseAddon = addonData?.isAddonPurchaseAllowed === true;

    const denominations = [20, 50, 100];
    const [invoiceCount, setInvoiceCount] = useState<number | null>(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [error, setError] = useState<string>('');

    const handleUpdateCount = (count: number) => {
        setError('');
        setInvoiceCount(count);
        setTotalAmount(count * (addonData?.unitPrice ?? 0));
    };

    const handleUpgrade = () => {
        if (!canPurchaseAddon) {
            return;
        }
        if (!invoiceCount || invoiceCount <= 0 || !totalAmount) {
            setError('Please select number of additional e-invoices');
            return;
        }
        const addOnpaymentPayload = {
            pgAmount: totalAmount,
            addonsAccessKey: accessKeys.eInvoice,
            packageId: addonData?.packageId,
            quantity: invoiceCount,
            isDynamicUnitPricing: addonData?.isDynamicUnitPricing ?? false,
            title: 'E-Invoicing',
            description: '',
            rows: [
                {
                    column1: 'Additional E-Invoices',
                    column2: `${invoiceCount} ${invoiceCount === 1 ? 'e-invoice' : 'e-invoices'}`,
                    column3: `₹ ${formatNumberWithLocalString(totalAmount)}`,
                },
            ],
        };
        sessionStorage.setItem(
            'PlanDetails',
            JSON.stringify({
                url: window.location.href,
                service: 'E-Invoicing',
                addOnpaymentPayload,
                isAddOns: true,
            })
        );
        navigate(`/${paths.plans.index}/${paths.plans.reviewOrder}`);
    };

    if (isUsageLoading || isAddonLoading) {
        return (
            <Content>
                <Skeleton className="mt-5" />
            </Content>
        );
    }

    const percent = usage.maxLimit
        ? Math.min(100, Math.round((usage.used / usage.maxLimit) * 100))
        : 0;
    const lastAddedText = usage.lastEInvoiceCreatedAt
        ? formattedDateOnly(new Date(usage.lastEInvoiceCreatedAt))
        : null;
    const isGroupCurrent = !!purchaseData?.isGroupSubscription;

    return (
        <Content>
            <Typography.Text className="text-lg font-medium sm:text-xl">
                Manage Subscription
            </Typography.Text>

            {/* GROUP plan card — always shown when a current subscription exists. */}
            {purchaseData?.currentSubscription ? (
                <EInvoicePlanCard
                    purchaseData={purchaseData.currentSubscription}
                    isGroupSubscription={isGroupCurrent}
                    totalEInvoices={usage.freeBaseLimit}
                />
            ) : null}

            {/* Add-on card — shown only when there is an active e-invoice add-on row. */}
            {purchaseData?.addOns ? (
                <EInvoicePlanCard
                    purchaseData={purchaseData.addOns}
                    totalEInvoices={usage.addonLimit}
                />
            ) : null}

            {/* e-invoices Limit section */}
            <Flex vertical className="mt-8 w-full xl:w-2/3" gap={8}>
                <Typography.Text className="text-base font-medium">
                    E-Invoices Limit
                </Typography.Text>
                <Flex align="center" gap={16} className="w-full">
                    <Progress
                        className="flex-1"
                        percent={percent}
                        strokeColor="#05BE63"
                        showInfo={false}
                    />
                    <Typography.Text className="text-sm whitespace-nowrap">
                        {usage.used} {usage.used === 1 ? 'e-invoice' : 'e-invoices'} used of{' '}
                        {usage.maxLimit} {usage.maxLimit === 1 ? 'e-invoice' : 'e-invoices'}
                    </Typography.Text>
                </Flex>
                {lastAddedText && (
                    <Typography.Text className="text-xs text-[#9CA3AF] mt-1">
                        Last e-invoices added on {lastAddedText}
                    </Typography.Text>
                )}
            </Flex>

            {/* Manage Additional e-invoice section */}
            <Flex vertical className="mt-8 w-full xl:w-2/3" gap={12}>
                <Typography.Text className="text-base font-medium">
                    Manage Additional e-invoice
                </Typography.Text>
                {canPurchaseAddon ? (
                    <>
                        <Flex align="center" wrap="wrap">
                            <Flex className="overflow-hidden overflow-x-auto xs:flex-wrap">
                                {denominations.map(count => (
                                    <EInvoiceTag
                                        key={count}
                                        count={count}
                                        onClick={() => handleUpdateCount(count)}
                                        selected={invoiceCount === count}
                                    />
                                ))}
                            </Flex>
                        </Flex>
                        {invoiceCount && invoiceCount > 0 && totalAmount > 0 && (
                            <Typography.Text className="text-sm text-black/70">
                                Total additional amount{' '}
                                <span className="font-medium text-black">
                                    ₹ {formatNumberWithLocalString(totalAmount)}
                                </span>{' '}
                                for {invoiceCount} {invoiceCount === 1 ? 'e-invoice' : 'e-invoices'}
                            </Typography.Text>
                        )}
                        {error && (
                            <Typography.Text className="text-red-600 text-sm">
                                {error}
                            </Typography.Text>
                        )}

                        <Flex className="w-full mt-2">
                            <Alert
                                message={
                                    <Typography.Text className="text-sm">
                                        <span className="font-medium">Note:</span> The additional
                                        e-invoices purchased will expire on the billing end date.
                                        Please ensure they are utilized before the expiration date.
                                    </Typography.Text>
                                }
                                type="warning"
                                showIcon
                            />
                        </Flex>

                        <Button
                            className="px-8 mt-4 h-10 w-fit"
                            type="primary"
                            danger
                            onClick={handleUpgrade}
                        >
                            Continue
                        </Button>
                    </>
                ) : (
                    <Flex
                        className="mt-2 px-4 py-3 rounded-lg border border-[#FFE0E0] border-solid bg-[#FFF7F7]"
                        align="center"
                    >
                        <Typography.Text className="text-sm font-medium text-[#FF4F4F]">
                            Purchase an individual or group subscription to buy additional
                            e-invoices.
                        </Typography.Text>
                    </Flex>
                )}
            </Flex>
        </Content>
    );
};

export default ManageEInvoiceSubscription;
