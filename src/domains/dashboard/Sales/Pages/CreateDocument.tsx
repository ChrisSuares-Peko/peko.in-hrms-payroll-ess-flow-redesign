import React, { useEffect, useMemo, useState } from 'react';

import { ArrowRightOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Segmented, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import CreateDocumentSkeleton from '../components/createDocument/CreateDocumentSkeleton';
import ItemsTable from '../components/createDocument/ItemsTable';
import SummarySection from '../components/createDocument/SummarySection';
import SettingsDrawer from '../components/SettingsDrawer';
import { CURRENCY_OPTIONS, DOC_CONFIG } from '../constants/createDocument';
import AdditionalInfoForm from '../forms/createDocument/AdditionalInfoForm';
import BuyerDetailsForm from '../forms/createDocument/BuyerDetailsForm';
import DocumentDetailsForm from '../forms/createDocument/DocumentDetailsForm';
import useCreateDocument from '../hooks/useCreateDocument';
import { useFormAutoFocus } from '../hooks/useFormAutoFocus';
import useIndianStates from '../hooks/useIndianStates';
import useSettings from '../hooks/useSettings';
import { createDocumentSchema } from '../schema/createDocumentSchema';
import { CreateDocumentFormValues } from '../types/createDocument';
import { DocumentType, DOC_LABEL } from '../types/documents';
import { splitSettingsValues } from '../utils/settingsUtils';

const EMPTY_INITIAL_VALUES: CreateDocumentFormValues = {
    buyer: {
        name: '',
        gstNumber: '',
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        email: '',
        phoneNumber: '',
        saveCustomer: false,
    },
    document: {
        type: 'DOMESTIC',
        documentPrefix: '',
        documentNumber: '',
        currency: '',
        documentDate: '',
        dueDate: '',
    },
    items: [
        {
            name: '',
            hsn: '',
            quantity: '',
            unit: '',
            unitPrice: '',
            discount: '0',
            taxRate: '0',
            taxMode: 'Exclusive',
            netAmount: '',
        },
    ],
    additional: {
        termsAndConditions: '',
        notes: '',
        shippingCost: '',
        amountPaid: '',
        paymentMode: 'Cash',
        signature: null,
        removeSignature: false,
    },
};

interface CreateDocumentProps {
    documentType: DocumentType;
}

const CreateDocument: React.FC<CreateDocumentProps> = ({ documentType }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: documentId } = useParams<{ id?: string }>();
    const isEditMode = !!documentId;
    const config = DOC_CONFIG[documentType];
    const state = location.state as { fromQuotationId?: string; fromSalesOrderId?: string } | null;
    const fromSourceId = state?.fromQuotationId ?? state?.fromSalesOrderId;

    const {
        customers,
        editInitialValues,
        convertInitialValues,
        nextDocumentNumber,
        isLoading,
        handleDocument,
    } = useCreateDocument(documentType, documentId, fromSourceId);
    const { settings, saveSettings, isLoading: settingsLoading } = useSettings({ skipProfile: true });
    const { stateOptions } = useIndianStates();
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({
        schema: createDocumentSchema,
    });
    const [transactionType, settransactionType] = useState<'DOMESTIC' | 'INTERNATIONAL'>(
        'DOMESTIC'
    );
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        if (editInitialValues?.document?.type) {
            settransactionType(editInitialValues.document.type as 'DOMESTIC' | 'INTERNATIONAL');
        }
    }, [editInitialValues]);

    const defaultTaxRate = settings?.gstPercent ?? '0';

    const settingsInitialValues = useMemo<CreateDocumentFormValues>(() => {
        const now = dayjs();
        return {
            ...EMPTY_INITIAL_VALUES,
            items: [
                {
                    ...EMPTY_INITIAL_VALUES.items[0],
                    taxRate: defaultTaxRate,
                    itemId: crypto.randomUUID(),
                },
            ],
            document: {
                ...EMPTY_INITIAL_VALUES.document,
                documentPrefix: settings?.documentPrefixes?.[DOC_LABEL[documentType]] ?? '',
                documentNumber: nextDocumentNumber,
                documentDate: now.format('YYYY-MM-DD'),
                dueDate: now.add(settings?.defaultDueDays ?? 14, 'day').format('YYYY-MM-DD'),
            },
            additional: {
                ...EMPTY_INITIAL_VALUES.additional,
                termsAndConditions: settings?.termsAndConditions || '',
                notes: settings?.notes || '',
                paymentMode: settings?.paymentMode || EMPTY_INITIAL_VALUES.additional.paymentMode,
            },
        };
    }, [settings, documentType, nextDocumentNumber, defaultTaxRate]);

    let initialValues: CreateDocumentFormValues;
    if (isEditMode) {
        initialValues = editInitialValues ?? EMPTY_INITIAL_VALUES;
    } else if (convertInitialValues) {
        initialValues = { ...settingsInitialValues, ...convertInitialValues };
    } else {
        initialValues = settingsInitialValues;
    }

    const onSuccess = (id: string) => {
        if (documentType === 'INVOICE') {
            navigate(
                `/${paths.sales.index}/${paths.sales.invoices}/${paths.sales.invoicedetails.replace(':id', id)}`
            );
        } else if (documentType === 'SALES_ORDER') {
            navigate(
                `/${paths.sales.index}/${paths.sales.salesOrders}/${paths.sales.salesOrderDetails.replace(':id', id)}`
            );
        } else {
            navigate(
                `/${paths.sales.index}/${paths.sales.quotations}/${paths.sales.quotationDetails.replace(':id', id)}`
            );
        }
    };

    if (settingsLoading || (isEditMode && !editInitialValues)) {
        return <CreateDocumentSkeleton />;
    }

    return (
        <>
            <Flex justify="flex-end" className="mb-3">
                <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
                    Settings
                </Button>
            </Flex>
            <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />

            <Formik
            initialValues={initialValues}
            validationSchema={createDocumentSchema}
            enableReinitialize
            onSubmit={values =>
                handleDocument(values, (id: string) => {
                    const { termsAndConditions, notes, signature, removeSignature } =
                        values.additional;
                    if (
                        settings &&
                        (termsAndConditions !== settings.termsAndConditions ||
                            notes !== settings.notes ||
                            signature ||
                            removeSignature)
                    ) {
                        saveSettings(
                            splitSettingsValues({
                                ...settings,
                                termsAndConditions,
                                notes,
                                signature,
                                removeSignature,
                            }),
                            { silent: true }
                        );
                    }
                    onSuccess(id);
                })
            }
        >
            {({ handleSubmit, setFieldValue, setFieldTouched, values }) => (
                <Form
                    className="w-full"
                    onKeyDown={(e: React.KeyboardEvent<HTMLFormElement>) => {
                        if (e.key !== 'Enter') return;
                        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
                        e.preventDefault();
                        const all = Array.from(
                            e.currentTarget.querySelectorAll<HTMLElement>(
                                'input:not([disabled]):not([type="hidden"]), .ant-select-selector'
                            )
                        ).filter(el => !el.closest('.ant-select-disabled'));
                        const active = document.activeElement as HTMLElement;
                        let idx = all.indexOf(active);
                        if (idx === -1) {
                            const parent = active?.closest<HTMLElement>('.ant-select-selector');
                            if (parent) idx = all.indexOf(parent);
                        }
                        if (idx > -1 && idx < all.length - 1) all[idx + 1].focus();
                    }}
                >
                    <Flex className="w-full bg-[#fafafa] rounded-2xl sm:rounded-3xl p-3 sm:p-6 lg:p-10">
                        <Flex
                            vertical
                            gap={30}
                            className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-14 shadow-md"
                        >
                            {/* Header */}
                            <Flex vertical gap={16}>
                                <Flex justify="space-between" align="center" wrap gap={12}>
                                    <Typography.Text className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                                        {isEditMode ? `Edit ${config.title}` : `Create ${config.title}`}
                                    </Typography.Text>
                                    <Select
                                        value={values.document.currency || 'INR'}
                                        onChange={val => setFieldValue('document.currency', val)}
                                        options={CURRENCY_OPTIONS}
                                        style={{ width: 180 }}
                                        disabled
                                    />
                                </Flex>
                                <Flex justify="center">
                                    <Segmented
                                        block
                                        value={transactionType}
                                        onChange={val => {
                                            settransactionType(val as 'DOMESTIC' | 'INTERNATIONAL');
                                            setFieldValue('document.type', val);
                                        }}
                                        options={[
                                            { label: 'Domestic', value: 'DOMESTIC' },
                                            { label: 'International', value: 'INTERNATIONAL' },
                                        ]}
                                        className="w-full max-w-[400px] !rounded-full !bg-[#fafafa] !px-1 sm:!px-2 !py-1 my-2
                                            [&_.ant-segmented-item]:rounded-full
                                            [&_.ant-segmented-item]:text-sm sm:[&_.ant-segmented-item]:text-base
                                            [&_.ant-segmented-item]:py-1
                                            [&_.ant-segmented-item]:px-2 sm:[&_.ant-segmented-item]:px-4
                                            [&_.ant-segmented-item-selected]:text-[#ff4f4f]
                                            [&_.ant-segmented-item-selected]:font-semibold
                                            [&_.ant-segmented-thumb]:rounded-full"
                                    />
                                </Flex>
                            </Flex>

                            {/* Buyer + Document Details */}
                            <Flex gap={24} className="flex-col xl:flex-row">
                                <BuyerDetailsForm
                                    customers={customers}
                                    isLoading={isLoading}
                                    stateOptions={stateOptions}
                                />
                                <DocumentDetailsForm
                                    sectionTitle={config.sectionTitle}
                                    numberLabel={config.numberLabel}
                                    numberPlaceholder={config.numberPlaceholder}
                                    autoUpdateDocNumber={settings?.autoUpdateDocNumber}
                                    hidePaymentMode={documentType === 'QUOTATION'}
                                />
                            </Flex>

                            {/* Items Table */}
                            <ItemsTable defaultTaxRate={defaultTaxRate} />

                            {/* Additional Info + Summary */}
                            <Flex gap={24} className="flex-col xl:flex-row">
                                <AdditionalInfoForm signatureUrl={settings?.signatureUrl ?? null} />
                                <SummarySection businessState={settings?.state ?? ''} />
                            </Flex>

                            {/* Action Buttons */}
                            <Flex justify="flex-end" wrap gap={12} className="pt-2">
                                <Button
                                    size="large"
                                    className="w-full sm:w-auto"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    size="large"
                                    className="w-full sm:w-auto"
                                    loading={isLoading}
                                    icon={<ArrowRightOutlined />}
                                    iconPosition="end"
                                    onClick={() =>
                                        handleFormSubmitWithAutoFocus(
                                            handleSubmit,
                                            setFieldTouched,
                                            values
                                        )
                                    }
                                >
                                    {isEditMode ? config.updateLabel : config.submitLabel}
                                </Button>
                            </Flex>
                        </Flex>
                    </Flex>
                </Form>
            )}
        </Formik>
        </>
    );
};

export default CreateDocument;
