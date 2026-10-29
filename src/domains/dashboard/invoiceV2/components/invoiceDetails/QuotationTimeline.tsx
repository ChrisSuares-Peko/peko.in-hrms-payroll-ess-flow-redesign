import { Card, Steps } from 'antd';

import { GetInvoiceByIdResponse } from '../../types/invoice';

interface Props {
    invoiceData: GetInvoiceByIdResponse | null;
}

const STEP2_CONFIG: Record<string, { title: string; stepStatus: 'finish' | 'error' | 'wait' | 'process' }> = {
    ACCEPTED:  { title: 'Accepted',             stepStatus: 'finish' },
    CANCELLED: { title: 'Rejected',             stepStatus: 'error' },
    OVERDUE:   { title: 'Expired',              stepStatus: 'error' },
    CONVERTED: { title: 'Converted to Invoice', stepStatus: 'finish' },
};

const QuotationTimeline = ({ invoiceData }: Props) => {
    const status = invoiceData?.status ?? 'PENDING';
    const step2 = STEP2_CONFIG[status];
    const isStep2Active = !!step2;
    const issueDate = invoiceData?.invoiceDate ?? '';
    const updatedAt = invoiceData?.updatedAt
        ? invoiceData.updatedAt.split('T')[0]
        : invoiceData?.invoiceDate ?? '';

    return (
        <Card bordered className="rounded-lg" styles={{ body: { padding: 24 } }}>
            <Steps
                current={isStep2Active ? 1 : 0}
                size="small"
                items={[
                    {
                        title: 'Quotation Created',
                        description: issueDate,
                        status: 'finish',
                    },
                    {
                        title: step2?.title ?? 'Pending',
                        description: isStep2Active ? updatedAt : '',
                        status: step2?.stepStatus ?? 'wait',
                    },
                ]}
            />
        </Card>
    );
};

export default QuotationTimeline;
