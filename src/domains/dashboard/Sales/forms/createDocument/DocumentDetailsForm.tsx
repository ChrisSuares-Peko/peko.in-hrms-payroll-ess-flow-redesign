import { Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';

import { CURRENCY_OPTIONS } from '../../constants/createDocument';
import { PAYMENT_MODE_OPTIONS } from '../../constants/settings';
import { CreateDocumentFormValues } from '../../types/createDocument';

interface DocumentDetailsFormProps {
    sectionTitle?: string;
    numberLabel?: string;
    numberPlaceholder?: string;
    dateLabel?: string;
    autoUpdateDocNumber?: boolean;
    hidePaymentMode?: boolean;
}

const DocumentDetailsForm = ({
    sectionTitle = 'Document Details',
    numberLabel = 'Document Number',
    numberPlaceholder = 'Enter Document Number',
    dateLabel = 'Document Date',
    autoUpdateDocNumber = false,
    hidePaymentMode = false,
}: DocumentDetailsFormProps) => {
    const { values } = useFormikContext<CreateDocumentFormValues>();
    const isInternational = values.document.type === 'INTERNATIONAL';
    const minDueDate = values.document.documentDate
        ? dayjs(values.document.documentDate).add(1, 'day')
        : undefined;

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
                            name="document.documentPrefix"
                            placeholder="Prefix"
                            type="text"
                            formItemClass="m-0 w-24"
                            isRequired
                        />
                        <TextInput
                            name="document.documentNumber"
                            placeholder={numberPlaceholder}
                            type="text"
                            formItemClass="m-0 flex-1"
                            isDisabled={autoUpdateDocNumber}
                            isRequired
                        />
                    </Flex>
                </Flex>

                {isInternational && (
                    <Flex className="w-full [&_.ant-form-item]:mb-0 [&_.ant-form-item]:w-full">
                        <SelectInputWithSearch
                            name="document.currency"
                            placeholder="Select Currency"
                            options={CURRENCY_OPTIONS}
                            isRequired
                        />
                    </Flex>
                )}

                <DatePickerInput
                    name="document.documentDate"
                    label={dateLabel}
                    placeholder="Select date"
                    classes="w-full"
                    formItemClass="m-0"
                    needConfirm={false}
                    isRequired
                />

                <DatePickerInput
                    name="document.dueDate"
                    label="Due Date"
                    placeholder="Select date"
                    classes="w-full"
                    formItemClass="m-0"
                    needConfirm={false}
                    minDate={minDueDate}
                    isRequired
                />

                {!hidePaymentMode && (
                    <SelectInput
                        name="additional.paymentMode"
                        label="Payment Mode"
                        placeholder="Select payment mode"
                        options={PAYMENT_MODE_OPTIONS}
                        isRequired
                    />
                )}
            </Flex>
        </Form>
    );
};

export default DocumentDetailsForm;
