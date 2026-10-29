import { useEffect, useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Skeleton, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import DynamicForm from '../components/DynamicForm/DynamicForm';
import UpdateQuoteModal from '../components/getStarted/UpdateQuoteModal';
import PricingStatusAlert from '../components/PricingStatusAlert';
import { useCompanyApplicationSubmit } from '../hooks/useApplicationSubmit';
import { useFormSchema } from '../hooks/useFormData';
import { usePricing } from '../hooks/useProviders';
import { useQuoteBindings } from '../hooks/useQuoteBindings';
import {
    saveFormValues,
    setFormSchema,
    setMetrics,
    setPricingData,
    setQuoteConfig,
} from '../slices/globalBusinessSetupSlice';
import { calcPricingBreakdown, formatMoney } from '../utils/pricingCalc';

// import { createCompany, saveAsDraft } from '../api/company';

export default function NewSetup() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const { countryData, values, pricingData, quoteConfig } = useAppSelector(
        state => state.reducer.globalBusinessSetup
    );

    const { form, Loading } = useFormSchema(countryData);
    const { saveDraft, savingDraft, submittingFinal } = useCompanyApplicationSubmit(form);
    const { normalized, targets, defaultValueOverrides } = useQuoteBindings(form);

    const [quoteModalOpen, setQuoteModalOpen] = useState(false);

    // Detect the selected pricing being deactivated while the form is open:
    // refetch the ACTIVE pricing list and flag when ours is no longer in it
    // (mirrors the vendor's pricingInactive alert on NewSetup).
    const { fetchPricing, pricing: activePricings } = usePricing();
    const [checkedPricing, setCheckedPricing] = useState(false);

    useEffect(() => {
        if (!countryData?.country || !pricingData) return;
        fetchPricing({
            country: countryData.country,
            type: countryData.type,
            freezone: countryData.freezone || '',
        }).then(() => setCheckedPricing(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countryData?.country, countryData?.type, countryData?.freezone]);

    const pricingInactive =
        !!pricingData && checkedPricing && !activePricings.some(p => p._id === pricingData._id);

    const pageId = (location.state as { pageId?: string })?.pageId;
    const sectionId = (location.state as { sectionId?: string })?.sectionId;

    if (Loading) {
        return (
            <Flex justify="center" align="center" className="w-full h-full">
                <Skeleton active paragraph={{ rows: 10 }} />
            </Flex>
        );
    }
    if (form === null) {
        return (
            <Flex
                vertical
                align="center"
                justify="center"
                className="w-full h-full text-center px-4"
                style={{ paddingTop: '8vh' }}
                gap={24}
            >
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    imageStyle={{ height: 140 }}
                    description={
                        <Flex vertical gap={8} style={{ maxWidth: 420 }}>
                            <Typography.Title level={4} className="!mb-0">
                                No application form available{' '}
                            </Typography.Title>
                            <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                                No application form is available for the selected country, company
                                type, and free zone. Please try different options or contact support
                                for assistance.
                            </Typography.Text>
                        </Flex>
                    }
                />

                <Button
                    type="primary"
                    danger
                    size="large"
                    onClick={() =>
                        navigate(`${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}`)
                    }
                >
                    Go Back
                </Button>
            </Flex>
        );
    }

    const quoteTotal =
        pricingData && quoteConfig ? calcPricingBreakdown(pricingData, quoteConfig).total : null;

    return (
        <>
            {pricingInactive && <PricingStatusAlert pricing={{ status: 'inactive' }} />}

            {pricingData && (
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
                                · {formatMoney(quoteTotal, pricingData.currency)}
                            </span>
                        )}
                    </Button>
                </Flex>
            )}

            <DynamicForm
                key={form?._id || 'loading'}
                formSchema={form}
                onSubmit={async (value: any, status: 'draft' | 'saved', silent?: boolean) => {
                    try {
                        dispatch(setFormSchema(form));
                        dispatch(saveFormValues(value));
                        const res = await saveDraft(value, status, silent);
                        if (!res) return false;

                        if (status === 'saved' && res?.vendorApplicationId) {
                            navigate(`${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.review}`);
                        }

                        return true;
                    } catch (err) {
                        return false;
                    }
                }}
                draftLoading={savingDraft}
                finalSubmitLoading={submittingFinal}
                initialPageId={pageId}
                initialSectionId={sectionId}
                values={values}
                defaultValueOverrides={defaultValueOverrides}
                bindingNormalized={normalized}
                bindingTargets={targets}
            />

            {pricingData && (
                <UpdateQuoteModal
                    open={quoteModalOpen}
                    onClose={() => setQuoteModalOpen(false)}
                    country={countryData?.country ?? ''}
                    companyType={countryData?.type ?? ''}
                    freezone={countryData?.freezone ?? ''}
                    currentPricingId={pricingData._id ?? ''}
                    currentQuoteConfig={quoteConfig}
                    onSave={(pricing, qc) => {
                        dispatch(setPricingData(pricing));
                        dispatch(setQuoteConfig(qc));
                        dispatch(
                            setMetrics({
                                visa: qc.visa,
                                activity: qc.activity,
                                shareholder: qc.shareholder,
                            })
                        );
                    }}
                />
            )}
        </>
    );
}
