import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { LinkOutlined } from '@ant-design/icons';
import { Card, Typography, Button, Divider, Space, Flex, Col, Row, Spin, Empty } from 'antd';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import AiCheckModal from '../components/AiCheckModal';
import PageTabs from '../components/DynamicForm/PageTabs';
import { formatNestedValue } from '../components/DynamicForm/utils/nestedSelectValue';
import { useCompanyApplicationSubmit } from '../hooks/useApplicationSubmit';
import { useCountries } from '../hooks/useCountries';
import { useDownloadVendorFile } from '../hooks/useDownloadVendorFile';
import useSingleApplication from '../hooks/useSingleApplication';
import { setCurrentPageIndex } from '../slices/globalBusinessSetupSlice';
import { IField, IForm, SubmittedField } from '../types/forms';

const { Title, Text } = Typography;

export default function InitialReviewPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { formSchema, values, applicationId } = useAppSelector(
        state => state.reducer.globalBusinessSetup
    );
    const { username } = useAppSelector(state => state.reducer.auth);
    const location = useLocation();
    const navigationState = location.state as {
        from?: string;
        returnPath?: string;
        activePageId?: string;
    } | null;
    const { tableData, isLoading: tableDataLoading } = useSingleApplication(applicationId);
    const { countryOptions } = useCountries('', '', 'is_active=true');
    const { finalSubmit, submittingFinal } = useCompanyApplicationSubmit(formSchema);
    const downloadVendorFile = useDownloadVendorFile();

    const { pages } = (formSchema || {}) as IForm;

    const [activePageId, setActivePageId] = useState<string | null>(
        pages && pages.length > 0 ? pages[0]._id : null
    );
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [pendingNavigationId, setPendingNavigationId] = useState<string | null>(null);
    const [submitApiSuccess, setSubmitApiSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<{
        message: string;
        errors?: string[];
    } | null>(null);
    useEffect(() => {
        if (navigationState?.activePageId) {
            setActivePageId(navigationState.activePageId);
        }
    }, [navigationState?.activePageId]);

    const safeActivePageId = activePageId ?? (pages && pages.length > 0 ? pages[0]._id : null);
    const currentIndex = safeActivePageId
        ? pages?.findIndex(p => p._id === safeActivePageId) ?? -1
        : -1;
    const [maxVisitedIndex, setMaxVisitedIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

    useEffect(() => {
        if (currentIndex >= 0) {
            setMaxVisitedIndex(prev => Math.max(prev, currentIndex));
        }
    }, [currentIndex]);

    useEffect(() => {
        const container = document.getElementById('myContainer');
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activePageId]);

    const activeSubmittedPage = useMemo(
        () => tableData?.form_data?.pages.find(p => p.page === activePageId),
        [tableData, activePageId]
    );

    const isFirst = currentIndex === 0;
    const isLast = !pages || pages.length === 0 ? false : currentIndex === pages.length - 1;
    const finalActivePageId = safeActivePageId ?? (pages && pages.length > 0 ? pages[0]._id : '');

    const handleAiCheckContinue = useCallback(() => {
        setAiModalOpen(false);
        if (pendingNavigationId) {
            // Land on the application details page (not payment summary) — the
            // user requests consent / clears compliance there before paying.
            // `replace` so Back can't return to the stale, resubmittable review.
            navigate(
                `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.viewRequest}/${pendingNavigationId}`,
                { replace: true }
            );
        }
    }, [pendingNavigationId, navigate]);

    const handleAiCheckReview = useCallback(() => {
        setAiModalOpen(false);
        setSubmitError(null);
        // User reviews — stay on current page so they can edit and re-submit
    }, []);

    const handleAiCheckSubmitAnyway = useCallback(async () => {
        // Re-submit the same payload with the skip flag — Base93 finalises
        // the application without running AI validation. We close the modal
        // and navigate directly on success (vendor parity); we can't rely on
        // the stream's fast-forward here because the original Pusher error
        // already flipped `isFailed=true` which gates that effect.
        setSubmitError(null);
        const result = await finalSubmit(values, true);
        if (result.ok) {
            setAiModalOpen(false);
            navigate(
                `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.viewRequest}/${result.vendorApplicationId}`,
                { replace: true }
            );
        } else {
            setSubmitError({ message: result.message, errors: result.errors });
        }
    }, [finalSubmit, values, navigate]);

    if (tableDataLoading) {
        return (
            <Flex justify="center" align="center" className="w-full h-full">
                <Spin />
            </Flex>
        );
    }

    if (!formSchema || !values || !pages || pages.length === 0 || !tableData) {
        return (
            <Flex justify="center" align="center" className="w-full h-full mt-24">
                <Empty description="Nothing to review" />
            </Flex>
        );
    }

    const handleBack = () => {
        if (isFirst) {
            const lastPage = pages[pages.length - 1];

            if (!lastPage) return;

            const lastSection = lastPage.sections?.[0];

            if (navigationState?.returnPath) {
                navigate(navigationState.returnPath, {
                    state: {
                        pageId: lastPage._id,
                        sectionId: lastSection?._id,
                    },
                });
                return;
            }

            navigate(
                `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.new}`,
                {
                    state: {
                        pageId: lastPage._id,
                        sectionId: lastSection?._id,
                    },
                }
            );

            return;
        }
        setActivePageId(pages[currentIndex - 1]._id);
    };

    const handleNext = () => {
        if (isLast) {
            handleFinalSubmit();
            return;
        }
        setActivePageId(pages[currentIndex + 1]._id);
    };

    const handleFinalSubmit = async () => {
        // Open the AI-check modal immediately so the Pusher channel is established
        // before Base93 starts firing webhooks
        setSubmitApiSuccess(false);
        setSubmitError(null);
        setAiModalOpen(true);

        const result = await finalSubmit(values);
        if (result.ok) {
            // Store the ID so we can navigate once AI check completes
            setPendingNavigationId(result.vendorApplicationId);
            // Treat submit API success as the definitive "saved" signal
            // (fallback if the final Pusher event is missing/late)
            setSubmitApiSuccess(true);
        } else {
            // Submit failed — keep the modal open and surface the BE message
            // so the user can read it before deciding whether to review/edit.
            setSubmitError({ message: result.message, errors: result.errors });
        }
    };

    const activePage = pages.find(p => p._id === activePageId);

    const getSubmittedValuesForField = (sectionId: string, schemaField: IField) => {
        const submittedSection = activeSubmittedPage?.sections.find(s => s.section === sectionId);

        if (!submittedSection) return [];

        const allFields: SubmittedField[] = submittedSection.instances.flatMap(
            instance => instance.fields
        );

        // Vendor API saves each field as `{ field: <_id>, value, _id }` — no
        // `name`/`type`/`option_label`. Match by schema `_id` (defensive
        // fallback to legacy `name` shape) and derive type/labels from the
        // schema, not from the persisted record.
        const fieldType = schemaField.type;
        const matched = allFields.filter(
            f => f.field === schemaField._id || f.name === schemaField.name
        );

        const lookupOptionLabel = (raw: any) => {
            if (!Array.isArray(schemaField.options) || schemaField.options.length === 0) {
                return raw;
            }
            const opt = schemaField.options.find(o => o.value === raw);
            return opt?.label ?? raw;
        };

        return matched
            .map(f => {
                if (fieldType === 'file' || fieldType === 'image') {
                    if (f.value && typeof f.value === 'object' && !Array.isArray(f.value)) {
                        const fileValue = f.value as {
                            name?: string;
                            _id?: string;
                            url?: string;
                        };
                        if (fileValue._id || fileValue.url) {
                            return {
                                type: 'file',
                                name: fileValue.name || 'File',
                                _id: fileValue._id,
                                url: fileValue.url,
                            };
                        }
                    }
                    return null;
                }

                if (fieldType === 'checkbox') {
                    const isChecked =
                        f.value === true || f.value === 'true' || f.value === 1 || f.value === '1';
                    return isChecked ? 'Yes' : 'No';
                }

                if (fieldType === 'country') {
                    return countryOptions.find(c => c.value === f.value)?.label || f.value;
                }

                if (
                    fieldType === 'select' ||
                    fieldType === 'radio' ||
                    fieldType === 'checkbox_group'
                ) {
                    if (Array.isArray(f.value)) {
                        return f.value
                            .map(lookupOptionLabel)
                            .filter(v => v !== undefined && v !== null && v !== '')
                            .join(', ');
                    }
                    return lookupOptionLabel(f.value);
                }

                if (fieldType === 'nested_select') {
                    if (Array.isArray(f.value)) {
                        return formatNestedValue(f.value);
                    }
                    return f.value ? String(f.value) : '';
                }

                if (typeof f.value === 'boolean') {
                    return f.value ? 'Yes' : 'No';
                }

                return f.value;
            })
            .filter(v => v !== undefined && v !== null && v !== '');
    };

    return (
        <>
            <AiCheckModal
                open={aiModalOpen}
                referenceId={username || null}
                apiSuccess={submitApiSuccess}
                submitError={submitError}
                isResubmitting={submittingFinal}
                onReview={handleAiCheckReview}
                onContinue={handleAiCheckContinue}
                onSubmitAnyway={handleAiCheckSubmitAnyway}
            />
            <Flex vertical className="px-5">
                <PageTabs
                    pages={pages}
                    currentPage={finalActivePageId}
                    maxVisitedIndex={maxVisitedIndex}
                    onChange={setActivePageId}
                />
            </Flex>
            <Card className="px-6 py-4 rounded-3xl">
                {isFirst && (
                    <>
                        <Title level={4}>Review your application</Title>
                        <Divider />
                    </>
                )}

                <Flex vertical className="mt-4" gap={16}>
                    <Flex vertical>
                        {activePage?.sections.map(section => (
                            <Flex key={section._id} vertical className="mb-8" gap={16}>
                                <Flex justify="space-between" align="center">
                                    <Text type="secondary" className="font-medium text-base">
                                        {activeSubmittedPage?.sections.find(
                                            s => s.section === section._id
                                        )?.title || section.title}
                                    </Text>

                                    <Button
                                        type="default"
                                        className="px-6"
                                        danger
                                        onClick={() => {
                                            dispatch(setCurrentPageIndex(activePage._id));
                                            console.log(navigationState);
                                            if (navigationState?.returnPath) {
                                                navigate(navigationState.returnPath, {
                                                    state: {
                                                        pageId: activePage._id,
                                                        sectionId: section._id,
                                                    },
                                                });
                                                return;
                                            }
                                            navigate(
                                                `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.new}`,
                                                {
                                                    state: {
                                                        pageId: activePage._id,
                                                        sectionId: section._id,
                                                    },
                                                }
                                            );
                                        }}
                                    >
                                        Change
                                    </Button>
                                </Flex>

                                {section.fields.map(field => {
                                    const submittedValues = getSubmittedValuesForField(
                                        section._id,
                                        field
                                    );

                                    let displayValue: React.ReactNode = '';

                                    if (submittedValues.length > 0) {
                                        const hasFiles = submittedValues.some(
                                            v =>
                                                typeof v === 'object' &&
                                                v !== null &&
                                                'type' in v &&
                                                v.type === 'file'
                                        );

                                        if (hasFiles) {
                                            displayValue = (
                                                <Flex vertical gap={4} align="flex-end">
                                                    {submittedValues.map((v, idx) => {
                                                        if (
                                                            typeof v === 'object' &&
                                                            v !== null &&
                                                            'type' in v &&
                                                            v.type === 'file'
                                                        ) {
                                                            if (v._id) {
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={idx}
                                                                        onClick={() =>
                                                                            downloadVendorFile(
                                                                                v._id
                                                                            )
                                                                        }
                                                                        className="text-primary"
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 4,
                                                                            background:
                                                                                'transparent',
                                                                            border: 0,
                                                                            padding: 0,
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        <LinkOutlined />
                                                                        {v.name}
                                                                    </button>
                                                                );
                                                            }
                                                            if (v.url) {
                                                                return (
                                                                    <a
                                                                        key={idx}
                                                                        href={v.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 4,
                                                                        }}
                                                                    >
                                                                        <LinkOutlined />
                                                                        {v.name}
                                                                    </a>
                                                                );
                                                            }
                                                            return null;
                                                        }
                                                        return null;
                                                    })}
                                                </Flex>
                                            );
                                        } else {
                                            // Regular values
                                            displayValue = submittedValues.join(', ');
                                        }
                                    }

                                    return (
                                        <>
                                            <Row key={field._id}>
                                                <Col span={6}>
                                                    <Text>{field.label}:</Text>
                                                </Col>
                                                <Col span={16}>
                                                    <Flex className="text-right">
                                                        {displayValue}
                                                    </Flex>
                                                </Col>
                                            </Row>
                                            <Divider />
                                        </>
                                    );
                                })}
                            </Flex>
                        ))}
                    </Flex>

                    <Flex justify="space-between" align="center">
                        <Button danger type="default" className="px-6" onClick={handleBack}>
                            Go Back
                        </Button>

                        <Space>
                            <Button
                                loading={isLast && submittingFinal}
                                type="primary"
                                danger
                                className="px-6"
                                onClick={handleNext}
                            >
                                {isLast ? 'Submit' : 'Next'}
                            </Button>
                        </Space>
                    </Flex>
                </Flex>
            </Card>
        </>
    );
}
