import { useEffect } from 'react';

import { Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';

import { CURRENCY_OPTIONS } from '../../constants/createInvoice';
import { PAYMENT_MODE_OPTIONS } from '../../constants/settings';
import { CreateInvoiceFormValues } from '../../types/createInvoice';

interface InvoiceDetailsFormProps {
    autoUpdateDocumentNumber?: boolean;
    isEditMode?: boolean;
    hideDateOfSupply?: boolean;
    isCreditNoteMode?: boolean;
    isQuotationMode?: boolean;
    defaultDueDays?: number;
}

const InvoiceDetailsForm = ({
    autoUpdateDocumentNumber = false,
    isEditMode = false,
    hideDateOfSupply = false,
    isCreditNoteMode = false,
    isQuotationMode = false,
    defaultDueDays = 15,
}: InvoiceDetailsFormProps) => {
    const { values, setFieldValue } = useFormikContext<CreateInvoiceFormValues>();
    const isInternational = values.invoice.type === 'INTERNATIONAL';
    const isCashSale = !!values.invoice.isCashSale;
    // AntD's DatePicker `minDate` bound is inclusive, so the invoice date itself (not the day
    // after it) is the earliest valid due date — same-day due dates are valid invoices.
    const minDueDate = values.invoice.invoiceDate ? dayjs(values.invoice.invoiceDate) : undefined;

    useEffect(() => {
        if (!isCreditNoteMode || !values.invoice.invoiceDate) return;
        const newDueDate = dayjs(values.invoice.invoiceDate)
            .add(defaultDueDays, 'day')
            .format('YYYY-MM-DD');
        setFieldValue('invoice.dueDate', newDueDate);
    }, [values.invoice.invoiceDate, isCreditNoteMode, defaultDueDays, setFieldValue]);

    // Cash sale is always paid in cash — lock the payment mode so it can't drift.
    useEffect(() => {
        if (isCashSale) {
            setFieldValue('additional.paymentMode', 'CASH');
        }
    }, [isCashSale, setFieldValue]);

    let sectionTitle = 'Invoice Details';
    if (isCreditNoteMode) sectionTitle = 'Credit Note Details';
    else if (isQuotationMode) sectionTitle = 'Quotation Details';

    let numberPlaceholder = 'Enter Invoice Number';
    if (isQuotationMode) numberPlaceholder = 'Enter Quotation Number';
    else if (isCreditNoteMode) numberPlaceholder = 'Enter CN Number';

    let numberLabel = 'Invoice Number';
    if (isCreditNoteMode) numberLabel = 'Credit Note Number';
    else if (isQuotationMode) numberLabel = 'Quotation Number';

    return (
        <Form layout="vertical" className="w-full [&_.ant-form-item]:mb-0">
            <Flex vertical gap={14} className="w-full">
                <Typography.Text className="text-xl font-medium">{sectionTitle}</Typography.Text>

                <Flex vertical gap={4}>
                    <span className="ant-form-item-label" style={{ paddingBottom: 0 }}>
                        {numberLabel}
                    </span>
                    <Flex gap={8} align="flex-start" className="flex-row">
                        <TextInput
                            name="invoice.invoicePrefix"
                            placeholder="Prefix"
                            type="text"
                            formItemClass="m-0 w-24"
                            isDisabled={isEditMode}
                        />
                        <TextInput
                            name="invoice.invoiceNumber"
                            placeholder={numberPlaceholder}
                            type="text"
                            formItemClass="m-0 flex-1"
                            isDisabled={isEditMode || autoUpdateDocumentNumber}
                        />
                    </Flex>
                </Flex>

                {isInternational && (
                    <Flex className="w-full [&_.ant-form-item]:mb-0 [&_.ant-form-item]:w-full">
                        <SelectInputWithSearch
                            name="invoice.currency"
                            label="Currency"
                            placeholder="Select Currency"
                            options={CURRENCY_OPTIONS}
                            isRequired
                        />
                    </Flex>
                )}

                <DatePickerInput
                    name="invoice.invoiceDate"
                    label={isCreditNoteMode || isQuotationMode ? 'Issue Date' : 'Invoice Date'}
                    placeholder="Select date"
                    classes="w-full"
                    formItemClass="m-0"
                    needConfirm={false}
                    isRequired
                />

                <DatePickerInput
                    name="invoice.dueDate"
                    label="Due Date"
                    placeholder="Select date"
                    classes="w-full"
                    formItemClass="m-0"
                    needConfirm={false}
                    minDate={minDueDate}
                    isDisabled={isCreditNoteMode && !values.invoice.invoiceDate}
                    isRequired
                />

                {!hideDateOfSupply && (
                    <DatePickerInput
                        name="invoice.dateOfSupply"
                        label="Date of Supply"
                        placeholder="Select date"
                        classes="w-full"
                        formItemClass="m-0"
                        needConfirm={false}
                    />
                )}

                {!isQuotationMode && !isCreditNoteMode && (
                    <SelectInput
                        name="additional.paymentMode"
                        label="Payment Mode"
                        placeholder="Select payment mode"
                        options={PAYMENT_MODE_OPTIONS}
                        isRequired
                        isDisabled={isCashSale}
                    />
                )}
            </Flex>
        </Form>
    );
};

export default InvoiceDetailsForm;
