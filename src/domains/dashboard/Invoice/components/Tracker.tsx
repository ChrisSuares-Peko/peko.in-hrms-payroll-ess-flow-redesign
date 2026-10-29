import React from 'react';

import { Steps, Typography } from 'antd';
import { StepsProps } from 'antd/lib';

const customDot: StepsProps['progressDot'] = (dot, { status, index }) => <>{dot}</>;

interface TrackerProps {
    data: any;
}

const { Text } = Typography;

const Tracker = ({ data }: TrackerProps) => {
    const steps = [
        {
            title: <Text className="text-sm">Invoice Added</Text>, // Apply the custom class here
            description: data?.invoiceDetails?.invoiceDate,
        },
    ];

    if (data?.paymentMode === 'payment link') {
        steps.push({
            title: <Text className="text-sm">Payment Link Created</Text>,
            description: data?.invoiceDetails?.invoiceDate,
        });
    } else {
        steps.push({
            title: <Text className="text-sm">Payment Pending</Text>,
            description: data?.dueDate,
        });
    }

    if (data?.status === 'PAID') {
        steps.push({
            title: <Text className="text-sm">Paid</Text>,
            description: data?.updatedAt.split('T')[0], // Assuming updatedAt is the time when payment is completed
        });
    } else {
        steps.push({
            title: <Text className="text-sm">Not Paid</Text>,
            description: '',
        });
    }

    // Determine the current step based on the status
    let currentStep = 0;
    if (data?.status === 'PAID') {
        currentStep = 2; // Paid step
    } else if (data?.paymentMode === 'payment link') {
        currentStep = 1; // Payment link created step
    } else {
        currentStep = 1; // Payment pending step
    }

    return <Steps current={currentStep} progressDot={customDot} items={steps} />;
};

export default React.memo(Tracker);
