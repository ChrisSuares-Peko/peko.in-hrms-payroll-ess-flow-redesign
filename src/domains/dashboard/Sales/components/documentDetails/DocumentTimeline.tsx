import { useMemo } from 'react';

import { Card, Steps } from 'antd';

import { TIMELINE_CONFIG, FINAL_STATUSES } from '../../constants/documentDetails';
import { GetDocumentById } from '../../types/documentDetails';
import { DocumentType } from '../../types/documents';
import { formatDate } from '../../utils/helperFunctions';

interface Props {
    documentData: GetDocumentById | null;
    documentType: DocumentType;
}

const DocumentTimeline = ({ documentData, documentType }: Props) => {
    const config = TIMELINE_CONFIG[documentType];
    const isFinal = documentData?.status === FINAL_STATUSES[documentType];
    const currentStep = isFinal ? 2 : 1;

    const timelineSteps = useMemo(
        () => [
            {
                title: config.steps[0],
                description: formatDate(documentData?.documentDate),
            },
            {
                title: config.steps[1],
                description: currentStep > 1 ? formatDate(documentData?.documentDate) : undefined,
            },
            {
                title: config.finalStep(documentData?.status),
                description: isFinal ? formatDate(documentData?.paymentDate) : undefined,
            },
        ],
        [documentData, config, isFinal, currentStep]
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

export default DocumentTimeline;
