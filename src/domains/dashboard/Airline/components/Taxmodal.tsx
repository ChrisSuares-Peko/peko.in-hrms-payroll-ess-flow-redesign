import React from 'react';

import { Divider, Flex, Modal, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formatNumberWithLocalString } from '@utils/priceFormat';

interface modalProps {
    handleCancel: () => void;
    open: boolean;
    taxValues: any;
    totalTax: number;
}



const Taxmodal = ({ handleCancel, open, taxValues, totalTax }: modalProps) => (
        <Modal
            title="Tax Breakdown"
            open={open}
            onCancel={handleCancel}
            footer={null}
            bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
            <Divider />
            <Content className="px-4">
                <Typography.Paragraph className="font-medium text-lg">
                    Total Tax: ₹ {formatNumberWithLocalString(totalTax)}
                </Typography.Paragraph>

                {/* <Typography.Paragraph strong>
                    {passengerType} (x{passengerCount}) - Total Tax: ₹{' '}
                    {formatNumberWithLocalString(passengerTotalTax)}
                </Typography.Paragraph> */}

                {/* <Typography.Text type="secondary" className="ml-2">
                    (Per Passenger)
                </Typography.Text> */}

                {taxValues.map((breakdown: any, idx: any) => (
                    <div key={idx} style={{ marginTop: '1rem' }}>
                        <Flex vertical gap={4} style={{ marginTop: '0.5rem' }}>
                            <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                                <Typography.Text style={{ flex: '1' }}>
                                    {breakdown.key}:
                                </Typography.Text>
                                <Typography.Text
                                    className="font-medium"
                                    style={{ minWidth: '80px', textAlign: 'right' }}
                                >
                                    ₹ {formatNumberWithLocalString(breakdown.value)}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                        <Divider />
                    </div>
                ))}
            </Content>
        </Modal>
    );

export default Taxmodal;
