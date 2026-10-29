import React, { useEffect, useMemo, useState } from 'react';

import { ArrowRightOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Segmented, Select, Skeleton, Switch, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import TextInput from '@components/atomic/inputs/TextInput';
import { paths } from '@src/routes/paths';

import CreateInvoiceSkeleton from '../components/createInvoice/CreateInvoiceSkeleton';
import ItemsTable from '../components/createInvoice/ItemsTable';
import SummarySection from '../components/createInvoice/SummarySection';
import CreditNoteInvoicePicker from '../components/creditNote/CreditNoteInvoicePicker';
import CreditNoteReasonSection from '../components/creditNote/CreditNoteReasonSection';
import LockedCustomerSection from '../components/creditNote/LockedCustomerSection';
import SettingsDrawer from '../components/SettingsDrawer';
import { CURRENCY_OPTIONS } from '../constants/createInvoice';
import AdditionalInfoForm from '../forms/createInvoice/AdditionalInfoForm';
import BuyerDetailsForm from '../forms/createInvoice/BuyerDetailsForm';
import InvoiceDetailsForm from '../forms/createInvoice/InvoiceDetailsForm';
import useCreateCreditNote from '../hooks/creditNote/create/useCreateCreditNote';
import useCreateInvoice from '../hooks/useCreateInvoice';
import { useFormAutoFocus } from '../hooks/useFormAutoFocus';
import useIndianStates from '../hooks/useIndianStates';
import useSettings from '../hooks/useSettings';
import { createInvoiceSchema } from '../schema/createInvoiceSchema';
import { CreateInvoiceFormValues, ItemValues } from '../types/createInvoice';
import { splitSettingsValues } from '../utils/settingsUtils';

const EMPTY_INITIAL_VALUES: CreateInvoiceFormValues = {
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
    invoice: {
        type: 'DOMESTIC',
        invoicePrefix: '',
        invoiceNumber: '',
        currency: '',
        exchangeRate: '',
        invoiceDate: '',
        dueDate: '',
        dateOfSupply: '',
        isCashSale: false,
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
        paymentMode: 'CASH',
        signature: null,
        removeSignature: false,
    },
};

const CreateInvoice: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: invoiceId } = useParams<{ id?: string }>();

    const [searchParams] = useSearchParams();
    const fromQuotationId = searchParams.get('fromQuotation');

    const isEditMode = !!invoiceId;
    const isCreditNoteMode = location.pathname.includes('credit-notes/create');
    const isQuotationMode =
        location.pathname.includes('create-quotation') ||
        location.pathname.includes('edit-quotation');

    const {
        customers,
        editInitialValues,
        nextInvoiceNumber,
        businessState,
        businessCity,
        isInitialLoading,
        isSubmitting,
        handleInvoice,
    } = useCreateInvoice(invoiceId, isQuotationMode ? 'QUOTATION' : 'INVOICE');

    const {
        settings,
        saveSettings,
        isLoading: isSettingsLoading,
    } = useSettings({ skipProfile: true });
    const { stateOptions, isLoading: isStatesLoading } = useIndianStates();
    const autoUpdateDocumentNumber = settings?.autoUpdateDocNumber ?? false;
    const [invoiceType, setInvoiceType] = useState<'DOMESTIC' | 'INTERNATIONAL'>('DOMESTIC');
    const [settingsOpen, setSettingsOpen] = useState(false);

    const {
        cnLinkedInvoice,
        loadingCnInvoice,
        invoiceOptions,
        loadingInvoices,
        cnInitialValues,
        availableProducts,
        handleInvoicePick,
        handleCreditNoteSubmit,
    } = useCreateCreditNote(settings?.defaultDueDays ?? 15);

    useEffect(() => {
        if (editInitialValues?.invoice?.type) {
            setInvoiceType(editInitialValues.invoice.type as 'DOMESTIC' | 'INTERNATIONAL');
        }
    }, [editInitialValues]);

    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({ schema: createInvoiceSchema });

    const isPageLoading = isInitialLoading || isSettingsLoading || isStatesLoading;
    const defaultTaxRate = settings?.gstPercent ?? '0';

    const settingsInitialValues = useMemo<CreateInvoiceFormValues>(() => {
        const now = dayjs();
        return {
            ...EMPTY_INITIAL_VALUES,
            invoice: {
                ...EMPTY_INITIAL_VALUES.invoice,
                invoicePrefix: isQuotationMode
                    ? (settings?.documentPrefixes?.Quotation ?? '')
                    : (settings?.documentPrefixes?.Invoice ?? ''),
                invoiceNumber: nextInvoiceNumber,
                currency: 'INR',
                invoiceDate: now.format('YYYY-MM-DD'),
                dueDate: now.add(settings?.defaultDueDays ?? 15, 'day').format('YYYY-MM-DD'),
            },
            items: [
                {
                    ...EMPTY_INITIAL_VALUES.items[0],
                    taxRate: defaultTaxRate,
                    itemId: crypto.randomUUID(),
                },
            ],
            additional: {
                ...EMPTY_INITIAL_VALUES.additional,
                termsAndConditions: businessCity
                    ? (settings?.termsAndConditions ?? '').replace('[Business City]', businessCity)
                    : (settings?.termsAndConditions ?? ''),
                notes: settings?.notes ?? '',
                paymentMode: settings?.paymentMode || 'CASH',
            },
        };
    }, [settings, nextInvoiceNumber, defaultTaxRate, businessCity, isQuotationMode]);

    let initialValues: CreateInvoiceFormValues;
    if (isCreditNoteMode) {
        initialValues = cnInitialValues ?? EMPTY_INITIAL_VALUES;
    } else if (fromQuotationId) {
        // Merge: settings provides fresh prefix/number/dates; quotation provides buyer+items+additional
        initialValues = editInitialValues
            ? { ...settingsInitialValues, ...editInitialValues }
            : EMPTY_INITIAL_VALUES;
    } else if (isEditMode) {
        initialValues = editInitialValues ?? EMPTY_INITIAL_VALUES;
    } else {
        initialValues = settingsInitialValues;
    }

    // CN mode: show picker until an invoice is linked
    if (isCreditNoteMode && !cnLinkedInvoice) {
        if (loadingCnInvoice) return <Skeleton active />;
        return (
            <CreditNoteInvoicePicker
                invoices={invoiceOptions}
                value=""
                onChange={handleInvoicePick}
                loading={loadingInvoices}
            />
        );
    }

    if (isPageLoading && !isCreditNoteMode) return <CreateInvoiceSkeleton />;

    let pageTitle: string;
    if (isCreditNoteMode) {
        pageTitle = 'Create Credit Note';
    } else if (isQuotationMode && isEditMode) {
        pageTitle = 'Edit Quotation';
    } else if (isQuotationMode) {
        pageTitle = 'Create Quotation';
    } else if (isEditMode) {
        pageTitle = 'Edit Invoice';
    } else {
        pageTitle = 'Create Invoice';
    }

    let submitLabel: string;
    if (isCreditNoteMode) {
        submitLabel = 'Preview Credit Note';
    } else if (isQuotationMode && isEditMode) {
        submitLabel = 'Update Quotation';
    } else if (isQuotationMode) {
        submitLabel = 'Generate Quotation';
    } else if (isEditMode) {
        submitLabel = 'Update Invoice';
    } else {
        submitLabel = 'Generate Invoice';
    }

    return (
        <>
            {!isCreditNoteMode && (
                <>
                    <Flex justify="flex-end" className="mb-3">
                        <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
                            Settings
                        </Button>
                    </Flex>
                    <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
                </>
            )}
            <Formik
                initialValues={initialValues}
                validationSchema={createInvoiceSchema}
                enableReinitialize
                onSubmit={payload => {
                    if (isCreditNoteMode) {
                        handleCreditNoteSubmit(payload);
                    } else {
                        handleInvoice(payload, autoUpdateDocumentNumber, (id: string) => {
                            const { termsAndConditions, notes, signature, removeSignature } =
                                payload.additional;
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
                            navigate(
                                `/${paths.invoice.index}/${paths.invoice.invoicedetails.replace(':id', id)}`
                            );
                        });
                    }
                }}
            >
                {({ handleSubmit, setFieldValue, setFieldTouched, values }) => (
                    <Form
                        className="w-full"
                        onKeyDown={(e: React.KeyboardEvent<HTMLFormElement>) => {
                            if (e.key !== 'Enter') return;
                            if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
                            if ((e.target as HTMLElement).isContentEditable) return;
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
                                            {pageTitle}
                                        </Typography.Text>
                                        <Flex align="center" gap={16} wrap>
                                            {!isCreditNoteMode && !isQuotationMode && (
                                                <Flex align="center" gap={8}>
                                                    <Switch
                                                        checked={!!values.invoice.isCashSale}
                                                        onChange={checked => {
                                                            setFieldValue(
                                                                'invoice.isCashSale',
                                                                checked
                                                            );
                                                            if (checked) {
                                                                setFieldValue(
                                                                    'buyer.saveCustomer',
                                                                    false
                                                                );
                                                                setFieldValue(
                                                                    'additional.paymentMode',
                                                                    'CASH'
                                                                );
                                                            } else {
                                                                setFieldValue(
                                                                    'additional.amountPaid',
                                                                    ''
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Typography.Text>Cash Sale</Typography.Text>
                                                </Flex>
                                            )}
                                            {/* TextInput/Form.Item only support a stacked label-above-input layout,
                                                so the "Label: input" pairing here is built by hand instead of via
                                                their `label` props, to keep everything on one line (matches Peko-AE). */}
                                            {values.invoice.currency &&
                                                values.invoice.currency !== 'INR' && (
                                                    <Flex
                                                        align="center"
                                                        gap={6}
                                                        className="w-full sm:w-auto sm:shrink-0 relative"
                                                    >
                                                        <Typography.Text className="!m-0 whitespace-nowrap text-sm text-gray-700">
                                                            <span className="text-red-500">*</span>{' '}
                                                            Conversion Rate:
                                                        </Typography.Text>
                                                        <TextInput
                                                            name="invoice.exchangeRate"
                                                            type="text"
                                                            placeholder="Enter conversion rate"
                                                            allowedInputKeys={value => {
                                                                let filtered = value
                                                                    .replace(/[^0-9.]/g, '')
                                                                    .replace(/(\..*?)\..*/g, '$1');
                                                                if (filtered === '.')
                                                                    filtered = '0.';
                                                                const [intPart, decPart] =
                                                                    filtered.split('.');
                                                                const cappedIntPart = intPart.slice(
                                                                    0,
                                                                    6
                                                                );
                                                                filtered =
                                                                    decPart !== undefined
                                                                        ? `${cappedIntPart}.${decPart.slice(0, 2)}`
                                                                        : cappedIntPart;
                                                                return filtered;
                                                            }}
                                                            formItemClass="!mb-0 min-w-0 flex-1 sm:!w-32 sm:flex-none [&_.ant-form-item-explain]:absolute [&_.ant-form-item-explain]:top-full [&_.ant-form-item-explain]:left-0 [&_.ant-form-item-explain]:z-10 [&_.ant-form-item-explain]:w-full [&_.ant-form-item-explain]:whitespace-normal"
                                                            classes="!w-full"
                                                        />
                                                    </Flex>
                                                )}
                                            <Flex
                                                align="center"
                                                gap={6}
                                                className="w-full sm:w-auto sm:shrink-0"
                                            >
                                                <Typography.Text className="!m-0 whitespace-nowrap text-sm text-gray-700">
                                                    <span className="text-red-500">*</span>{' '}
                                                    Currency:
                                                </Typography.Text>
                                                <Select
                                                    value={values.invoice.currency || 'INR'}
                                                    onChange={val => {
                                                        setFieldValue('invoice.currency', val);
                                                        if (
                                                            val !== 'INR' &&
                                                            !values.invoice.exchangeRate
                                                        ) {
                                                            setFieldValue(
                                                                'invoice.exchangeRate',
                                                                '1'
                                                            );
                                                        }
                                                    }}
                                                    options={CURRENCY_OPTIONS}
                                                    className="min-w-0 flex-1 sm:!w-48 sm:flex-none"
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        String(option?.label ?? '')
                                                            .toLowerCase()
                                                            .includes(input.toLowerCase())
                                                    }
                                                />
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                    {!isCreditNoteMode && !isQuotationMode && (
                                        <Flex justify="center">
                                            <Segmented
                                                block
                                                value={invoiceType}
                                                onChange={val => {
                                                    setInvoiceType(
                                                        val as 'DOMESTIC' | 'INTERNATIONAL'
                                                    );
                                                    setFieldValue('invoice.type', val);
                                                    // Domestic/International tax rates aren't compatible codes
                                                    // (e.g. '18' vs 'EXEMPTED') — reset line items' tax rate on switch.
                                                    setFieldValue(
                                                        'items',
                                                        values.items.map((item: ItemValues) => ({
                                                            ...item,
                                                            taxRate:
                                                                val === 'INTERNATIONAL'
                                                                    ? 'EXPORT_0'
                                                                    : '0',
                                                        }))
                                                    );
                                                    if (val === 'DOMESTIC') {
                                                        setFieldValue('invoice.currency', 'INR');
                                                        setFieldValue('invoice.exchangeRate', '');
                                                    } else if (
                                                        values.invoice.currency &&
                                                        values.invoice.currency !== 'INR' &&
                                                        !values.invoice.exchangeRate
                                                    ) {
                                                        setFieldValue('invoice.exchangeRate', '1');
                                                    }
                                                }}
                                                options={[
                                                    { label: 'Domestic', value: 'DOMESTIC' },
                                                    {
                                                        label: 'International',
                                                        value: 'INTERNATIONAL',
                                                    },
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
                                    )}
                                </Flex>

                                {/* Credit Note reason — shown only in CN mode */}
                                {isCreditNoteMode && <CreditNoteReasonSection />}

                                {/* Buyer / Locked Customer + Invoice Details */}
                                <Flex gap={24} className="flex-col xl:flex-row">
                                    {isCreditNoteMode && cnLinkedInvoice ? (
                                        <LockedCustomerSection inv={cnLinkedInvoice} />
                                    ) : (
                                        <BuyerDetailsForm
                                            customers={customers}
                                            isLoading={isSubmitting}
                                            stateOptions={stateOptions}
                                        />
                                    )}
                                    <InvoiceDetailsForm
                                        autoUpdateDocumentNumber={autoUpdateDocumentNumber}
                                        isEditMode={isEditMode}
                                        hideDateOfSupply={isCreditNoteMode || isQuotationMode}
                                        isCreditNoteMode={isCreditNoteMode}
                                        isQuotationMode={isQuotationMode}
                                        defaultDueDays={settings?.defaultDueDays ?? 15}
                                    />
                                </Flex>

                                {/* Items Table — editable in both modes */}
                                <ItemsTable
                                    defaultTaxRate={defaultTaxRate}
                                    creditNoteAvailableProducts={
                                        isCreditNoteMode ? availableProducts : undefined
                                    }
                                />

                                {/* Additional Info + Summary */}
                                <Flex gap={24} className="flex-col xl:flex-row">
                                    <AdditionalInfoForm
                                        signatureUrl={settings?.signatureUrl ?? null}
                                    />
                                    <SummarySection
                                        businessState={businessState}
                                        isCreditNoteMode={isCreditNoteMode}
                                    />
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
                                        loading={isSubmitting}
                                        icon={<ArrowRightOutlined />}
                                        iconPosition="end"
                                        onClick={() => {
                                            if (isCreditNoteMode) {
                                                handleSubmit();
                                            } else {
                                                handleFormSubmitWithAutoFocus(
                                                    handleSubmit,
                                                    setFieldTouched,
                                                    values
                                                );
                                            }
                                        }}
                                    >
                                        {submitLabel}
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

export default CreateInvoice;
