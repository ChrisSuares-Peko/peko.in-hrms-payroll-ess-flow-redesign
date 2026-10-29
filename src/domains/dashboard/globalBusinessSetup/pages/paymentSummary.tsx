import { useEffect } from 'react';

import { Button, Card, Col, Divider, Flex, Row, Spin, Typography } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import PricingStatusAlert from '../components/PricingStatusAlert';
import usePaymentSummary from '../hooks/useForm';
import { useProviderDetails } from '../hooks/useGetSingleProvider';
import useSingleApplication from '../hooks/useSingleApplication';
import { isPaymentBlocked } from '../utils/paymentGate';
import { calcPricingBreakdown, formatMoney, normalizeQuoteConfig } from '../utils/pricingCalc';

const { Title, Text } = Typography;

export default function PaymentSummary() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();

    const navigationState = location.state as {
        from?: string;
        returnPath?: string;
    } | null;

    const { tableData, isLoading: companyLoading } = useSingleApplication(id!);
    const hasStructuredPricing = Boolean(tableData?.pricing);
    const {
        providerData,
        loading: providerLoading,
        error: providerError,
    } = useProviderDetails(hasStructuredPricing ? null : tableData?.provider?._id ?? null, {
        enabled: Boolean(tableData && !hasStructuredPricing),
    });

    const normalizedQuoteConfig =
        tableData?.pricing != null
            ? normalizeQuoteConfig(tableData.pricing, tableData.quote_config, tableData.metrics)
            : null;
    const selectedMetrics = normalizedQuoteConfig
        ? {
              visa: normalizedQuoteConfig.visa,
              activity: normalizedQuoteConfig.activity,
              shareholder: normalizedQuoteConfig.shareholder,
          }
        : {
              visa: tableData?.quote_config?.visa ?? tableData?.metrics?.visa ?? 0,
              activity: tableData?.quote_config?.activity ?? tableData?.metrics?.activity ?? 0,
              shareholder:
                  tableData?.quote_config?.shareholder ?? tableData?.metrics?.shareholder ?? 0,
          };
    const structuredBreakdown =
        tableData?.pricing && normalizedQuoteConfig
            ? calcPricingBreakdown(tableData.pricing, normalizedQuoteConfig)
            : null;
    const legacyBreakdown = [
        {
            label: 'Visa Fee (per person)',
            amount: selectedMetrics.visa * (providerData?.charges?.visa || 0),
        },
        {
            label: 'Medical & Emirates ID',
            amount: selectedMetrics.shareholder * (providerData?.charges?.shareholder || 0),
        },
        {
            label: 'Activity Fee (per business activity)',
            amount: selectedMetrics.activity * (providerData?.charges?.activity || 0),
        },
    ];
    const breakdownLines = structuredBreakdown?.lines ?? legacyBreakdown;
    const total =
        structuredBreakdown?.total ?? legacyBreakdown.reduce((sum, item) => sum + item.amount, 0);
    const currency = tableData?.pricing?.currency || 'INR';

    const { handleProceedToPayment } = usePaymentSummary({
        applicationId: tableData?._id ?? '',
        applicationNo: tableData?.application_id ?? '',
        providerTitle: tableData?.provider?.title ?? providerData?.title ?? '',
        baseAmount: total,
        pricingId: tableData?.pricing?._id,
        quoteConfig: normalizedQuoteConfig,
        metrics: selectedMetrics,
        freezone: tableData?.freezone ?? '',
        type: tableData?.type ?? '',
        country: tableData?.country.name ?? '',
        currency,
        inrRate: tableData?.pricing?.inr_rate,
    });

    // Gating now lives on the application details page. This is a defensive
    // guard: if a still-blocked application reaches this route (deep link,
    // stale tab), bounce back to the details page.
    const payBlocked = Boolean(tableData) && isPaymentBlocked(tableData!);

    useEffect(() => {
        if (!companyLoading && tableData && payBlocked) {
            navigate(
                `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.viewRequest}/${id}`,
                { replace: true }
            );
        }
    }, [companyLoading, tableData, payBlocked, navigate, id]);

    if (companyLoading || (!hasStructuredPricing && providerLoading)) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spin size="large" />
            </div>
        );
    }

    if (!tableData || (!hasStructuredPricing && providerError)) {
        return <Text type="danger">Unable to load payment summary.</Text>;
    }

    // Don't flash the enabled payment card while the redirect above is in flight.
    if (payBlocked) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            <PricingStatusAlert
                pricing={tableData?.pricing}
                editPath={`${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.edit}/${id}`}
            />
            <Card
                style={{
                    maxWidth: 800,
                    margin: '0 auto',
                    padding: 24,
                    borderRadius: 16,
                }}
            >
                <Title level={4}>Payment Summary</Title>

                <Flex vertical gap={12}>
                    <Divider />

                    {breakdownLines.length > 0 ? (
                        breakdownLines.map(item => (
                            <Row key={item.label} justify="space-between">
                                <Col>
                                    <Text>{item.label}</Text>
                                </Col>
                                <Col>
                                    <Text strong>{formatMoney(item.amount, currency)}</Text>
                                </Col>
                            </Row>
                        ))
                    ) : (
                        <Text type="secondary">No pricing breakdown available.</Text>
                    )}

                    <Divider />

                    <Row justify="space-between">
                        <Title level={5}>Total</Title>
                        <Text strong style={{ fontSize: 18 }}>
                            {formatMoney(total, currency)}
                        </Text>
                    </Row>

                    <Divider />

                    <Row justify="space-between">
                        <Button
                            onClick={() => {
                                if (navigationState?.returnPath) {
                                    navigate(navigationState.returnPath);
                                } else {
                                    navigate(
                                        `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.viewRequest}/${id}`
                                    );
                                }
                            }}
                        >
                            Go Back
                        </Button>
                        <Button type="primary" danger onClick={handleProceedToPayment}>
                            Proceed to Pay
                        </Button>
                    </Row>
                </Flex>
            </Card>
        </>
    );
}
