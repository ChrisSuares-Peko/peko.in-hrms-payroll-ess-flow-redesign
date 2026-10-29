import { useEffect } from 'react';

import { Flex } from 'antd';
import { useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import SummaryRow from './SummaryRow';
import { CreateInvoiceFormValues } from '../../types/createInvoice';
import {
    calcAmountDue,
    calcDiscount,
    calcSubtotal,
    calcTax,
    calcTotal,
} from '../../utils/invoiceCalculations';

interface SummarySectionProps {
    businessState: string;
    isCreditNoteMode?: boolean;
}

const SummarySection = ({ businessState, isCreditNoteMode }: SummarySectionProps) => {
    const { values, setFieldValue } = useFormikContext<CreateInvoiceFormValues>();

    const subtotal = calcSubtotal(values.items);
    const tax = calcTax(values.items);
    const discount = calcDiscount(values.items);
    const total = calcTotal(values.items, values.additional.shippingCost);
    const amountDue = calcAmountDue(total, values.additional.amountPaid);
    const isCashSale = !!values.invoice.isCashSale;

    // Cash sale is treated as paid in full — keep Amount Paid locked to the running total.
    useEffect(() => {
        if (isCashSale) {
            setFieldValue('additional.amountPaid', total);
        }
    }, [isCashSale, total, setFieldValue]);

    const isInternational = values.invoice.type === 'INTERNATIONAL';
    const isInterState =
        !isInternational &&
        !!businessState &&
        !!values.buyer.state &&
        values.buyer.state.toLowerCase() !== businessState.toLowerCase();

    const taxNum = parseFloat(tax) || 0;
    const halfTax = (taxNum / 2).toFixed(2);
    const currency = values.invoice.currency || 'INR';

    return (
        <Flex vertical className="w-full xl:max-w-[420px] px-0 sm:px-3 bg-white">
            <SummaryRow label="Subtotal" amount={subtotal} currency={currency} />

            {!isInternational && isInterState && (
                <SummaryRow label="IGST" amount={tax} currency={currency} />
            )}
            {!isInternational && !isInterState && (
                <>
                    <SummaryRow label="CGST" amount={halfTax} currency={currency} />
                    <SummaryRow label="SGST" amount={halfTax} currency={currency} />
                </>
            )}

            <SummaryRow label="Discount" amount={discount} currency={currency} />

            <SummaryRow label="Shipping Cost">
                <TextInput
                    name="additional.shippingCost"
                    placeholder="Enter Amount"
                    type="text"
                    size="middle"
                    formItemClass="m-0"
                    allowNumbersOnly
                    maxLength={10}
                />
            </SummaryRow>

            <SummaryRow label="Total Amount" amount={total} currency={currency} />

            {!isCreditNoteMode && (
                <SummaryRow label="Amount Paid">
                    <TextInput
                        name="additional.amountPaid"
                        placeholder="Enter Amount"
                        type="text"
                        formItemClass="m-0"
                        allowTwoDecimalsOnly
                        isDisabled={isCashSale}
                    />
                </SummaryRow>
            )}

            <SummaryRow label="Amount Due" amount={amountDue} currency={currency} />
        </Flex>
    );
};

export default SummarySection;
