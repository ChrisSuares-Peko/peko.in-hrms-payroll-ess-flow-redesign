import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Badge, Col, Divider, Flex, Row, Typography } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { complaintStatusLabel, findColorByStatus } from '../../utils/complaintStatus';

interface ComplaintMobileRowProps {
    complaint: any;
}

const ComplaintMobileRow: React.FC<ComplaintMobileRowProps> = ({ complaint }) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const { createdAt, issueType, description, status, bbpsSupportHistory } = complaint;

    const details = [
        { label: 'Complaint ID', value: bbpsSupportHistory?.complaintId || 'N/A' },
        {
            label: 'B-Connect Transaction ID',
            value: bbpsSupportHistory?.requestBody?.txnRefId || 'N/A',
        },
        { label: 'Assigned To', value: bbpsSupportHistory?.complaintAssigned || 'N/A' },
        { label: 'Description', value: description || '-' },
    ];

    return (
        <div className="px-3 py-5 rounded-md">
            <Row align="middle">
                <Col span={7}>
                    <Flex vertical justify="start" className="pr-4">
                        <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                        <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                    </Flex>
                </Col>
                <Col span={9} className="pr-4">
                    <Flex justify="start">
                        <Typography.Text>{issueType || '-'}</Typography.Text>
                    </Flex>
                </Col>
                <Col span={7}>
                    <Flex justify="start">
                        <Badge
                            status="warning"
                            text={complaintStatusLabel(status)}
                            style={{
                                color: findColorByStatus(status).text,
                                backgroundColor: findColorByStatus(status).background,
                                padding: '2px 7px',
                                border: '1px ',
                                borderRadius: '15px',
                            }}
                        />
                    </Flex>
                </Col>
                <Col span={1}>
                    <RightOutlined
                        role="button"
                        aria-label={showMore ? 'Hide complaint details' : 'Show complaint details'}
                        onClick={() => setShowMore(!showMore)}
                        className={`collapse-icon ${showMore ? 'open' : ''}`}
                    />
                </Col>
            </Row>
            {showMore && (
                <Flex vertical gap={10} className="p-6 mt-5 rounded-md bg-bgLightGray">
                    {details.map(({ label, value }) => (
                        <Flex justify="space-between" gap={12} className="w-full" key={label}>
                            <Typography.Text className="font-normal">{label} :</Typography.Text>
                            <Typography.Text className="font-normal text-right">
                                {value}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
            )}
            <Divider className="border border-solid" />
        </div>
    );
};

export default React.memo(ComplaintMobileRow);
