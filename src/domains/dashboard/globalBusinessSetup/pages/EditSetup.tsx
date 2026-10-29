import { useEffect, useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton } from 'antd';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import DynamicForm from '../components/DynamicForm/DynamicForm';
import UpdateQuoteModal from '../components/getStarted/UpdateQuoteModal';
import PricingStatusAlert from '../components/PricingStatusAlert';
import { useCompanyApplicationSubmit } from '../hooks/useApplicationSubmit';
import { useFormSchemaById } from '../hooks/useFormById';
import { usePricing } from '../hooks/useProviders';
import { useQuoteBindings } from '../hooks/useQuoteBindings';
import useSingleApplication from '../hooks/useSingleApplication';
import {
    resetApplication,
    saveFormValues,
    setCountryData,
    setMetrics,
    setQuoteConfig,
    setProvider,
    setFormSchema,
    setApplicationId,
    setPricingData,
} from '../slices/globalBusinessSetupSlice';
import { PricingType, QuoteConfig } from '../types/pricing';
import { calcPricingBreakdown, formatMoney, normalizeQuoteConfig } from '../utils/pricingCalc';

// import { createCompany, saveAsDraft } from '../api/company';

export default function EditSetup() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const { id } = useParams<{ id?: string }>();

    const { tableData, isLoading } = useSingleApplication(id!);
    const formId = tableData?.form_data?.form;
    const { form, loading } = useFormSchemaById(formId);

    const { saveDraft, savingDraft, submittingFinal } = useCompanyApplicationSubmit(form);
    const { normalized, targets, defaultValueOverrides } = useQuoteBindings(form);
    // Fresh, active pricing list — same source the Update Quote modal prices
    // against, so the button total can't diverge from the modal.
    const { pricing: pricingList, fetchPricing } = usePricing();
    // Redux quote config — kept in sync with bound form fields by QuoteBindingSync
    // (and the modal's onSave), so the button reflects connected-field edits.
    const { quoteConfig: boundQuoteConfig } = useAppSelector(s => s.reducer.globalBusinessSetup);

    const [quoteModalOpen, setQuoteModalOpen] = useState(false);
    const [livePricing, setLivePricing] = useState<PricingType | null>(null);

    useEffect(() => {
        dispatch(resetApplication());

        if (tableData) {
            dispatch(setApplicationId(id!));
            const metricsData = tableData.quote_config ?? tableData.metrics;
            dispatch(
                setMetrics({
                    visa: metricsData?.visa ?? 0,
                    activity: metricsData?.activity ?? 0,
                    shareholder: metricsData?.shareholder ?? 0,
                })
            );
            dispatch(setProvider(tableData.provider));
            if (tableData.pricing) {
                dispatch(setPricingData(tableData.pricing));
                dispatch(
                    setQuoteConfig(
                        normalizeQuoteConfig(
                            tableData.pricing,
                            tableData.quote_config,
                            tableData.metrics
                        )
                    )
                );
            }
            dispatch(
                setCountryData({
                    country: tableData.country._id,
                    type: tableData.type,
                    freezone: tableData.freezone,
                })
            );
        }
    }, [dispatch, id, tableData]);

    // Load the fresh active pricing so the button prices against the current
    // doc (not the possibly stale/inactive snapshot on the application).
    useEffect(() => {
        if (!tableData) return;
        fetchPricing({
            country: tableData.country._id,
            type: tableData.type,
            freezone: tableData.freezone || '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableData?.country?._id, tableData?.type, tableData?.freezone]);

    if (loading || isLoading || !tableData) {
        return (
            <Flex justify="center" align="center" className="w-full h-full">
                <Skeleton active paragraph={{ rows: 10 }} />
            </Flex>
        );
    }

    const pageIdFromLocation = (location.state as { pageId?: string } | null)?.pageId;
    const sectionIdFromLocation = (location.state as { sectionId?: string } | null)?.sectionId;

    // Always restart drafts from page 1 (unless the user explicitly came in via
    // a "Change" link from the Review page, which carries `pageIdFromLocation`).
    // Validations on earlier pages may have changed since the draft was saved —
    // walking the user from the start ensures everything re-validates and avoids
    // a confusing block on the final submit.
    const initialPageId = pageIdFromLocation || form?.pages?.[0]?._id;
    const values = tableData?.form_data;

    if (loading || isLoading || !tableData || !form) {
        return (
            <Flex justify="center" align="center" className="w-full h-full">
                <Skeleton active paragraph={{ rows: 10 }} />
            </Flex>
        );
    }

    const canEditQuote = tableData?.is_paid === false;
    const currentPricingId = livePricing?._id ?? tableData?.pricing?._id ?? '';
    const currentQuoteConfig =
        boundQuoteConfig ?? (tableData?.quote_config as QuoteConfig | null | undefined) ?? null;

    // Price the button against the FRESH pricing (same source the modal uses):
    // the exact doc the modal just priced (livePricing), else the freshly fetched
    // active doc for this plan, else the (possibly stale) snapshot on the app.
    const currentPricing =
        livePricing ??
        pricingList.find(p => p._id === currentPricingId) ??
        tableData?.pricing ??
        null;

    const quoteTotal = currentPricing
        ? calcPricingBreakdown(
              currentPricing,
              normalizeQuoteConfig(currentPricing, currentQuoteConfig, tableData?.metrics)
          ).total
        : null;

    return (
        <>
            {canEditQuote && (
                <Flex justify="flex-end" className="mb-3">
                    <Button
                        type="default"
                        danger
                        icon={<EditOutlined />}
                        onClick={() => setQuoteModalOpen(true)}
                    >
                        Edit Quote
                        {quoteTotal != null && (
                            <span className="ml-1 font-semibold">
                                · {formatMoney(quoteTotal, currentPricing?.currency)}
                            </span>
                        )}
                    </Button>
                </Flex>
            )}

            <PricingStatusAlert pricing={tableData?.pricing} />

            <DynamicForm
                key={form?._id || formId || 'loading'}
                isEdit
                formSchema={form}
                onSubmit={async (value: any, status: 'draft' | 'saved', silent?: boolean) => {
                    try {
                        dispatch(setFormSchema(form));
                        dispatch(saveFormValues(value));
                        const res = await saveDraft(value, status, silent);
                        if (!res) return false;
                        if (status === 'saved' && res?.vendorApplicationId) {
                            navigate(`${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.review}`, {
                                state: {
                                    from: 'pendingApplications',
                                    returnPath: `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.edit}/${id}`,
                                },
                            });
                        }
                        return true;
                    } catch (e) {
                        console.error('🔥 onSubmit crashed:', e);
                        return false;
                    }
                }}
                draftLoading={savingDraft}
                finalSubmitLoading={submittingFinal}
                initialPageId={initialPageId}
                initialSectionId={sectionIdFromLocation}
                values={values}
                defaultValueOverrides={defaultValueOverrides}
                bindingNormalized={normalized}
                bindingTargets={targets}
            />

            {canEditQuote && (
                <UpdateQuoteModal
                    open={quoteModalOpen}
                    onClose={() => setQuoteModalOpen(false)}
                    country={tableData.country._id}
                    companyType={tableData.type}
                    freezone={tableData.freezone || ''}
                    currentPricingId={currentPricingId}
                    currentQuoteConfig={currentQuoteConfig}
                    onSave={(pricing, quoteConfig) => {
                        dispatch(setPricingData(pricing));
                        dispatch(setQuoteConfig(quoteConfig));
                        dispatch(
                            setMetrics({
                                visa: quoteConfig.visa,
                                activity: quoteConfig.activity,
                                shareholder: quoteConfig.shareholder,
                            })
                        );
                        setLivePricing(pricing);
                    }}
                />
            )}
        </>
    );
}
