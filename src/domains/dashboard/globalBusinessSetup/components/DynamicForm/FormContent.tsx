import { useMemo, useCallback, useEffect, useState } from 'react';

import { Button, Card, Col, Flex, Row } from 'antd';
import { useFormikContext } from 'formik';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import PageTabs from './PageTabs';
import SectionRenderer from './SectionRenderer';
import { IForm } from '../../types/forms';
import { getNestedValue, evaluateCondition } from '../../utils/conditionalUtils';
import { initializeMissingFields } from '../../utils/initializeMissingFields';
import { getValueFromComplexPath } from '../../utils/pathResolver';

type FormContentProps = {
    form: IForm;
    currentPage: string;
    initialSectionId?: string;
    setCurrentPage: (pageId: string) => void;
    currentPageIndex: number;
    setCurrentPageIndex: (index: number | ((prev: number) => number)) => void;
    isLastPage: boolean;
    onSubmit: (value: any, status: 'draft' | 'saved', silent?: boolean) => Promise<boolean>;
    finalSubmitLoading: boolean;
    draftLoading: boolean;
    isEdit?: boolean;
};

export default function FormContent({
    form,
    currentPage,
    initialSectionId,
    setCurrentPage,
    currentPageIndex,
    setCurrentPageIndex,
    isLastPage,
    onSubmit,
    finalSubmitLoading,
    draftLoading,
    isEdit = false,
}: FormContentProps) {
    const { validateForm, setTouched, values, handleSubmit, setFieldValue } =
        useFormikContext<any>();

    const [saveLoading, setSaveLoading] = useState(false);
    const [nextLoading, setNextLoading] = useState(false);
    const { pages } = form;
    const page = pages[currentPageIndex];

    const navigate = useNavigate();

    useEffect(() => {
        initializeMissingFields(form, values, setFieldValue);
    }, [form, values, setFieldValue]);

    const [maxVisitedIndex, setMaxVisitedIndex] = useState(currentPageIndex);

    useEffect(() => {
        setMaxVisitedIndex(prev => Math.max(prev, currentPageIndex));
    }, [currentPageIndex]);

    useEffect(() => {
        const container = document.getElementById('myContainer');
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPageIndex]);

    useEffect(() => {
        if (!initialSectionId) return;

        const el = document.getElementById(`section-${initialSectionId}`);
        if (!el) return;

        // Scroll section into view and focus first input if possible
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const focusable =
            (el.querySelector(
                'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement | null) ?? null;
        focusable?.focus?.();
    }, [initialSectionId, currentPageIndex]);

    const shouldValidateField = useCallback(
        (
            field: IForm['pages'][0]['sections'][0]['fields'][0],
            pageId: string,
            sectionId: string,
            instanceIdx?: number
        ): boolean => {
            if (!field.conditional?.enabled || !field.conditional.source_field_name) {
                return true;
            }

            const sourceValue = getValueFromComplexPath(
                form,
                values,
                field.conditional.source_field_name,
                pageId,
                sectionId,
                instanceIdx
            );

            if (sourceValue === undefined || sourceValue === null) {
                return false;
            }

            if (!field.conditional.operator) {
                return false;
            }

            return evaluateCondition(
                sourceValue,
                field.conditional.operator,
                field.conditional.value
            );
        },
        [values, form]
    );

    const shouldValidateSection = useCallback(
        (section: IForm['pages'][0]['sections'][0], pageId: string): boolean => {
            if (!section.conditional?.enabled || !section.conditional.source_field_name) {
                return true;
            }

            const sourceValue = getValueFromComplexPath(
                form,
                values,
                section.conditional.source_field_name,
                pageId,
                section._id
            );

            if (sourceValue === undefined || sourceValue === null) {
                return false;
            }

            if (!section.conditional.operator) {
                return false;
            }

            return evaluateCondition(
                sourceValue,
                section.conditional.operator,
                section.conditional.value
            );
        },
        [values, form]
    );

    const currentPageFieldPaths = useMemo(() => {
        if (!page) return [];

        const localPaths: string[] = [];

        page.sections.forEach(section => {
            if (!shouldValidateSection(section, page._id)) {
                return;
            }

            const isRepeatable = section.repeater?.enabled;

            if (isRepeatable) {
                const sectionValues = getNestedValue(values, `pages.${page._id}.${section._id}`);

                if (sectionValues && typeof sectionValues === 'object') {
                    const instanceIndices = Object.keys(sectionValues)
                        .filter(key => !Number.isNaN(Number(key)))
                        .map(key => Number(key))
                        .sort((a, b) => a - b);

                    instanceIndices.forEach(instanceIdx => {
                        section.fields.forEach(field => {
                            if (shouldValidateField(field, page._id, section._id, instanceIdx)) {
                                localPaths.push(
                                    `pages.${page._id}.${section._id}.${instanceIdx}.${field.name}`
                                );
                            }
                        });
                    });
                } else {
                    const minInstances = section.repeater?.min_instances || 0;
                    if (minInstances > 0) {
                        for (let i = 0; i < minInstances; i += 1) {
                            section.fields.forEach(field => {
                                if (shouldValidateField(field, page._id, section._id, i)) {
                                    localPaths.push(
                                        `pages.${page._id}.${section._id}.${i}.${field.name}`
                                    );
                                }
                            });
                        }
                    }
                }
            } else {
                section.fields.forEach(field => {
                    if (shouldValidateField(field, page._id, section._id)) {
                        localPaths.push(`pages.${page._id}.${section._id}.${field.name}`);
                    }
                });
            }
        });

        return localPaths;
    }, [page, values, shouldValidateField, shouldValidateSection]);

    const getNestedError = (obj: any, path: string) =>
        path.split('.').reduce<any>((acc, key) => (acc && acc[key] ? acc[key] : undefined), obj);

    const getValueByPath = (obj: any, path: string) =>
        path.split('.').reduce((acc, key) => acc?.[key], obj);

    const goToPage = async (targetIndex: number) => {
        if (targetIndex <= currentPageIndex) {
            setCurrentPageIndex(targetIndex);
            setCurrentPage(pages[targetIndex]._id);
            return;
        }
        if (targetIndex <= maxVisitedIndex) {
            setCurrentPageIndex(targetIndex);
            setCurrentPage(pages[targetIndex]._id);
            return;
        }
        const errors = await validateForm();

        const hasErrors = currentPageFieldPaths.some(path => Boolean(getNestedError(errors, path)));

        if (hasErrors) {
            const touched: any = {};
            currentPageFieldPaths.forEach(path => {
                path.split('.').reduce((acc, key, idx, arr) => {
                    acc[key] = idx === arr.length - 1 ? true : acc[key] || {};
                    return acc[key];
                }, touched);
            });
            setTouched(touched, true);
            return;
        }

        setCurrentPageIndex(targetIndex);
        setCurrentPage(pages[targetIndex]._id);
    };

    const isFirst = currentPageIndex === 0;

    const hasSectionErrors = (errors: any, pageId: string) => {
        const pageErrors = errors?.pages?.[pageId];
        if (!pageErrors || typeof pageErrors !== 'object') return false;

        return Object.values(pageErrors).some(err => typeof err === 'string');
    };

    return (
        <>
            <Row gutter={[24, 30]}>
                <Col>
                    <PageTabs
                        pages={pages}
                        currentPage={currentPage}
                        maxVisitedIndex={maxVisitedIndex}
                        onChange={pageId => {
                            const index = pages.findIndex(p => p._id === pageId);
                            goToPage(index);
                        }}
                    />
                </Col>
            </Row>

            <Card className="rounded-3xl p-4">
                <Flex vertical gap={10}>
                    {page?.sections.map(section => (
                        <SectionRenderer
                            key={section._id}
                            section={section}
                            pageId={page._id}
                            form={form}
                        />
                    ))}
                </Flex>
                <Flex justify="space-between" className="gap-2" style={{ marginTop: 24 }}>
                    <Button
                        type="default"
                        danger
                        className="px-6"
                        onClick={() => {
                            if (isFirst) {
                                navigate(-1);
                                return;
                            }
                            const prevIndex = currentPageIndex - 1;
                            setCurrentPageIndex(prevIndex);
                            setCurrentPage(pages[prevIndex]._id);
                        }}
                    >
                        Go Back
                    </Button>
                    <Flex align="center" gap={8}>
                        <Button
                            type="default"
                            danger
                            className="px-6 w-36"
                            onClick={async () => {
                                try {
                                    setSaveLoading(true);
                                    const success = await onSubmit(values, 'draft');

                                    if (success) {
                                        navigate(
                                            `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}`
                                        );
                                    }
                                } finally {
                                    setSaveLoading(false);
                                }
                            }}
                            loading={saveLoading}
                        >
                            {isEdit ? 'Update Draft' : 'Save as Draft'}
                        </Button>
                        {!isLastPage && (
                            <Button
                                type="primary"
                                danger
                                className="px-6 w-36"
                                loading={nextLoading}
                                onClick={async () => {
                                    setNextLoading(true);
                                    const touchedObj: any = { pages: {} };

                                    page.sections.forEach(section => {
                                        if (!shouldValidateSection(section, page._id)) {
                                            return;
                                        }

                                        if (!touchedObj.pages[page._id]) {
                                            touchedObj.pages[page._id] = {};
                                        }

                                        const isRepeatable = section.repeater?.enabled;
                                        if (isRepeatable) {
                                            const sectionValues = getNestedValue(
                                                values,
                                                `pages.${page._id}.${section._id}`
                                            );
                                            if (
                                                sectionValues &&
                                                typeof sectionValues === 'object'
                                            ) {
                                                const instanceIndices = Object.keys(sectionValues)
                                                    .filter(key => !Number.isNaN(Number(key)))
                                                    .map(key => Number(key))
                                                    .sort((a, b) => a - b);
                                                instanceIndices.forEach(instanceIdx => {
                                                    if (!touchedObj.pages[page._id][section._id]) {
                                                        touchedObj.pages[page._id][section._id] =
                                                            {};
                                                    }
                                                    if (
                                                        !touchedObj.pages[page._id][section._id][
                                                            instanceIdx
                                                        ]
                                                    ) {
                                                        touchedObj.pages[page._id][section._id][
                                                            instanceIdx
                                                        ] = {};
                                                    }
                                                    section.fields.forEach(field => {
                                                        if (
                                                            shouldValidateField(
                                                                field,
                                                                page._id,
                                                                section._id,
                                                                instanceIdx
                                                            )
                                                        ) {
                                                            touchedObj.pages[page._id][section._id][
                                                                instanceIdx
                                                            ][field.name] = true;
                                                        }
                                                    });
                                                });
                                            } else {
                                                const minInstances =
                                                    section.repeater?.min_instances || 0;
                                                if (minInstances > 0) {
                                                    if (!touchedObj.pages[page._id][section._id]) {
                                                        touchedObj.pages[page._id][section._id] =
                                                            {};
                                                    }
                                                    for (let i = 0; i < minInstances; i += 1) {
                                                        if (
                                                            !touchedObj.pages[page._id][
                                                                section._id
                                                            ][i]
                                                        ) {
                                                            touchedObj.pages[page._id][section._id][
                                                                i
                                                            ] = {};
                                                        }
                                                        section.fields.forEach(field => {
                                                            if (
                                                                shouldValidateField(
                                                                    field,
                                                                    page._id,
                                                                    section._id,
                                                                    i
                                                                )
                                                            ) {
                                                                touchedObj.pages[page._id][
                                                                    section._id
                                                                ][i][field.name] = true;
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        } else {
                                            touchedObj.pages[page._id][section._id] = {};
                                            section.fields.forEach(field => {
                                                if (
                                                    shouldValidateField(
                                                        field,
                                                        page._id,
                                                        section._id
                                                    )
                                                ) {
                                                    touchedObj.pages[page._id][section._id][
                                                        field.name
                                                    ] = true;
                                                }
                                            });
                                        }
                                    });

                                    setTouched(touchedObj, true);

                                    const validationErrors = await validateForm();
                                    const hasFieldErrors = currentPageFieldPaths.some(path =>
                                        Boolean(getValueByPath(validationErrors, path))
                                    );

                                    const hasSectionLevelErrors = hasSectionErrors(
                                        validationErrors,
                                        page._id
                                    );

                                    const hasPageErrors = hasFieldErrors || hasSectionLevelErrors;

                                    if (hasPageErrors) {
                                        // errors are shown inline on each card/field
                                    }

                                    if (!hasPageErrors) {
                                        const success = await onSubmit(values, 'draft', true);
                                        if (success) {
                                            const nextIndex = currentPageIndex + 1;
                                            setCurrentPageIndex(nextIndex);
                                            setCurrentPage(pages[nextIndex]._id);
                                        }
                                    }
                                    setNextLoading(false);
                                }}
                            >
                                Next
                            </Button>
                        )}

                        {isLastPage && (
                            <Button
                                type="primary"
                                danger
                                className="px-6 w-36"
                                onClick={async () => {
                                    const touchedObj: any = { pages: {} };

                                    page.sections.forEach(section => {
                                        if (!shouldValidateSection(section, page._id)) {
                                            return;
                                        }

                                        if (!touchedObj.pages[page._id]) {
                                            touchedObj.pages[page._id] = {};
                                        }

                                        const isRepeatable = section.repeater?.enabled;
                                        if (isRepeatable) {
                                            const sectionValues = getNestedValue(
                                                values,
                                                `pages.${page._id}.${section._id}`
                                            );
                                            if (
                                                sectionValues &&
                                                typeof sectionValues === 'object'
                                            ) {
                                                const instanceIndices = Object.keys(sectionValues)
                                                    .filter(key => !Number.isNaN(Number(key)))
                                                    .map(key => Number(key))
                                                    .sort((a, b) => a - b);
                                                instanceIndices.forEach(instanceIdx => {
                                                    if (!touchedObj.pages[page._id][section._id]) {
                                                        touchedObj.pages[page._id][section._id] =
                                                            {};
                                                    }
                                                    if (
                                                        !touchedObj.pages[page._id][section._id][
                                                            instanceIdx
                                                        ]
                                                    ) {
                                                        touchedObj.pages[page._id][section._id][
                                                            instanceIdx
                                                        ] = {};
                                                    }
                                                    section.fields.forEach(field => {
                                                        if (
                                                            shouldValidateField(
                                                                field,
                                                                page._id,
                                                                section._id,
                                                                instanceIdx
                                                            )
                                                        ) {
                                                            touchedObj.pages[page._id][section._id][
                                                                instanceIdx
                                                            ][field.name] = true;
                                                        }
                                                    });
                                                });
                                            } else {
                                                const minInstances =
                                                    section.repeater?.min_instances || 0;
                                                if (minInstances > 0) {
                                                    if (!touchedObj.pages[page._id][section._id]) {
                                                        touchedObj.pages[page._id][section._id] =
                                                            {};
                                                    }
                                                    for (let i = 0; i < minInstances; i += 1) {
                                                        if (
                                                            !touchedObj.pages[page._id][
                                                                section._id
                                                            ][i]
                                                        ) {
                                                            touchedObj.pages[page._id][section._id][
                                                                i
                                                            ] = {};
                                                        }
                                                        section.fields.forEach(field => {
                                                            if (
                                                                shouldValidateField(
                                                                    field,
                                                                    page._id,
                                                                    section._id,
                                                                    i
                                                                )
                                                            ) {
                                                                touchedObj.pages[page._id][
                                                                    section._id
                                                                ][i][field.name] = true;
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        } else {
                                            touchedObj.pages[page._id][section._id] = {};
                                            section.fields.forEach(field => {
                                                if (
                                                    shouldValidateField(
                                                        field,
                                                        page._id,
                                                        section._id
                                                    )
                                                ) {
                                                    touchedObj.pages[page._id][section._id][
                                                        field.name
                                                    ] = true;
                                                }
                                            });
                                        }
                                    });

                                    setTouched(touchedObj, true);

                                    const validationErrors = await validateForm();
                                    const hasFieldErrors = currentPageFieldPaths.some(path =>
                                        Boolean(getValueByPath(validationErrors, path))
                                    );

                                    const hasSectionLevelErrors = hasSectionErrors(
                                        validationErrors,
                                        page._id
                                    );

                                    const hasPageErrors = hasFieldErrors || hasSectionLevelErrors;

                                    if (!hasPageErrors) {
                                        // const success = await onSubmit(values, 'saved');

                                        // if (success) {
                                        handleSubmit(); // optional if you still want Formik submit side-effects
                                        // }
                                    }
                                }}
                                loading={finalSubmitLoading}
                            >
                                Submit
                            </Button>
                        )}
                    </Flex>
                </Flex>
            </Card>
        </>
    );
}
