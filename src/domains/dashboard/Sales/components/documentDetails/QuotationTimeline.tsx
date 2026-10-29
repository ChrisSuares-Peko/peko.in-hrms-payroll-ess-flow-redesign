import { Card, Steps } from 'antd';

import { GetDocumentById } from '../../types/documentDetails';

interface Props {
    documentData: GetDocumentById | null;
}

const STEP2_CONFIG: Record<string, { title: string; stepStatus: 'finish' | 'error' | 'wait' | 'process' }> = {
    ACCEPTED: { title: 'Accepted', stepStatus: 'finish' },
    REJECTED: { title: 'Rejected', stepStatus: 'error' },
};

const QuotationTimeline = ({ documentData }: Props) => {
    const status = documentData?.status ?? 'PENDING';
    const step2 = STEP2_CONFIG[status];
    const isStep2Active = !!step2;
    const issueDate = documentData?.documentDate ?? '';

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
                        description: isStep2Active ? issueDate : '',
                        status: step2?.stepStatus ?? 'wait',
                    },
                ]}
            />
        </Card>
    );
};

export default QuotationTimeline;
