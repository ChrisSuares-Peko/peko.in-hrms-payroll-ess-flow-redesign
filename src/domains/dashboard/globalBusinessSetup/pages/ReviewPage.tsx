import React from 'react';

import { Button, Flex, Image, Spin, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import subscription from '@src/domains/dashboard/globalBusinessSetup/assets/svg/subscription.svg';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import SuccessIcon from '../assets/img/verified.png';
import ComplianceStatusAlert from '../components/consent/ComplianceStatusAlert';
import ConsentOptionalAlert from '../components/consent/ConsentOptionalAlert';
import ConsentStatusAlerts from '../components/consent/ConsentStatusAlerts';
import FormOutdatedAlert from '../components/FormOutdatedAlert';
import PlanDetails from '../components/PlanDetails';
import PricingStatusAlert from '../components/PricingStatusAlert';
import Application from '../components/SingleApplicationDetails/SingleApplicationDetails';
import { useActivatePekoPlus } from '../hooks/useActivatePekoPlus';
import { useCountries } from '../hooks/useCountries';
import { useFormSchemaById } from '../hooks/useFormById';
import { useFormOutdated } from '../hooks/useFormOutdated';
import useGetPackages from '../hooks/useGetPackages';
import { useProviderDetails } from '../hooks/useGetSingleProvider';
import useSingleApplication from '../hooks/useSingleApplication';
import useSubscriptionDetails from '../hooks/useSubscriptionDetails';
import { SubmittedFormData } from '../types/forms';
import { isPaymentBlocked } from '../utils/paymentGate';
import { calcPricingBreakdown, normalizeQuoteConfig } from '../utils/pricingCalc';

const { Text } = Typography;

const ReviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { tableData, isLoading, refetch } = useSingleApplication(id!);
    const formId = tableData?.form_data?.form;
    const { form } = useFormSchemaById(formId);
    const { subscriptionDetails, refetch: refetchSubscription } = useSubscriptionDetails();
    const { data } = useGetPackages();
    const { activate, loading: activating } = useActivatePekoPlus();
    const { getUserServicesData, getUserData } = useUserInfo();
    const hasStructuredPricing = Boolean(tableData?.pricing);

    const providerId = hasStructuredPricing ? null : tableData?.provider?._id ?? null;

    const { providerData, loading: providerLoading } = useProviderDetails(providerId, {
        enabled: Boolean(providerId),
    });

    const { countriesAndDetails } = useCountries('', '');
    const formOutdatedStatus = useFormOutdated(tableData);

    const matchedType = countriesAndDetails
        .find(c => c._id === tableData?.country?._id)
        ?.company_types.find(ct => ct.key === tableData?.type);
    const freezoneData = matchedType?.freezones.find(fz => fz.key === tableData?.freezone);

    if (isLoading || !tableData || (!hasStructuredPricing && providerLoading)) {
        return (
            <div className="w-full h-full flex justify-center items-center py-20">
                <Spin size="large" />
            </div>
        );
    }

    const { form_data, status, is_paid, updated_at, created_at } = tableData;
    // Show the pay/edit action bar only for completed-but-unpaid applications.
    const showPayCta = !is_paid && status === 'saved';
    // Payment is blocked by consent/compliance (shared gate), and additionally
    // when the form is outdated/unavailable or the pricing is no longer active
    // (mirrors the vendor's payDisabled) — the alerts above explain which.
    const payBlocked =
        isPaymentBlocked(tableData) ||
        formOutdatedStatus !== 'none' ||
        (tableData.pricing != null && tableData.pricing.status !== 'active');
    const normalizedQuoteConfig =
        tableData.pricing != null
            ? normalizeQuoteConfig(tableData.pricing, tableData.quote_config, tableData.metrics)
            : null;
    const total = tableData.pricing
        ? calcPricingBreakdown(tableData.pricing, normalizedQuoteConfig!).total
        : (tableData.quote_config?.visa ?? tableData.metrics?.visa ?? 0) *
              (providerData?.charges?.visa || 0) +
          (tableData.quote_config?.shareholder ?? tableData.metrics?.shareholder ?? 0) *
              (providerData?.charges?.shareholder || 0) +
          (tableData.quote_config?.activity ?? tableData.metrics?.activity ?? 0) *
              (providerData?.charges?.activity || 0);

    const editPath = `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.edit}/${id}`;

    return (
        <>
            <PricingStatusAlert pricing={tableData?.pricing} editPath={editPath} />
            <FormOutdatedAlert status={formOutdatedStatus} editPath={editPath} />
            <ComplianceStatusAlert application={tableData} />
            <ConsentStatusAlerts application={tableData} onChanged={refetch} />
            <ConsentOptionalAlert application={tableData} onChanged={refetch} />

            {status === 'closed' && (
                <div className="w-full flex flex-col items-center gap-3">
                    <Image
                        src={SuccessIcon}
                        alt="Success Icon"
                        width={90}
                        height={90}
                        preview={false}
                    />
                    <Text className="sm:text-[25px] text-lg font-medium">
                        Congratulations, your company is registered!
                    </Text>
                </div>
            )}

            <PlanDetails
                planIcon={freezoneData?.icon}
                PlanName={
                    tableData?.proposed_name ||
                    freezoneData?.label ||
                    matchedType?.label ||
                    tableData?.country?.name ||
                    'N/A'
                }
                AmountPaid={total}
                Date={updated_at || created_at || ''}
                paymentStatus={is_paid ? 'Paid' : 'Pending'}
                applicationStatus={status}
                currency={tableData?.pricing?.currency}
            />

            <Application company={form_data as SubmittedFormData} formSchema={form} />

            {showPayCta && (
                <div className="px-0 md:px-20 xl:px-36 mt-6">
                    <Flex
                        vertical
                        gap={12}
                        className="rounded-2xl bg-white"
                        style={{
                            border: '1px solid #E5E7EB',
                            padding: '16px 20px',
                            boxShadow: '0px 1.5px 16.5px 0px rgba(0, 0, 0, 0.06)',
                        }}
                    >
                        <Flex
                            align="center"
                            justify="space-between"
                            gap={12}
                            className="flex-col sm:flex-row"
                        >
                            <Button
                                type="default"
                                danger
                                size="large"
                                className="px-6 w-full sm:w-auto"
                                onClick={() => navigate(editPath)}
                            >
                                Edit Application
                            </Button>
                            <Button
                                type="primary"
                                danger
                                size="large"
                                disabled={payBlocked}
                                className="px-8 w-full sm:w-auto"
                                onClick={() =>
                                    navigate(
                                        `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.review}/${paths.globalBusinessSetup.paymentsummary}/${id}`,
                                        {
                                            state: {
                                                from: 'applicationDetails',
                                                returnPath: location.pathname,
                                            },
                                        }
                                    )
                                }
                            >
                                Proceed to Pay
                            </Button>
                        </Flex>
                        {payBlocked && (
                            <Text className="text-xs text-neutral-500 text-center sm:text-right">
                                Resolve the alerts above to enable payment.
                            </Text>
                        )}
                    </Flex>
                </div>
            )}

            {!subscriptionDetails.isPurchased && (
                <Flex className="px-0 md:px-20 xl:px-36 mt-5">
                    <Flex className="border px-4 rounded-2xl w-full">
                        <Flex
                            align="center"
                            justify="space-between"
                            className="w-full flex-col sm:flex-row gap-3"
                        >
                            <Flex align="center" gap={10} className="w-full sm:w-auto">
                                <ReactSVG
                                    src={subscription}
                                    beforeInjection={svg => {
                                        svg.classList.add('w-10', 'h-10', 'md:w-16', 'md:h-16');
                                    }}
                                />
                                <Typography.Text className="text-xs sm:text-sm md:text-base font-normal">
                                    You have a 1-year free subscription to Peko Plus. Activate it
                                    now.
                                </Typography.Text>
                            </Flex>

                            <Button
                                size="small"
                                danger
                                loading={activating}
                                disabled={!data?.length}
                                onClick={async () => {
                                    const topPackage = data.reduce(
                                        (top, p) => (p.priorityLevel > top.priorityLevel ? p : top),
                                        data[0]
                                    );
                                    const res = await activate({ planId: topPackage.id });
                                    if (res) {
                                        refetchSubscription();
                                        await Promise.all([getUserServicesData(), getUserData()]);
                                        dispatch(
                                            showToast({
                                                description:
                                                    'Peko Plus activated successfully - included with your Global Business Setup subscription',
                                                variant: 'success',
                                            })
                                        );
                                    }
                                }}
                                className="w-full sm:w-32 h-10 text-xs sm:text-sm rounded-lg mb-3 sm:my-2"
                            >
                                Activate Now
                            </Button>
                        </Flex>
                    </Flex>
                </Flex>
            )}

            <Text className="text-center mt-6 text-sm block">
                Contact your assigned setup manager. Your setup is being managed by{' '}
                <strong>Allen Ajith</strong>
                <br />
                Email:{' '}
                <a href="mailto:allen@peko.one" style={{ textDecoration: 'none' }}>
                    <Text className="text-lightRed xs:text-xs md:text-sm">allen@peko.one</Text>
                </a>{' '}
                | Phone:{' '}
                <a href="tel:02248930373" style={{ textDecoration: 'none' }}>
                    <Text className="text-lightRed xs:text-xs md:text-sm">+971 50 394 9240</Text>
                </a>
            </Text>
        </>
    );
};

export default ReviewPage;
