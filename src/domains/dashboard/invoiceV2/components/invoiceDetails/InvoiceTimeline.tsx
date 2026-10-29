import { useMemo } from 'react';

import { Card, Steps } from 'antd';

import { GetInvoiceByIdResponse } from '../../types/invoice';
import { formatDate } from '../../utils/helperFunctions';

interface Props {
    invoiceData: GetInvoiceByIdResponse | null;
}

const InvoiceTimeline = ({ invoiceData }: Props) => {
    const isPaid = invoiceData?.status === 'PAID';
    const currentStep = isPaid ? 2 : 1;

    const timelineSteps = useMemo(
        () => [
            {
                title: 'Invoice Added',
                description: formatDate(invoiceData?.invoiceDate),
            },
            {
                title: 'Payment Pending',
                description: currentStep > 1 ? formatDate(invoiceData?.invoiceDate) : undefined,
            },
            {
                title: isPaid ? 'Paid' : 'Not Paid',
                description: isPaid ? formatDate(invoiceData?.paymentDate) : undefined,
            },
        ],
        [invoiceData, isPaid, currentStep]
    );

    return (
        <Card className="w-full rounded-2xl">
            <Steps
                current={currentStep}
                size="small"
                items={timelineSteps}
                labelPlacement="vertical"
            />
        </Card>
    );
};

export default InvoiceTimeline;
