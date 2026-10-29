import React from 'react';

import { Flex, Typography } from 'antd';

import { TabLayout } from '../../../utils/vpsTabUtils';

const { Title } = Typography;

interface Props {
    pricePerGb: number | null;
    minStorageGb?: number | null;
    maxStorageGb?: number | null;
}

const AdditionalStorageTab: React.FC<Props> = ({ pricePerGb, minStorageGb, maxStorageGb }) => {
    const priceNum = typeof pricePerGb === 'number' ? pricePerGb : Number(pricePerGb);
    const hasValidPrice = Number.isFinite(priceNum) && priceNum > 0;
    const hasStorageRange =
        Number.isFinite(Number(minStorageGb)) && Number.isFinite(Number(maxStorageGb));

    const planDetails = [
        hasStorageRange
            ? `Choose any storage size from ${minStorageGb} GB to ${maxStorageGb} GB.`
            : null,
        'Billed per GB per month, on the same billing cycle as your linked VPS plan.',
        'Available as an add-on with compatible VPS Server plans.',
    ].filter(Boolean) as string[];

    return (
        <TabLayout>
            <div className="mb-4">
                <Title level={5} style={{ marginBottom: 6 }}>
                    Acronis Cyber Backup At{' '}
                    <span className="text-lightRed">
                        {hasValidPrice ? `₹${priceNum.toFixed(2)}/GB/month` : '—'}
                    </span>
                </Title>
                <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                    Backup storage add-on, purchased together with your VPS Server plan.
                </p>
            </div>
            <div>
                <Title level={5} style={{ marginBottom: 8 }}>
                    Plan Details
                </Title>
                <Flex vertical gap={6}>
                    {planDetails.map(item => (
                        <Flex key={item} align="flex-start" gap={8}>
                            <span
                                className="text-gray-600 leading-5 shrink-0"
                                style={{ fontSize: 16 }}
                            >
                                •
                            </span>
                            <span className="text-gray-600" style={{ fontSize: 13 }}>{item}</span>
                        </Flex>
                    ))}
                </Flex>
            </div>
        </TabLayout>
    );
};

export default AdditionalStorageTab;
